/**
 * Rule Matcher Unit Tests
 * 
 * Tests the emailMatchesRule pure function.
 */

import { expect } from 'chai';
import { emailMatchesRule } from '../../helpers/rule-matcher.js';

// Create mock email and rule objects
const createMockEmail = (overrides: Record<string, any> = {}) => ({
  id: 'email-1',
  emailAccountId: 'account-1',
  fromAddress: 'sender@example.com',
  fromName: 'Sender Name',
  toAddresses: ['recipient@example.com'],
  ccAddresses: [],
  bccAddresses: [],
  subject: 'Test Subject',
  textBody: 'This is the email body text.',
  htmlBody: '<p>This is the email body text.</p>',
  ...overrides,
});

const createMockRule = (conditions: Record<string, any> = {}, emailAccountId: string | null = null) => ({
  id: 'rule-1',
  userId: 'user-1',
  emailAccountId,
  conditions,
  actions: {},
  isEnabled: true,
});

describe('rule-matcher helpers', function () {
  describe('emailMatchesRule', () => {
    describe('account filtering', () => {
      it('should match when rule has no account filter', () => {
        const email = createMockEmail();
        const rule = createMockRule({});
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.true;
      });

      it('should match when account matches rule', () => {
        const email = createMockEmail({ emailAccountId: 'account-1' });
        const rule = createMockRule({}, 'account-1');
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.true;
      });

      it('should not match when account differs from rule', () => {
        const email = createMockEmail({ emailAccountId: 'account-1' });
        const rule = createMockRule({}, 'account-2');
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.false;
      });
    });

    describe('fromContains condition', () => {
      it('should match when from address contains term', () => {
        const email = createMockEmail({ fromAddress: 'newsletter@company.com' });
        const rule = createMockRule({ fromContains: 'newsletter' });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.true;
      });

      it('should match when from name contains term', () => {
        const email = createMockEmail({ fromName: 'John Newsletter' });
        const rule = createMockRule({ fromContains: 'newsletter' });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.true;
      });

      it('should be case insensitive', () => {
        const email = createMockEmail({ fromAddress: 'Newsletter@Company.com' });
        const rule = createMockRule({ fromContains: 'NEWSLETTER' });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.true;
      });

      it('should not match when term is not found', () => {
        const email = createMockEmail({ fromAddress: 'support@company.com' });
        const rule = createMockRule({ fromContains: 'newsletter' });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.false;
      });

      it('should ignore empty/whitespace condition', () => {
        const email = createMockEmail();
        const rule = createMockRule({ fromContains: '   ' });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.true;
      });
    });

    describe('toContains condition', () => {
      it('should match when to address contains term', () => {
        const email = createMockEmail({ toAddresses: ['team@company.com', 'sales@company.com'] });
        const rule = createMockRule({ toContains: 'sales' });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.true;
      });

      it('should not match when term not in to addresses', () => {
        const email = createMockEmail({ toAddresses: ['team@company.com'] });
        const rule = createMockRule({ toContains: 'sales' });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.false;
      });
    });

    describe('ccContains condition', () => {
      it('should match when cc address contains term', () => {
        const email = createMockEmail({ ccAddresses: ['manager@company.com'] });
        const rule = createMockRule({ ccContains: 'manager' });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.true;
      });

      it('should handle empty cc addresses', () => {
        const email = createMockEmail({ ccAddresses: [] });
        const rule = createMockRule({ ccContains: 'manager' });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.false;
      });
    });

    describe('bccContains condition', () => {
      it('should match when bcc address contains term', () => {
        const email = createMockEmail({ bccAddresses: ['secret@company.com'] });
        const rule = createMockRule({ bccContains: 'secret' });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.true;
      });
    });

    describe('subjectContains condition', () => {
      it('should match when subject contains term', () => {
        const email = createMockEmail({ subject: 'Urgent: Please review' });
        const rule = createMockRule({ subjectContains: 'urgent' });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.true;
      });

      it('should not match when subject does not contain term', () => {
        const email = createMockEmail({ subject: 'Weekly report' });
        const rule = createMockRule({ subjectContains: 'urgent' });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.false;
      });
    });

    describe('bodyContains condition', () => {
      it('should match when text body contains term', () => {
        const email = createMockEmail({ textBody: 'Please unsubscribe me from this list' });
        const rule = createMockRule({ bodyContains: 'unsubscribe' });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.true;
      });

      it('should match when html body contains term', () => {
        const email = createMockEmail({ 
          textBody: '',
          htmlBody: '<p>Click to unsubscribe</p>' 
        });
        const rule = createMockRule({ bodyContains: 'unsubscribe' });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.true;
      });

      it('should handle null bodies', () => {
        const email = createMockEmail({ textBody: null, htmlBody: null });
        const rule = createMockRule({ bodyContains: 'test' });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.false;
      });
    });

    describe('multiple conditions', () => {
      it('should require all conditions to match (AND logic)', () => {
        const email = createMockEmail({
          fromAddress: 'newsletter@company.com',
          subject: 'Weekly digest',
        });
        const rule = createMockRule({
          fromContains: 'newsletter',
          subjectContains: 'weekly',
        });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.true;
      });

      it('should fail if any condition does not match', () => {
        const email = createMockEmail({
          fromAddress: 'newsletter@company.com',
          subject: 'Monthly digest',
        });
        const rule = createMockRule({
          fromContains: 'newsletter',
          subjectContains: 'weekly',
        });
        
        expect(emailMatchesRule(email as any, rule as any)).to.be.false;
      });
    });
  });
});
