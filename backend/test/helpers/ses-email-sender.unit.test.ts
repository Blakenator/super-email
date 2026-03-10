/**
 * SES Email Sender Unit Tests
 *
 * Tests the development-mode path and the raw email building logic.
 */

import { expect } from 'chai';

describe('ses-email-sender helpers', function () {
  describe('sendEmailViaSes (dev mode)', () => {
    it('should return a mock message ID in development', async () => {
      process.env.NODE_ENV = 'test';
      const { sendEmailViaSes } = await import('../../helpers/ses-email-sender.js');

      const result = await sendEmailViaSes('sender@custom.example.com', 'Sender Name', {
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        text: 'Hello from test',
        html: '<p>Hello from test</p>',
      });

      expect(result).to.have.property('messageId');
      expect(result.messageId).to.be.a('string');
      expect(result.messageId).to.include('dev-ses-');
      expect(result.messageId).to.include('custom.example.com');
    });

    it('should handle emails with cc and bcc', async () => {
      const { sendEmailViaSes } = await import('../../helpers/ses-email-sender.js');

      const result = await sendEmailViaSes('sender@test.com', null, {
        to: ['to@example.com'],
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
        subject: 'CC/BCC Test',
        text: 'Body',
      });

      expect(result.messageId).to.be.a('string');
    });

    it('should handle emails without a from name', async () => {
      const { sendEmailViaSes } = await import('../../helpers/ses-email-sender.js');

      const result = await sendEmailViaSes('no-name@test.com', null, {
        to: ['recipient@example.com'],
        subject: 'No Name',
        text: 'No display name test',
      });

      expect(result.messageId).to.be.a('string');
    });
  });
});
