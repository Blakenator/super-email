import type { AllMutations } from '../types.js';
import { signUp } from './auth/signUp.js';
import { login } from './auth/login.js';
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
import { updateEmail } from './email/updateEmail.js';
import { deleteEmail } from './email/deleteEmail.js';

export const MutationResolvers: AllMutations = {
  signUp,
  login,
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
  updateEmail,
  deleteEmail,
};
