/**
 * Mock factories for AWS SDK services
 * Used for testing code that interacts with S3 and Secrets Manager
 */

import sinon from 'sinon';

// ============================================================================
// S3 Client Mocks
// ============================================================================

export interface MockS3ClientOptions {
  uploadError?: Error;
  downloadError?: Error;
  deleteError?: Error;
  objectBody?: Buffer | string;
}

export function createMockS3Client(options: MockS3ClientOptions = {}) {
  const mockSend = sinon.stub();

  // PutObjectCommand (upload)
  if (options.uploadError) {
    mockSend.withArgs(sinon.match({ constructor: { name: 'PutObjectCommand' } }))
      .rejects(options.uploadError);
  } else {
    mockSend.withArgs(sinon.match.has('Body'))
      .resolves({ ETag: '"mock-etag"' });
  }

  // GetObjectCommand (download)
  if (options.downloadError) {
    mockSend.withArgs(sinon.match({ constructor: { name: 'GetObjectCommand' } }))
      .rejects(options.downloadError);
  } else {
    mockSend.resolves({
      Body: options.objectBody || Buffer.from('mock file content'),
      ContentType: 'application/octet-stream',
      ContentLength: 17,
    });
  }

  // DeleteObjectCommand
  if (options.deleteError) {
    mockSend.withArgs(sinon.match({ constructor: { name: 'DeleteObjectCommand' } }))
      .rejects(options.deleteError);
  }

  return {
    send: mockSend,
    destroy: sinon.stub(),
  };
}

/**
 * Create mock functions for S3 operations used in attachment-storage.ts
 */
export function createMockS3Operations() {
  return {
    uploadAttachment: sinon.stub().resolves({
      storageKey: 'mock-storage-key',
      size: 1024,
    }),
    getAttachmentDownloadUrl: sinon.stub().resolves('https://mock-s3-url.com/attachment'),
    streamAttachment: sinon.stub().resolves(Buffer.from('mock content')),
    deleteAttachment: sinon.stub().resolves(),
  };
}

// ============================================================================
// Secrets Manager Mocks
// ============================================================================

export interface MockSecretsManagerOptions {
  secrets?: Record<string, any>;
  getError?: Error;
  createError?: Error;
  updateError?: Error;
  deleteError?: Error;
}

export function createMockSecretsManagerClient(options: MockSecretsManagerOptions = {}) {
  const secrets = options.secrets || {};
  const mockSend = sinon.stub();

  // GetSecretValueCommand
  mockSend.callsFake(async (command: any) => {
    const commandName = command.constructor?.name || '';
    
    if (commandName === 'GetSecretValueCommand' || command.SecretId) {
      if (options.getError) {
        throw options.getError;
      }
      const secretId = command.SecretId || command.input?.SecretId;
      if (secrets[secretId]) {
        return {
          SecretString: JSON.stringify(secrets[secretId]),
        };
      }
      const error = new Error('Secrets Manager can\'t find the specified secret.');
      (error as any).name = 'ResourceNotFoundException';
      throw error;
    }

    if (commandName === 'CreateSecretCommand') {
      if (options.createError) {
        throw options.createError;
      }
      return { ARN: 'arn:aws:secretsmanager:us-east-1:123456789:secret:test' };
    }

    if (commandName === 'UpdateSecretCommand') {
      if (options.updateError) {
        throw options.updateError;
      }
      return { ARN: 'arn:aws:secretsmanager:us-east-1:123456789:secret:test' };
    }

    if (commandName === 'DeleteSecretCommand') {
      if (options.deleteError) {
        throw options.deleteError;
      }
      return {};
    }

    return {};
  });

  return {
    send: mockSend,
    destroy: sinon.stub(),
  };
}

/**
 * Create mock functions for secrets operations used in secrets.ts
 */
export function createMockSecretsOperations() {
  return {
    storeImapCredentials: sinon.stub().resolves(),
    getImapCredentials: sinon.stub().resolves({ username: 'test', password: 'test-pass' }),
    deleteImapCredentials: sinon.stub().resolves(),
    storeSmtpCredentials: sinon.stub().resolves(),
    getSmtpCredentials: sinon.stub().resolves({ username: 'test', password: 'test-pass' }),
    deleteSmtpCredentials: sinon.stub().resolves(),
  };
}
