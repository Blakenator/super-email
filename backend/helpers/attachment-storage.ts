import { Readable } from 'stream';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from './logger.js';
import { config } from '../config/env.js';

const LOCAL_ATTACHMENTS_DIR = path.join(process.cwd(), config.attachments.localDir);

// Initialize S3 client for production
let s3Client: S3Client | null = null;
if (config.isProduction) {
  s3Client = new S3Client({ region: config.aws.region });
}

// Ensure local attachments directory exists
async function ensureLocalDirectory() {
  try {
    await fs.mkdir(LOCAL_ATTACHMENTS_DIR, { recursive: true });
  } catch (error) {
    logger.error('AttachmentStorage', 'Failed to create attachments directory', { error });
    throw error;
  }
}

interface UploadOptions {
  attachmentId: string; // Use the attachment's UUID as the storage key
  mimeType: string;
  stream: Readable;
}

interface UploadResult {
  storageKey: string;
  size: number;
}

/**
 * Upload an attachment to storage (S3 in production, local disk in development)
 * Uses the attachment UUID as the storage key for a flat bucket structure
 * Returns the storage key and size in bytes
 */
export async function uploadAttachment(
  options: UploadOptions
): Promise<UploadResult> {
  const { attachmentId, mimeType, stream } = options;
  
  // Use the attachment UUID directly as the storage key (flat structure)
  const storageKey = attachmentId;

  if (config.isProduction && s3Client) {
    return uploadToS3(storageKey, mimeType, stream);
  } else {
    return uploadToLocalDisk(storageKey, stream);
  }
}

/**
 * Upload to S3 in production
 */
async function uploadToS3(
  key: string,
  mimeType: string,
  stream: Readable
): Promise<UploadResult> {
  if (!s3Client) {
    throw new Error('S3 client not initialized');
  }

  // Collect stream data to get size
  const chunks: Buffer[] = [];
  stream.on('data', (chunk) => chunks.push(chunk));
  
  await new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  const buffer = Buffer.concat(chunks);
  const size = buffer.length;

  const command = new PutObjectCommand({
    Bucket: config.attachments.s3Bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  logger.info('AttachmentStorage', 'Uploaded attachment to S3', { key, size });

  return { storageKey: key, size };
}

/**
 * Upload to local disk in development (flat structure, no subdirectories)
 */
async function uploadToLocalDisk(
  key: string,
  stream: Readable
): Promise<UploadResult> {
  await ensureLocalDirectory();

  const filePath = path.join(LOCAL_ATTACHMENTS_DIR, key);

  const writeStream = createWriteStream(filePath);
  await pipeline(stream, writeStream);

  const stats = await fs.stat(filePath);
  logger.info('AttachmentStorage', 'Uploaded attachment to local disk', { key, size: stats.size });

  return { storageKey: key, size: stats.size };
}

/**
 * Get a signed download URL for an attachment
 * In production, returns a presigned S3 URL
 * In development, returns a local API endpoint URL
 * Uses the attachment ID (UUID) as the storage key
 */
export async function getAttachmentDownloadUrl(
  attachmentId: string,
  expiresIn: number = 3600
): Promise<string> {
  if (config.isProduction && s3Client) {
    const command = new GetObjectCommand({
      Bucket: config.attachments.s3Bucket,
      Key: attachmentId,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } else {
    // In development, return a simple API path using the attachment UUID
    return `/api/attachments/download/${attachmentId}`;
  }
}

/**
 * Get the local file path for an attachment (development only)
 * Uses the attachment UUID as the filename
 */
export function getLocalAttachmentPath(attachmentId: string): string {
  if (config.isProduction) {
    throw new Error('Local attachment paths are only available in development');
  }
  return path.join(LOCAL_ATTACHMENTS_DIR, attachmentId);
}

/**
 * Stream an attachment from storage
 * Uses the attachment UUID as the storage key
 */
export async function streamAttachment(attachmentId: string): Promise<Readable> {
  if (config.isProduction && s3Client) {
    const command = new GetObjectCommand({
      Bucket: config.attachments.s3Bucket,
      Key: attachmentId,
    });

    const response = await s3Client.send(command);
    if (!response.Body) {
      throw new Error('No body in S3 response');
    }
    return response.Body as Readable;
  } else {
    const filePath = getLocalAttachmentPath(attachmentId);
    const { createReadStream } = await import('fs');
    return createReadStream(filePath);
  }
}

/**
 * Delete an attachment from storage
 * Uses the attachment UUID as the storage key
 */
export async function deleteAttachment(attachmentId: string): Promise<void> {
  if (config.isProduction && s3Client) {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: config.attachments.s3Bucket,
      Key: attachmentId,
    });
    await s3Client.send(command);
    logger.info('AttachmentStorage', 'Deleted attachment from S3', { key: attachmentId });
  } else {
    const filePath = getLocalAttachmentPath(attachmentId);
    await fs.unlink(filePath);
    logger.info('AttachmentStorage', 'Deleted attachment from local disk', { key: attachmentId });
  }
}
