import { Sequelize } from 'sequelize-typescript';
import { User } from './models/user.model.js';
import { AuthenticationMethod } from './models/authentication-method.model.js';
import { EmailAccount } from './models/email-account.model.js';
import { SmtpProfile } from './models/smtp-profile.model.js';
import { Email } from './models/email.model.js';
import { ContactEmail } from './models/contact-email.model.js';
import { Contact } from './models/contact.model.js';
import { Tag } from './models/tag.model.js';
import { EmailTag } from './models/email-tag.model.js';
import { MailRule } from './models/mail-rule.model.js';
import { Attachment } from './models/attachment.model.js';

export const sequelize = new Sequelize({
  dialect: 'postgres',
  database: 'email_client',
  username: 'postgres',
  password: 'password',
  host: 'localhost',
  port: 5433,
  models: [
    User,
    AuthenticationMethod,
    EmailAccount,
    SmtpProfile,
    Email,
    ContactEmail,
    Contact,
    Tag,
    EmailTag,
    MailRule,
    Attachment,
  ],
  logging: false,
});
