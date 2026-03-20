import { Readable, PassThrough } from 'stream';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import {
  S3Client,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from './logger.js';
import { config } from '../config/env.js';
import { deleteS3ObjectsByPrefix } from './body-storage.js';

const LOCAL_ATTACHMENTS_DIR = path.join(
  process.cwd(),
  config.attachments.localDir,
);

let s3Client: S3Client | null = null;
if (config.isProduction) {
  s3Client = new S3Client({ region: config.aws.region });
}

async function ensureLocalDirectory(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    logger.error(
      'AttachmentStorage',
      'Failed to create attachments directory',
      { error },
    );
    throw error;
  }
}

interface UploadOptions {
  emailAccountId: string;
  attachmentId: string;
  mimeType: string;
  stream: Readable;
}

interface UploadResult {
  storageKey: string;
  size: number;
}

/**
 * Upload an attachment to storage (S3 in production, local disk in development).
 * Key format: {emailAccountId}/{attachmentId}
 */
export async function uploadAttachment(
  options: UploadOptions,
): Promise<UploadResult> {
  const { emailAccountId, attachmentId, mimeType, stream } = options;
  const storageKey = `${emailAccountId}/${attachmentId}`;

  if (config.isProduction && s3Client) {
    return uploadToS3(storageKey, mimeType, stream);
  } else {
    return uploadToLocalDisk(storageKey, stream);
  }
}

async function uploadToS3(
  key: string,
  mimeType: string,
  stream: Readable,
): Promise<UploadResult> {
  if (!s3Client) {
    throw new Error('S3 client not initialized');
  }

  let size = 0;
  const passThrough = new PassThrough();

  passThrough.on('data', (chunk: Buffer) => {
    size += chunk.length;
  });

  stream.pipe(passThrough);

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: config.attachments.s3Bucket,
      Key: key,
      Body: passThrough,
      ContentType: mimeType,
    },
    partSize: 5 * 1024 * 1024,
    queueSize: 4,
  });

  await upload.done();
  logger.info('AttachmentStorage', 'Uploaded attachment to S3', { key, size });

  return { storageKey: key, size };
}

async function uploadToLocalDisk(
  key: string,
  stream: Readable,
): Promise<UploadResult> {
  const filePath = path.join(LOCAL_ATTACHMENTS_DIR, key);
  await ensureLocalDirectory(path.dirname(filePath));

  const writeStream = createWriteStream(filePath);
  await pipeline(stream, writeStream);

  const stats = await fs.stat(filePath);
  logger.info('AttachmentStorage', 'Uploaded attachment to local disk', {
    key,
    size: stats.size,
  });

  return { storageKey: key, size: stats.size };
}

/**
 * Get a signed download URL for an attachment.
 * Accepts the full storageKey from the attachment record.
 */
export async function getAttachmentDownloadUrl(
  storageKey: string,
  expiresIn: number = 3600,
): Promise<string> {
  if (config.isProduction && s3Client) {
    const command = new GetObjectCommand({
      Bucket: config.attachments.s3Bucket,
      Key: storageKey,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } else {
    return `/api/attachments/download/${storageKey}`;
  }
}

/**
 * Get the local file path for an attachment (development only).
 * Accepts the full storageKey from the attachment record.
 */
export function getLocalAttachmentPath(storageKey: string): string {
  if (config.isProduction) {
    throw new Error('Local attachment paths are only available in development');
  }
  return path.join(LOCAL_ATTACHMENTS_DIR, storageKey);
}

/**
 * Stream an attachment from storage.
 * Accepts the full storageKey from the attachment record.
 */
export async function streamAttachment(
  storageKey: string,
): Promise<Readable> {
  if (config.isProduction && s3Client) {
    const command = new GetObjectCommand({
      Bucket: config.attachments.s3Bucket,
      Key: storageKey,
    });

    const response = await s3Client.send(command);
    if (!response.Body) {
      throw new Error('No body in S3 response');
    }
    return response.Body as Readable;
  } else {
    const filePath = getLocalAttachmentPath(storageKey);
    const { createReadStream } = await import('fs');
    return createReadStream(filePath);
  }
}

/**
 * Delete an attachment from storage.
 * Accepts the full storageKey from the attachment record.
 */
export async function deleteAttachment(storageKey: string): Promise<void> {
  if (config.isProduction && s3Client) {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: config.attachments.s3Bucket,
      Key: storageKey,
    });
    await s3Client.send(command);
    logger.info('AttachmentStorage', 'Deleted attachment from S3', {
      key: storageKey,
    });
  } else {
    const filePath = getLocalAttachmentPath(storageKey);
    try {
      await fs.unlink(filePath);
      logger.info('AttachmentStorage', 'Deleted attachment from local disk', {
        key: storageKey,
      });
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
}

/**
 * Bulk-delete all attachments for an account using the account prefix.
 */
export async function deleteAttachmentsByAccount(
  emailAccountId: string,
): Promise<void> {
  await deleteS3ObjectsByPrefix(
    config.attachments.s3Bucket,
    `${emailAccountId}/`,
  );
}
