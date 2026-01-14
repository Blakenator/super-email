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
      threadId
      threadCount
      tags {
        id
        name
        color
      }
    }
  }
`);

export const GET_EMAILS_BY_THREAD_QUERY = gql(`
  query GetEmailsByThread($threadId: String!) {
    getEmailsByThread(threadId: $threadId) {
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
      threadId
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
      threadId
      threadCount
      headers
      isUnsubscribed
      unsubscribeUrl
      unsubscribeEmail
      tags {
        id
        name
        color
      }
    }
  }
`);

export const GET_EMAIL_COUNT_QUERY = gql(`
  query GetEmailCount($input: GetEmailsInput!) {
    getEmailCount(input: $input)
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
      host
      lastSyncedAt
      providerId
    }
  }
`);

export const SYNC_ALL_ACCOUNTS_MUTATION = gql(`
  mutation SyncAllAccounts {
    syncAllAccounts
  }
`);

export const UNSUBSCRIBE_MUTATION = gql(`
  mutation Unsubscribe($input: UnsubscribeInput!) {
    unsubscribe(input: $input) {
      id
      isUnsubscribed
    }
  }
`);

export const CREATE_CONTACT_FROM_EMAIL_MUTATION = gql(`
  mutation CreateContactFromEmail($emailId: String!) {
    createContactFromEmail(emailId: $emailId) {
      id
      email
      name
    }
  }
`);

export const BULK_UPDATE_EMAILS_MUTATION = gql(`
  mutation BulkUpdateEmails($input: BulkUpdateEmailsInput!) {
    bulkUpdateEmails(input: $input) {
      id
      isRead
      isStarred
      folder
    }
  }
`);

export const BULK_DELETE_EMAILS_MUTATION = gql(`
  mutation BulkDeleteEmails($ids: [String!]!) {
    bulkDeleteEmails(ids: $ids)
  }
`);

export const FORWARD_EMAIL_MUTATION = gql(`
  mutation ForwardEmail($input: ForwardEmailInput!) {
    forwardEmail(input: $input) {
      id
      messageId
      subject
    }
  }
`);

export const NUKE_OLD_EMAILS_MUTATION = gql(`
  mutation NukeOldEmails($input: NukeOldEmailsInput!) {
    nukeOldEmails(input: $input)
  }
`);

export const GET_TAGS_FOR_INBOX_QUERY = gql(`
  query GetTagsForInbox {
    getTags {
      id
      name
      color
      emailCount
    }
  }
`);

export const ADD_TAGS_TO_EMAILS_MUTATION = gql(`
  mutation AddTagsToEmailsInbox($input: AddTagsToEmailsInput!) {
    addTagsToEmails(input: $input) {
      id
      tags {
        id
        name
        color
      }
    }
  }
`);

export const REMOVE_TAGS_FROM_EMAILS_MUTATION = gql(`
  mutation RemoveTagsFromEmailsInbox($input: RemoveTagsFromEmailsInput!) {
    removeTagsFromEmails(input: $input) {
      id
      tags {
        id
        name
        color
      }
    }
  }
`);
