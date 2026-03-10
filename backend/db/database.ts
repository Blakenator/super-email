import { Sequelize } from 'sequelize-typescript';
import { config, validateEnv } from '../config/env.js';
import { logger } from '../helpers/logger.js';
import { User } from './models/user.model.js';
import { AuthenticationMethod } from './models/authentication-method.model.js';
import { EmailAccount } from './models/email-account.model.js';
import { ImapAccountSettings } from './models/imap-account-settings.model.js';
import { SendProfile } from './models/send-profile.model.js';
import { SmtpAccountSettings } from './models/smtp-account-settings.model.js';
import { CustomDomain } from './models/custom-domain.model.js';
import { CustomDomainDnsRecord } from './models/custom-domain-dns-record.model.js';
import { CustomDomainAccount } from './models/custom-domain-account.model.js';
import { ContactEmail } from './models/contact-email.model.js';
import { Contact } from './models/contact.model.js';
import { Tag } from './models/tag.model.js';
import { EmailTag } from './models/email-tag.model.js';
import { MailRule } from './models/mail-rule.model.js';
import { Email } from './models/email.model.js';
import { Attachment } from './models/attachment.model.js';
import { Subscription } from './models/subscription.model.js';
import { UserUsage } from './models/user-usage.model.js';
import { PushToken } from './models/push-token.model.js';

// Validate environment in production
const envValidation = validateEnv();
if (!envValidation.valid) {
  logger.error('Database', 'Environment validation failed', { errors: envValidation.errors });
  envValidation.errors.forEach((err) => logger.error('Database', `  - ${err}`));
  if (config.isProduction) {
    process.exit(1);
  }
}

export const sequelize = new Sequelize({
  dialect: 'postgres',
  database: config.db.name,
  username: config.db.user,
  password: config.db.password,
  host: config.db.host,
  port: config.db.port,
  models: [
    User,
    AuthenticationMethod,
    EmailAccount,
    ImapAccountSettings,
    SendProfile,
    SmtpAccountSettings,
    CustomDomain,
    CustomDomainDnsRecord,
    CustomDomainAccount,
    Email,
    ContactEmail,
    Contact,
    Tag,
    EmailTag,
    MailRule,
    Attachment,
    Subscription,
    UserUsage,
    PushToken,
  ],
  logging: false,
  pool: {
    max: config.isProduction ? 20 : 10,
    min: config.isProduction ? 2 : 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: config.isProduction
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : undefined,
});
