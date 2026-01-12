import { gql } from '../../__generated__/gql';

export const GET_EMAIL_ACCOUNTS_QUERY = gql(`
  query GetEmailAccounts {
    getEmailAccounts {
      id
      name
      email
      host
      port
      accountType
      useSsl
      lastSyncedAt
      defaultSmtpProfileId
      defaultSmtpProfile {
        id
        name
        email
      }
    }
  }
`);

export const CREATE_EMAIL_ACCOUNT_MUTATION = gql(`
  mutation CreateEmailAccount($input: CreateEmailAccountInput!) {
    createEmailAccount(input: $input) {
      id
      name
      email
    }
  }
`);

export const DELETE_EMAIL_ACCOUNT_MUTATION = gql(`
  mutation DeleteEmailAccount($id: String!) {
    deleteEmailAccount(id: $id)
  }
`);

export const SYNC_EMAIL_ACCOUNT_MUTATION = gql(`
  mutation SyncEmailAccount($input: SyncEmailAccountInput!) {
    syncEmailAccount(input: $input)
  }
`);

export const GET_SMTP_PROFILES_FULL_QUERY = gql(`
  query GetSmtpProfilesFull {
    getSmtpProfiles {
      id
      name
      email
      host
      port
      useSsl
      isDefault
    }
  }
`);

export const CREATE_SMTP_PROFILE_MUTATION = gql(`
  mutation CreateSmtpProfile($input: CreateSmtpProfileInput!) {
    createSmtpProfile(input: $input) {
      id
      name
      email
    }
  }
`);

export const DELETE_SMTP_PROFILE_MUTATION = gql(`
  mutation DeleteSmtpProfile($id: String!) {
    deleteSmtpProfile(id: $id)
  }
`);

export const TEST_EMAIL_ACCOUNT_CONNECTION_MUTATION = gql(`
  mutation TestEmailAccountConnection($input: TestEmailAccountConnectionInput!) {
    testEmailAccountConnection(input: $input) {
      success
      message
    }
  }
`);

export const TEST_SMTP_CONNECTION_MUTATION = gql(`
  mutation TestSmtpConnection($input: TestSmtpConnectionInput!) {
    testSmtpConnection(input: $input) {
      success
      message
    }
  }
`);

export const UPDATE_EMAIL_ACCOUNT_MUTATION = gql(`
  mutation UpdateEmailAccount($input: UpdateEmailAccountInput!) {
    updateEmailAccount(input: $input) {
      id
      name
      email
      host
      port
      useSsl
      defaultSmtpProfileId
    }
  }
`);

export const UPDATE_SMTP_PROFILE_MUTATION = gql(`
  mutation UpdateSmtpProfile($input: UpdateSmtpProfileInput!) {
    updateSmtpProfile(input: $input) {
      id
      name
      email
      host
      port
      useSsl
      isDefault
    }
  }
`);
