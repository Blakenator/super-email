import { gql } from '../../__generated__/gql';

export const GET_EMAILS_QUERY = gql(`
  query GetEmails($input: GetEmailsInput!) {
    getEmails(input: $input) {
      id
      messageId
      folder
      fromAddress
      fromName
      toAddresses
      ccAddresses
      bccAddresses
      subject
      textBody
      htmlBody
      receivedAt
      isRead
      isStarred
      emailAccountId
      inReplyTo
    }
  }
`);

export const GET_EMAIL_QUERY = gql(`
  query GetEmail($input: GetEmailInput!) {
    getEmail(input: $input) {
      id
      emailAccountId
      messageId
      folder
      fromAddress
      fromName
      toAddresses
      ccAddresses
      subject
      textBody
      htmlBody
      receivedAt
      isRead
      isStarred
      inReplyTo
      references
    }
  }
`);

export const GET_EMAIL_COUNT_QUERY = gql(`
  query GetEmailCount($input: GetEmailsInput!) {
    getEmailCount(input: $input)
  }
`);

export const UPDATE_EMAIL_MUTATION = gql(`
  mutation UpdateEmail($input: UpdateEmailInput!) {
    updateEmail(input: $input) {
      id
      isRead
      isStarred
      folder
    }
  }
`);

export const DELETE_EMAIL_MUTATION = gql(`
  mutation DeleteEmail($id: String!) {
    deleteEmail(id: $id)
  }
`);

export const GET_STARRED_EMAILS_QUERY = gql(`
  query GetStarredEmails($input: GetEmailsInput!) {
    getEmails(input: $input) {
      id
      messageId
      folder
      fromAddress
      fromName
      toAddresses
      subject
      textBody
      receivedAt
      isRead
      isStarred
      emailAccountId
    }
  }
`);

export const GET_EMAIL_ACCOUNTS_FOR_INBOX_QUERY = gql(`
  query GetEmailAccountsForInbox {
    getEmailAccounts {
      id
      name
      email
      lastSyncedAt
    }
  }
`);

export const SYNC_ALL_ACCOUNTS_MUTATION = gql(`
  mutation SyncAllAccounts {
    syncAllAccounts
  }
`);
