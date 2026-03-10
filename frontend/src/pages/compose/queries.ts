import { gql } from '../../__generated__/gql';

export const GET_SEND_PROFILES_QUERY = gql(`
  query GetSendProfiles {
    getSendProfiles {
      id
      name
      email
      alias
      type
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
      type
      defaultSendProfileId
      isDefault
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
