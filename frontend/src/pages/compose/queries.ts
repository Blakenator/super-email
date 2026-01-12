import { gql } from '../../__generated__/gql';

export const GET_SMTP_PROFILES_QUERY = gql(`
  query GetSmtpProfiles {
    getSmtpProfiles {
      id
      name
      email
      isDefault
    }
  }
`);

export const GET_EMAIL_ACCOUNTS_QUERY = gql(`
  query GetEmailAccountsForCompose {
    getEmailAccounts {
      id
      name
      email
      defaultSmtpProfileId
    }
  }
`);

export const SEND_EMAIL_MUTATION = gql(`
  mutation SendEmail($input: ComposeEmailInput!) {
    sendEmail(input: $input) {
      id
      messageId
      subject
    }
  }
`);

export const SAVE_DRAFT_MUTATION = gql(`
  mutation SaveDraft($input: SaveDraftInput!) {
    saveDraft(input: $input) {
      id
      subject
    }
  }
`);
