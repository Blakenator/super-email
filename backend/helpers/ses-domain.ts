/**
 * SES Domain Identity Management
 *
 * Handles creating, verifying, and deleting SES domain identities
 * for custom domain email support. Production uses AWS SES SDK;
 * development returns mock/stub data.
 */

import { config } from '../config/env.js';
import { logger } from './logger.js';

export interface DnsRecord {
  recordType: 'CNAME' | 'TXT' | 'MX';
  purpose: 'DKIM' | 'SPF' | 'DMARC' | 'MX_INBOUND';
  name: string;
  value: string;
}

export interface SesIdentityResult {
  identityArn: string | null;
  dnsRecords: DnsRecord[];
}

export interface VerificationStatus {
  dkim: boolean;
  overallVerified: boolean;
  recordStatuses: Record<string, boolean>;
}

let sesClient: any = null;

async function getSesClient() {
  if (config.isDevelopment) {
    throw new Error('SES should not be used in development');
  }
  if (!sesClient) {
    const { SESv2Client } = await import('@aws-sdk/client-sesv2');
    sesClient = new SESv2Client({ region: config.ses.region });
  }
  return sesClient;
}

/**
 * Create an SES domain identity and return the required DNS records.
 */
export async function createSesIdentity(domain: string): Promise<SesIdentityResult> {
  if (config.isDevelopment) {
    return createMockSesIdentity(domain);
  }

  const client = await getSesClient();
  const { CreateEmailIdentityCommand } = await import('@aws-sdk/client-sesv2');

  try {
    logger.info('SES', `Creating domain identity for ${domain} in region ${config.ses.region}`);
    const response = await client.send(
      new CreateEmailIdentityCommand({
        EmailIdentity: domain,
      }),
    );

    const dnsRecords: DnsRecord[] = [];

    // DKIM tokens -> CNAME records
    const dkimTokens = response.DkimAttributes?.Tokens || [];
    for (const token of dkimTokens) {
      dnsRecords.push({
        recordType: 'CNAME',
        purpose: 'DKIM',
        name: `${token}._domainkey.${domain}`,
        value: `${token}.dkim.amazonses.com`,
      });
    }

    // SPF record
    dnsRecords.push({
      recordType: 'TXT',
      purpose: 'SPF',
      name: domain,
      value: '"v=spf1 include:amazonses.com ~all"',
    });

    // DMARC record
    dnsRecords.push({
      recordType: 'TXT',
      purpose: 'DMARC',
      name: `_dmarc.${domain}`,
      value: '"v=DMARC1; p=quarantine; rua=mailto:dmarc@' + domain + '"',
    });

    // MX record for inbound
    dnsRecords.push({
      recordType: 'MX',
      purpose: 'MX_INBOUND',
      name: domain,
      value: `10 inbound-smtp.${config.ses.region}.amazonaws.com`,
    });

    const identityArn = response.IdentityType
      ? `arn:aws:ses:${config.ses.region}:${await getAccountId()}:identity/${domain}`
      : null;

    logger.info('SES', `Created domain identity for ${domain}`);

    return { identityArn, dnsRecords };
  } catch (error: any) {
    logger.error('SES', `Failed to create identity for ${domain}`, {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Check the verification status of a domain's DNS records.
 */
export async function getSesVerificationStatus(
  domain: string,
): Promise<VerificationStatus> {
  if (config.isDevelopment) {
    return { dkim: true, overallVerified: true, recordStatuses: {} };
  }

  const client = await getSesClient();
  const { GetEmailIdentityCommand } = await import('@aws-sdk/client-sesv2');

  try {
    const response = await client.send(
      new GetEmailIdentityCommand({ EmailIdentity: domain }),
    );

    const dkim =
      response.DkimAttributes?.Status === 'SUCCESS' ||
      response.DkimAttributes?.SigningEnabled === true;

    const overallVerified = response.VerifiedForSendingStatus === true;

    return {
      dkim,
      overallVerified,
      recordStatuses: {
        dkim,
        spf: overallVerified,
        dmarc: overallVerified,
        mx_inbound: overallVerified,
      },
    };
  } catch (error: any) {
    logger.error('SES', `Failed to check verification for ${domain}`, {
      error: error.message,
    });
    return { dkim: false, overallVerified: false, recordStatuses: {} };
  }
}

/**
 * Delete an SES domain identity.
 */
export async function deleteSesIdentity(domain: string): Promise<void> {
  if (config.isDevelopment) {
    logger.info('SES', `[Dev] Would delete identity for ${domain}`);
    return;
  }

  const client = await getSesClient();
  const { DeleteEmailIdentityCommand } = await import('@aws-sdk/client-sesv2');

  try {
    await client.send(
      new DeleteEmailIdentityCommand({ EmailIdentity: domain }),
    );
    logger.info('SES', `Deleted domain identity for ${domain}`);
  } catch (error: any) {
    logger.error('SES', `Failed to delete identity for ${domain}`, {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Generate the list of DNS records a user needs to configure for a domain.
 * This re-fetches from SES to get current DKIM tokens.
 */
export async function generateDnsRecords(domain: string): Promise<DnsRecord[]> {
  if (config.isDevelopment) {
    return createMockSesIdentity(domain).dnsRecords;
  }

  const client = await getSesClient();
  const { GetEmailIdentityCommand } = await import('@aws-sdk/client-sesv2');

  const response = await client.send(
    new GetEmailIdentityCommand({ EmailIdentity: domain }),
  );

  const records: DnsRecord[] = [];

  const dkimTokens = response.DkimAttributes?.Tokens || [];
  for (const token of dkimTokens) {
    records.push({
      recordType: 'CNAME',
      purpose: 'DKIM',
      name: `${token}._domainkey.${domain}`,
      value: `${token}.dkim.amazonses.com`,
    });
  }

  records.push({
    recordType: 'TXT',
    purpose: 'SPF',
    name: domain,
    value: '"v=spf1 include:amazonses.com ~all"',
  });

  records.push({
    recordType: 'TXT',
    purpose: 'DMARC',
    name: `_dmarc.${domain}`,
    value: '"v=DMARC1; p=quarantine; rua=mailto:dmarc@' + domain + '"',
  });

  records.push({
    recordType: 'MX',
    purpose: 'MX_INBOUND',
    name: domain,
    value: `10 inbound-smtp.${config.ses.region}.amazonaws.com`,
  });

  return records;
}

// Helpers

async function getAccountId(): Promise<string> {
  try {
    const { STSClient, GetCallerIdentityCommand } = await import(
      '@aws-sdk/client-sts'
    );
    const sts = new STSClient({ region: config.aws.region });
    const identity = await sts.send(new GetCallerIdentityCommand({}));
    return identity.Account || 'unknown';
  } catch {
    return 'unknown';
  }
}

function createMockSesIdentity(domain: string): SesIdentityResult {
  return {
    identityArn: `arn:aws:ses:${config.ses.region}:123456789:identity/${domain}`,
    dnsRecords: [
      {
        recordType: 'CNAME',
        purpose: 'DKIM',
        name: `mock1._domainkey.${domain}`,
        value: 'mock1.dkim.amazonses.com',
      },
      {
        recordType: 'CNAME',
        purpose: 'DKIM',
        name: `mock2._domainkey.${domain}`,
        value: 'mock2.dkim.amazonses.com',
      },
      {
        recordType: 'CNAME',
        purpose: 'DKIM',
        name: `mock3._domainkey.${domain}`,
        value: 'mock3.dkim.amazonses.com',
      },
      {
        recordType: 'TXT',
        purpose: 'SPF',
        name: domain,
        value: '"v=spf1 include:amazonses.com ~all"',
      },
      {
        recordType: 'TXT',
        purpose: 'DMARC',
        name: `_dmarc.${domain}`,
        value: `"v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}"`,
      },
      {
        recordType: 'MX',
        purpose: 'MX_INBOUND',
        name: domain,
        value: `10 inbound-smtp.${config.ses.region}.amazonaws.com`,
      },
    ],
  };
}
