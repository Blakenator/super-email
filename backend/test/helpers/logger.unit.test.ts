/**
 * Logger Unit Tests
 * 
 * Tests the logger helper functions.
 * Note: These tests capture console output to verify logging behavior.
 */

import { expect } from 'chai';
import sinon from 'sinon';

describe('logger helpers', function () {
  let consoleDebugStub: sinon.SinonStub;
  let consoleLogStub: sinon.SinonStub;
  let consoleWarnStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;

  beforeEach(() => {
    consoleDebugStub = sinon.stub(console, 'debug');
    consoleLogStub = sinon.stub(console, 'log');
    consoleWarnStub = sinon.stub(console, 'warn');
    consoleErrorStub = sinon.stub(console, 'error');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('logger.info', () => {
    it('should log info messages with timestamp and context', async () => {
      // Import fresh to ensure stubs are in place
      const { logger } = await import('../../helpers/logger.js');
      
      logger.info('TestContext', 'Test message');
      
      expect(consoleLogStub.calledOnce).to.be.true;
      const loggedMessage = consoleLogStub.firstCall.args[0];
      expect(loggedMessage).to.include('[INFO]');
      expect(loggedMessage).to.include('[TestContext]');
      expect(loggedMessage).to.include('Test message');
    });

    it('should include data when provided', async () => {
      const { logger } = await import('../../helpers/logger.js');
      
      logger.info('Context', 'Message', { key: 'value' });
      
      expect(consoleLogStub.calledOnce).to.be.true;
      const loggedMessage = consoleLogStub.firstCall.args[0];
      expect(loggedMessage).to.include('{"key":"value"}');
    });
  });

  describe('logger.error', () => {
    it('should log error messages', async () => {
      const { logger } = await import('../../helpers/logger.js');
      
      logger.error('ErrorContext', 'Error occurred', { code: 500 });
      
      expect(consoleErrorStub.calledOnce).to.be.true;
      const loggedMessage = consoleErrorStub.firstCall.args[0];
      expect(loggedMessage).to.include('[ERROR]');
      expect(loggedMessage).to.include('[ErrorContext]');
      expect(loggedMessage).to.include('Error occurred');
    });
  });

  describe('logger.warn', () => {
    it('should log warning messages', async () => {
      const { logger } = await import('../../helpers/logger.js');
      
      logger.warn('WarnContext', 'Warning message');
      
      expect(consoleWarnStub.calledOnce).to.be.true;
      const loggedMessage = consoleWarnStub.firstCall.args[0];
      expect(loggedMessage).to.include('[WARN]');
      expect(loggedMessage).to.include('[WarnContext]');
    });
  });

  describe('logger.response', () => {
    it('should log error responses with error level', async () => {
      const { logger } = await import('../../helpers/logger.js');
      
      logger.response('TestOperation', 100, new Error('Test error'));
      
      expect(consoleErrorStub.calledOnce).to.be.true;
    });
  });
});
