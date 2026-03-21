import fs from 'fs/promises';
import path from 'path';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { logger } from './logger.js';
import { config } from '../config/env.js';
import { resolveBackendDataPath } from '../config/paths.js';

function localEmailBodiesRoot(): string {
  return resolveBackendDataPath(config.emailBodies.localDir);
}

function localBodyFilePath(emailAccountId: string, emailId: string): string {
  return path.join(
    localEmailBodiesRoot(),
    emailAccountId,
    `${emailId}.json`,
  );
}

let s3Client: S3Client | null = null;
if (config.isProduction) {
  s3Client = new S3Client({ region: config.aws.region });
}

async function ensureLocalDirectory(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

function getStorageKey(emailAccountId: string, emailId: string): string {
  return `${emailAccountId}/${emailId}`;
}

export interface EmailBodyData {
  textBody: string | null;
  htmlBody: string | null;
}

/**
 * Store an email body in S3 (production) or local filesystem (development).
 * Key format: {emailAccountId}/{emailId}
 */
export async function storeEmailBody(
  emailAccountId: string,
  emailId: string,
  textBody: string | null,
  htmlBody: string | null,
): Promise<string> {
  const storageKey = getStorageKey(emailAccountId, emailId);
  const body = JSON.stringify({ textBody, htmlBody });

  if (config.isProduction && s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.emailBodies.s3Bucket,
        Key: storageKey,
        Body: body,
        ContentType: 'application/json',
      }),
    );
    logger.debug('BodyStorage', 'Stored email body in S3', { storageKey });
  } else {
    const filePath = localBodyFilePath(emailAccountId, emailId);
    await ensureLocalDirectory(path.dirname(filePath));
    await fs.writeFile(filePath, body, 'utf-8');
    logger.debug('BodyStorage', 'Stored email body to local disk', { storageKey });
  }

  return storageKey;
}

/**
 * Retrieve an email body from storage.
 */
export async function getEmailBody(
  emailAccountId: string,
  emailId: string,
): Promise<EmailBodyData> {
  const storageKey = getStorageKey(emailAccountId, emailId);

  if (config.isProduction && s3Client) {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: config.emailBodies.s3Bucket,
        Key: storageKey,
      }),
    );
    const raw = await response.Body?.transformToString('utf-8');
    if (!raw) {
      throw new Error(`Empty body response from S3 for key ${storageKey}`);
    }
    return JSON.parse(raw) as EmailBodyData;
  } else {
    const filePath = localBodyFilePath(emailAccountId, emailId);
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as EmailBodyData;
  }
}

/**
 * Retrieve multiple email bodies in parallel (for thread view).
 */
export async function getEmailBodies(
  keys: { emailAccountId: string; emailId: string }[],
): Promise<Map<string, EmailBodyData>> {
  const results = new Map<string, EmailBodyData>();

  const settled = await Promise.allSettled(
    keys.map(async ({ emailAccountId, emailId }) => {
      const body = await getEmailBody(emailAccountId, emailId);
      return { emailId, body };
    }),
  );

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      results.set(result.value.emailId, result.value.body);
    } else {
      logger.error('BodyStorage', 'Failed to fetch email body', {
        error: result.reason instanceof Error ? result.reason.message : result.reason,
      });
    }
  }

  return results;
}

/**
 * Delete a single email body from storage.
 */
export async function deleteEmailBody(
  emailAccountId: string,
  emailId: string,
): Promise<void> {
  const storageKey = getStorageKey(emailAccountId, emailId);

  if (config.isProduction && s3Client) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: config.emailBodies.s3Bucket,
        Key: storageKey,
      }),
    );
    logger.debug('BodyStorage', 'Deleted email body from S3', { storageKey });
  } else {
    const filePath = localBodyFilePath(emailAccountId, emailId);
    try {
      await fs.unlink(filePath);
      logger.debug('BodyStorage', 'Deleted email body from local disk', {
        storageKey,
        filePath,
      });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        return;
      }
      throw err;
    }
  }
}

/**
 * Bulk-delete all S3 objects under a given prefix in a bucket.
 * Used for account deletion cleanup on both email-bodies and attachments buckets.
 * In development, recursively deletes the local directory.
 */
export async function deleteS3ObjectsByPrefix(
  bucket: string,
  prefix: string,
): Promise<number> {
  let deleted = 0;

  if (config.isProduction && s3Client) {
    let continuationToken: string | undefined;

    do {
      const listResponse = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      const objects = listResponse.Contents;
      if (objects && objects.length > 0) {
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: objects.map((obj) => ({ Key: obj.Key! })),
              Quiet: true,
            },
          }),
        );
        deleted += objects.length;
      }

      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);

    logger.info('BodyStorage', `Bulk-deleted ${deleted} objects from S3`, {
      bucket,
      prefix,
    });
  } else {
    let localBase: string;
    if (bucket === config.emailBodies.s3Bucket) {
      localBase = localEmailBodiesRoot();
    } else if (bucket === config.attachments.s3Bucket) {
      localBase = resolveBackendDataPath(config.attachments.localDir);
    } else {
      localBase = resolveBackendDataPath(path.join('data', bucket));
    }

    const dirPath = path.join(localBase, prefix);
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
      logger.info('BodyStorage', `Deleted local directory ${dirPath}`);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        // ignore
      } else {
        throw err;
      }
    }
  }

  return deleted;
}

/**
 * Delete all email bodies for an account.
 */
export async function deleteEmailBodiesByAccount(
  emailAccountId: string,
): Promise<void> {
  await deleteS3ObjectsByPrefix(
    config.emailBodies.s3Bucket,
    `${emailAccountId}/`,
  );
}
