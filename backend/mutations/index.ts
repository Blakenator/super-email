import type { AllMutations } from '../types.js';
import { deleteAuthenticationMethod } from './auth/deleteAuthenticationMethod.js';
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
import { createContact } from './contact/createContact.js';
import { updateContact } from './contact/updateContact.js';
import { deleteContact } from './contact/deleteContact.js';
import { createContactFromEmail } from './contact/createContactFromEmail.js';

export const MutationResolvers: AllMutations = {
  deleteAuthenticationMethod,
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
  createContact,
  updateContact,
  deleteContact,
  createContactFromEmail,
};
