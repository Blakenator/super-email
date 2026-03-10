import type { AllQueries } from '../types.js';
import { healthCheck } from './health/healthCheck.js';
import { fetchProfile } from './auth/fetchProfile.js';
import { getAuthenticationMethods } from './auth/getAuthenticationMethods.js';
import { getEmailAccounts } from './email-account/getEmailAccounts.js';
import { getEmailAccount } from './email-account/getEmailAccount.js';
import { getSendProfiles } from './send-profile/getSendProfiles.js';
import { getSendProfile } from './send-profile/getSendProfile.js';
import { getCustomDomains } from './custom-domain/getCustomDomains.js';
import { getCustomDomain } from './custom-domain/getCustomDomain.js';
import { getEmails } from './email/getEmails.js';
import { getEmail } from './email/getEmail.js';
import { getEmailCount } from './email/getEmailCount.js';
import { getEmailsByThread } from './email/getEmailsByThread.js';
import { getTopEmailSources } from './email/getTopEmailSources.js';
import { getContacts } from './contact/getContacts.js';
import { getContact } from './contact/getContact.js';
import { searchContacts } from './contact/searchContacts.js';
import { getTags } from './tag/getTags.js';
import { getTag } from './tag/getTag.js';
import { getMailRules } from './mail-rule/getMailRules.js';
import { getMailRule } from './mail-rule/getMailRule.js';
import { previewMailRule } from './mail-rule/previewMailRule.js';
import { getAttachment } from './attachment/getAttachment.js';
import { getAttachmentDownloadUrl } from './attachment/getAttachmentDownloadUrl.js';
import { getBillingInfo } from './billing/getBillingInfo.js';
import { getStorageUsage } from './billing/getStorageUsage.js';
import { getStorageUsageRealtime } from './billing/getStorageUsageRealtime.js';

export const QueryResolvers: AllQueries = {
  healthCheck,
  fetchProfile,
  getAuthenticationMethods,
  getEmailAccounts,
  getEmailAccount,
  getSendProfiles,
  getSendProfile,
  getCustomDomains,
  getCustomDomain,
  getEmails,
  getEmail,
  getEmailCount,
  getEmailsByThread,
  getTopEmailSources,
  getContacts,
  getContact,
  searchContacts,
  getTags,
  getTag,
  getMailRules,
  getMailRule,
  previewMailRule,
  getAttachment,
  getAttachmentDownloadUrl,
  getBillingInfo,
  getStorageUsage,
  getStorageUsageRealtime,
};
