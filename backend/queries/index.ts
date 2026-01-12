import type { AllQueries } from '../types.js';
import { me } from './auth/me.js';
import { getEmailAccounts } from './email-account/getEmailAccounts.js';
import { getEmailAccount } from './email-account/getEmailAccount.js';
import { getSmtpProfiles } from './smtp-profile/getSmtpProfiles.js';
import { getSmtpProfile } from './smtp-profile/getSmtpProfile.js';
import { getEmails } from './email/getEmails.js';
import { getEmail } from './email/getEmail.js';
import { getEmailCount } from './email/getEmailCount.js';

export const QueryResolvers: AllQueries = {
  me,
  getEmailAccounts,
  getEmailAccount,
  getSmtpProfiles,
  getSmtpProfile,
  getEmails,
  getEmail,
  getEmailCount,
};
