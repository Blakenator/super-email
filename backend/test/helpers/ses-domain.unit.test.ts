/**
 * SES Domain Identity Unit Tests
 *
 * Tests the development-mode (mock) paths of SES domain management functions.
 * Production paths that call AWS SDK are covered by integration tests.
 */

import { expect } from 'chai';

describe('ses-domain helpers (dev mode)', function () {
  let createSesIdentity: typeof import('../../helpers/ses-domain.js').createSesIdentity;
  let getSesVerificationStatus: typeof import('../../helpers/ses-domain.js').getSesVerificationStatus;
  let deleteSesIdentity: typeof import('../../helpers/ses-domain.js').deleteSesIdentity;
  let generateDnsRecords: typeof import('../../helpers/ses-domain.js').generateDnsRecords;

  before(async () => {
    process.env.NODE_ENV = 'test';
    const mod = await import('../../helpers/ses-domain.js');
    createSesIdentity = mod.createSesIdentity;
    getSesVerificationStatus = mod.getSesVerificationStatus;
    deleteSesIdentity = mod.deleteSesIdentity;
    generateDnsRecords = mod.generateDnsRecords;
  });

  describe('createSesIdentity', () => {
    it('should return mock identity with DNS records for a domain', async () => {
      const result = await createSesIdentity('example.com');

      expect(result.identityArn).to.be.a('string');
      expect(result.identityArn).to.include('example.com');
      expect(result.dnsRecords).to.be.an('array');
      expect(result.dnsRecords.length).to.be.at.least(5);
    });

    it('should include DKIM CNAME records', async () => {
      const result = await createSesIdentity('test.io');
      const dkimRecords = result.dnsRecords.filter(r => r.purpose === 'DKIM');

      expect(dkimRecords.length).to.equal(3);
      for (const rec of dkimRecords) {
        expect(rec.recordType).to.equal('CNAME');
        expect(rec.name).to.include('._domainkey.test.io');
        expect(rec.value).to.include('.dkim.amazonses.com');
      }
    });

    it('should include SPF TXT record', async () => {
      const result = await createSesIdentity('test.io');
      const spfRecords = result.dnsRecords.filter(r => r.purpose === 'SPF');

      expect(spfRecords.length).to.equal(1);
      expect(spfRecords[0].recordType).to.equal('TXT');
      expect(spfRecords[0].name).to.equal('test.io');
      expect(spfRecords[0].value).to.include('spf1');
      expect(spfRecords[0].value).to.include('amazonses.com');
    });

    it('should include DMARC TXT record', async () => {
      const result = await createSesIdentity('test.io');
      const dmarcRecords = result.dnsRecords.filter(r => r.purpose === 'DMARC');

      expect(dmarcRecords.length).to.equal(1);
      expect(dmarcRecords[0].recordType).to.equal('TXT');
      expect(dmarcRecords[0].name).to.equal('_dmarc.test.io');
      expect(dmarcRecords[0].value).to.include('DMARC1');
    });

    it('should include MX record for inbound email', async () => {
      const result = await createSesIdentity('test.io');
      const mxRecords = result.dnsRecords.filter(r => r.purpose === 'MX_INBOUND');

      expect(mxRecords.length).to.equal(1);
      expect(mxRecords[0].recordType).to.equal('MX');
      expect(mxRecords[0].name).to.equal('test.io');
      expect(mxRecords[0].value).to.include('inbound-smtp');
    });
  });

  describe('getSesVerificationStatus', () => {
    it('should return verified status in dev mode', async () => {
      const result = await getSesVerificationStatus('example.com');

      expect(result.dkim).to.be.true;
      expect(result.overallVerified).to.be.true;
    });
  });

  describe('deleteSesIdentity', () => {
    it('should resolve without error in dev mode', async () => {
      await deleteSesIdentity('example.com');
    });
  });

  describe('generateDnsRecords', () => {
    it('should return the same mock DNS records as createSesIdentity', async () => {
      const records = await generateDnsRecords('gen.example.com');

      expect(records).to.be.an('array');
      expect(records.length).to.be.at.least(5);

      const purposes = records.map(r => r.purpose);
      expect(purposes).to.include('DKIM');
      expect(purposes).to.include('SPF');
      expect(purposes).to.include('DMARC');
      expect(purposes).to.include('MX_INBOUND');
    });
  });
});
