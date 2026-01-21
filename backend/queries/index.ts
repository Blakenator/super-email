import type { AllQueries } from '../types.js';
import { fetchProfile } from './auth/fetchProfile.js';
import { getAuthenticationMethods } from './auth/getAuthenticationMethods.js';
import { getEmailAccounts } from './email-account/getEmailAccounts.js';
import { getEmailAccount } from './email-account/getEmailAccount.js';
import { getSmtpProfiles } from './smtp-profile/getSmtpProfiles.js';
import { getSmtpProfile } from './smtp-profile/getSmtpProfile.js';
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
  fetchProfile,
  getAuthenticationMethods,
  getEmailAccounts,
  getEmailAccount,
  getSmtpProfiles,
  getSmtpProfile,
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
