import type { AllMutations } from '../types.js';
import { deleteAuthenticationMethod } from './auth/deleteAuthenticationMethod.js';
import { updateThemePreference } from './auth/updateThemePreference.js';
import { updateUserPreferences } from './auth/updateUserPreferences.js';
import { createEmailAccount } from './email-account/createEmailAccount.js';
import { updateEmailAccount } from './email-account/updateEmailAccount.js';
import { deleteEmailAccount } from './email-account/deleteEmailAccount.js';
import { syncEmailAccount } from './email-account/syncEmailAccount.js';
import { testEmailAccountConnection } from './email-account/testEmailAccountConnection.js';
import { createSmtpProfile } from './smtp-profile/createSmtpProfile.js';
import { updateSmtpProfile } from './smtp-profile/updateSmtpProfile.js';
import { deleteSmtpProfile } from './smtp-profile/deleteSmtpProfile.js';
import { testSmtpConnection } from './smtp-profile/testSmtpConnection.js';
import { sendEmail } from './email/sendEmail.js';
import { saveDraft } from './email/saveDraft.js';
import { bulkUpdateEmails } from './email/bulkUpdateEmails.js';
import { bulkDeleteEmails } from './email/bulkDeleteEmails.js';
import { forwardEmail } from './email/forwardEmail.js';
import { unsubscribe } from './email/unsubscribe.js';
import { syncAllAccounts } from './email/syncAllAccounts.js';
import { nukeOldEmails } from './email/nukeOldEmails.js';
import { createContact } from './contact/createContact.js';
import { updateContact } from './contact/updateContact.js';
import { deleteContact } from './contact/deleteContact.js';
import { createContactFromEmail } from './contact/createContactFromEmail.js';
import { addEmailToContact } from './contact/addEmailToContact.js';
import { createTag } from './tag/createTag.js';
import { updateTag } from './tag/updateTag.js';
import { deleteTag } from './tag/deleteTag.js';
import { addTagsToEmails } from './tag/addTagsToEmails.js';
import { removeTagsFromEmails } from './tag/removeTagsFromEmails.js';
import { createMailRule } from './mail-rule/createMailRule.js';
import { updateMailRule } from './mail-rule/updateMailRule.js';
import { deleteMailRule } from './mail-rule/deleteMailRule.js';
import { runMailRule } from './mail-rule/runMailRule.js';
import { createCheckoutSession } from './billing/createCheckoutSession.js';
import { createBillingPortalSession } from './billing/createBillingPortalSession.js';
import { refreshStorageUsage } from './billing/refreshStorageUsage.js';

export const MutationResolvers: AllMutations = {
  deleteAuthenticationMethod,
  updateThemePreference,
  updateUserPreferences,
  createEmailAccount,
  updateEmailAccount,
  deleteEmailAccount,
  syncEmailAccount,
  testEmailAccountConnection,
  createSmtpProfile,
  updateSmtpProfile,
  deleteSmtpProfile,
  testSmtpConnection,
  sendEmail,
  saveDraft,
  bulkUpdateEmails,
  bulkDeleteEmails,
  forwardEmail,
  unsubscribe,
  syncAllAccounts,
  nukeOldEmails,
  createContact,
  updateContact,
  deleteContact,
  createContactFromEmail,
  addEmailToContact,
  createTag,
  updateTag,
  deleteTag,
  addTagsToEmails,
  removeTagsFromEmails,
  createMailRule,
  updateMailRule,
  deleteMailRule,
  runMailRule,
  createCheckoutSession,
  createBillingPortalSession,
  refreshStorageUsage,
};
