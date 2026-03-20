/**
 * Push Notification Unit Tests
 *
 * Tests sendNewEmailNotifications with all three detail levels,
 * batching/cap logic, content formatting, and edge cases.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { User, PushToken, NotificationDetailLevel } from '../../db/models/index.js';
import {
  sendNewEmailNotifications,
  stripHtmlForSnippet,
  type NewEmailInfo,
} from '../../helpers/push-notifications.js';

function createMockEmails(count: number): NewEmailInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `email-${i + 1}`,
    subject: `Subject ${i + 1}`,
    fromName: `Sender ${i + 1}`,
    fromAddress: `sender${i + 1}@example.com`,
    bodyPreview: `Body text for email ${i + 1}`,
  }));
}

function createMockUser(detailLevel: NotificationDetailLevel) {
  return { notificationDetailLevel: detailLevel };
}

describe('push-notifications helpers', function () {
  let fetchStub: sinon.SinonStub;
  let userFindByPkStub: sinon.SinonStub;
  let pushTokenFindAllStub: sinon.SinonStub;
  let pushTokenUpdateStub: sinon.SinonStub;

  const expoToken = 'ExponentPushToken[abc123]';

  beforeEach(() => {
    fetchStub = sinon.stub(globalThis, 'fetch').resolves({
      ok: true,
      json: async () => ({ data: [{ status: 'ok', id: 'ticket-1' }] }),
    } as any);

    userFindByPkStub = sinon.stub(User, 'findByPk');
    pushTokenFindAllStub = sinon.stub(PushToken, 'findAll');
    pushTokenUpdateStub = sinon.stub(PushToken, 'update').resolves([1]);

    pushTokenFindAllStub.resolves([
      { token: expoToken, platform: 'ios', deviceName: 'iPhone' },
    ] as any);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('sendNewEmailNotifications', () => {
    describe('empty input', () => {
      it('should do nothing for an empty email array', async () => {
        await sendNewEmailNotifications('user-1', [], 'user@example.com');

        expect(userFindByPkStub.called).to.be.false;
        expect(fetchStub.called).to.be.false;
      });
    });

    describe('FULL detail level', () => {
      beforeEach(() => {
        userFindByPkStub.resolves(createMockUser(NotificationDetailLevel.FULL));
      });

      it('should send individual notifications with subject and body snippet', async () => {
        const emails = createMockEmails(1);
        await sendNewEmailNotifications('user-1', emails, 'user@example.com');

        expect(fetchStub.calledOnce).to.be.true;
        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body).to.have.length(1);
        expect(body[0].title).to.equal('New email from Sender 1');
        expect(body[0].body).to.include('Subject 1');
        expect(body[0].body).to.include('Body text for email 1');
        expect(body[0].data.emailId).to.equal('email-1');
      });

      it('should send N individual notifications for N emails', async () => {
        const emails = createMockEmails(5);

        // Expect 5 tickets in response
        fetchStub.resolves({
          ok: true,
          json: async () => ({
            data: emails.map((_, i) => ({ status: 'ok', id: `ticket-${i}` })),
          }),
        } as any);

        await sendNewEmailNotifications('user-1', emails, 'user@example.com');

        expect(fetchStub.calledOnce).to.be.true;
        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body).to.have.length(5);

        body.forEach((msg: any, i: number) => {
          expect(msg.title).to.equal(`New email from Sender ${i + 1}`);
          expect(msg.body).to.include(`Subject ${i + 1}`);
          expect(msg.data.emailId).to.equal(`email-${i + 1}`);
        });
      });

      it('should include bodyPreview in notification', async () => {
        const emails: NewEmailInfo[] = [{
          id: 'email-html',
          subject: 'HTML Email',
          fromName: 'HTML Sender',
          fromAddress: 'html@example.com',
          bodyPreview: 'Hello & welcome to our newsletter!',
        }];

        await sendNewEmailNotifications('user-1', emails, 'user@example.com');

        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body[0].body).to.include('Hello & welcome');
      });
    });

    describe('MINIMAL detail level', () => {
      beforeEach(() => {
        userFindByPkStub.resolves(createMockUser(NotificationDetailLevel.MINIMAL));
      });

      it('should send individual notifications with subject only (no snippet)', async () => {
        const emails = createMockEmails(2);

        fetchStub.resolves({
          ok: true,
          json: async () => ({
            data: [{ status: 'ok', id: 'ticket-1' }, { status: 'ok', id: 'ticket-2' }],
          }),
        } as any);

        await sendNewEmailNotifications('user-1', emails, 'user@example.com');

        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body).to.have.length(2);
        expect(body[0].title).to.equal('New email from Sender 1');
        expect(body[0].body).to.equal('Subject 1');
        expect(body[1].body).to.equal('Subject 2');
      });
    });

    describe('AGGREGATE_ONLY detail level', () => {
      beforeEach(() => {
        userFindByPkStub.resolves(createMockUser(NotificationDetailLevel.AGGREGATE_ONLY));
      });

      it('should send single aggregate notification for one email', async () => {
        const emails = createMockEmails(1);
        await sendNewEmailNotifications('user-1', emails, 'user@example.com');

        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body).to.have.length(1);
        expect(body[0].title).to.equal('New email');
        expect(body[0].body).to.equal('You have a new email in user@example.com');
        expect(body[0].data.emailCount).to.equal(1);
        expect(body[0].data).to.not.have.property('emailId');
      });

      it('should send single aggregate notification for multiple emails', async () => {
        const emails = createMockEmails(7);
        await sendNewEmailNotifications('user-1', emails, 'user@example.com');

        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body).to.have.length(1);
        expect(body[0].title).to.equal('7 new emails');
        expect(body[0].body).to.equal('You have 7 new emails in user@example.com');
        expect(body[0].data.emailCount).to.equal(7);
      });

      it('should send 1 notification even for >20 emails', async () => {
        const emails = createMockEmails(25);
        await sendNewEmailNotifications('user-1', emails, 'user@example.com');

        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body).to.have.length(1);
        expect(body[0].title).to.equal('25 new emails');
        expect(body[0].data.emailCount).to.equal(25);
      });
    });

    describe('cap at 20 individual notifications', () => {
      beforeEach(() => {
        userFindByPkStub.resolves(createMockUser(NotificationDetailLevel.FULL));
      });

      it('should cap at 20 individual + 1 summary for >20 emails', async () => {
        const emails = createMockEmails(25);

        fetchStub.resolves({
          ok: true,
          json: async () => ({
            data: Array.from({ length: 21 }, (_, i) => ({ status: 'ok', id: `ticket-${i}` })),
          }),
        } as any);

        await sendNewEmailNotifications('user-1', emails, 'user@example.com');

        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body).to.have.length(21);

        const lastMsg = body[20];
        expect(lastMsg.title).to.equal('More emails');
        expect(lastMsg.body).to.equal('And 5 more new emails');
      });

      it('should use singular for exactly 1 remaining email', async () => {
        const emails = createMockEmails(21);

        fetchStub.resolves({
          ok: true,
          json: async () => ({
            data: Array.from({ length: 21 }, (_, i) => ({ status: 'ok', id: `ticket-${i}` })),
          }),
        } as any);

        await sendNewEmailNotifications('user-1', emails, 'user@example.com');

        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body).to.have.length(21);
        expect(body[20].body).to.equal('And 1 more new email');
      });
    });

    describe('content formatting', () => {
      beforeEach(() => {
        userFindByPkStub.resolves(createMockUser(NotificationDetailLevel.FULL));
      });

      it('should use fromName when available', async () => {
        const emails: NewEmailInfo[] = [{
          id: 'e1', subject: 'Test', fromName: 'John Doe', fromAddress: 'john@example.com',
          textBody: null, htmlBody: null,
        }];
        await sendNewEmailNotifications('user-1', emails, 'a@b.com');

        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body[0].title).to.equal('New email from John Doe');
      });

      it('should fall back to fromAddress when fromName is null', async () => {
        const emails: NewEmailInfo[] = [{
          id: 'e1', subject: 'Test', fromName: null, fromAddress: 'john@example.com',
          textBody: null, htmlBody: null,
        }];
        await sendNewEmailNotifications('user-1', emails, 'a@b.com');

        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body[0].title).to.equal('New email from john@example.com');
      });

      it('should fall back to Unknown when both sender fields are null', async () => {
        const emails: NewEmailInfo[] = [{
          id: 'e1', subject: 'Test', fromName: null, fromAddress: null,
          textBody: null, htmlBody: null,
        }];
        await sendNewEmailNotifications('user-1', emails, 'a@b.com');

        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body[0].title).to.equal('New email from Unknown');
      });

      it('should use "No subject" when subject is null', async () => {
        const emails: NewEmailInfo[] = [{
          id: 'e1', subject: null, fromName: 'Sender', fromAddress: null,
          textBody: null, htmlBody: null,
        }];

        userFindByPkStub.resolves(createMockUser(NotificationDetailLevel.MINIMAL));
        await sendNewEmailNotifications('user-1', emails, 'a@b.com');

        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body[0].body).to.equal('No subject');
      });
    });

    describe('token routing', () => {
      it('should send to Expo tokens and skip fallback tokens', async () => {
        userFindByPkStub.resolves(createMockUser(NotificationDetailLevel.MINIMAL));
        pushTokenFindAllStub.resolves([
          { token: 'ExponentPushToken[aaa]', platform: 'ios', deviceName: 'iPhone' },
          { token: 'web-fallback-123', platform: 'web', deviceName: 'Browser' },
        ] as any);

        const emails = createMockEmails(1);
        await sendNewEmailNotifications('user-1', emails, 'a@b.com');

        expect(fetchStub.calledOnce).to.be.true;
        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body).to.have.length(1);
        expect(body[0].to).to.equal('ExponentPushToken[aaa]');
      });

      it('should skip sending when no active tokens exist', async () => {
        userFindByPkStub.resolves(createMockUser(NotificationDetailLevel.FULL));
        pushTokenFindAllStub.resolves([]);

        const emails = createMockEmails(3);
        await sendNewEmailNotifications('user-1', emails, 'a@b.com');

        expect(fetchStub.called).to.be.false;
      });
    });

    describe('edge cases', () => {
      it('should default to FULL when user is not found', async () => {
        userFindByPkStub.resolves(null);

        const emails: NewEmailInfo[] = [{
          id: 'e1', subject: 'Test', fromName: 'Sender', fromAddress: null,
          bodyPreview: 'Some body',
        }];
        await sendNewEmailNotifications('user-1', emails, 'a@b.com');

        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body[0].title).to.equal('New email from Sender');
        expect(body[0].body).to.include('Test');
        expect(body[0].body).to.include('Some body');
      });

      it('should include emailAccount in data for all detail levels', async () => {
        for (const level of Object.values(NotificationDetailLevel)) {
          userFindByPkStub.resolves(createMockUser(level));
          fetchStub.resetHistory();

          const emails = createMockEmails(1);
          await sendNewEmailNotifications('user-1', emails, 'test@example.com');

          const body = JSON.parse(fetchStub.firstCall.args[1].body);
          expect(body[0].data.emailAccount).to.equal('test@example.com');
        }
      });
    });
  });

  describe('stripHtmlForSnippet', () => {
    it('should strip HTML tags', () => {
      expect(stripHtmlForSnippet('<p>Hello</p>')).to.equal('Hello');
    });

    it('should decode HTML entities', () => {
      expect(stripHtmlForSnippet('Hello &amp; world')).to.equal('Hello & world');
      expect(stripHtmlForSnippet('&lt;tag&gt;')).to.equal('<tag>');
      expect(stripHtmlForSnippet('&quot;quoted&quot;')).to.equal('"quoted"');
      expect(stripHtmlForSnippet('it&#39;s')).to.equal("it's");
    });

    it('should normalize whitespace', () => {
      expect(stripHtmlForSnippet('Hello   \n   world')).to.equal('Hello world');
    });

    it('should truncate to maxLength with ellipsis', () => {
      const longText = 'A'.repeat(200);
      const result = stripHtmlForSnippet(longText, 50);
      expect(result.length).to.be.at.most(50);
      expect(result).to.match(/\.\.\.$/);
    });

    it('should not truncate short text', () => {
      expect(stripHtmlForSnippet('Short text')).to.equal('Short text');
    });
  });
});
