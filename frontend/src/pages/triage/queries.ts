import { gql } from '../../__generated__/gql';

export const GET_TOP_EMAIL_SOURCES_QUERY = gql(`
  query GetTopEmailSources($limit: Int) {
    getTopEmailSources(limit: $limit) {
      fromAddress
      fromName
      count
    }
  }
`);

export const GET_EMAILS_FOR_TRIAGE_QUERY = gql(`
  query GetEmailsForTriage($input: GetEmailsInput!) {
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
      tags {
        id
        name
        color
      }
    }
  }
`);

export const GET_EMAIL_COUNT_FOR_TRIAGE_QUERY = gql(`
  query GetEmailCountForTriage($input: GetEmailsInput!) {
    getEmailCount(input: $input)
  }
`);

export const BULK_UPDATE_EMAILS_TRIAGE_MUTATION = gql(`
  mutation BulkUpdateEmailsTriage($input: BulkUpdateEmailsInput!) {
    bulkUpdateEmails(input: $input) {
      id
      isRead
      isStarred
      folder
    }
  }
`);

export const BULK_DELETE_EMAILS_TRIAGE_MUTATION = gql(`
  mutation BulkDeleteEmailsTriage($ids: [String!]!) {
    bulkDeleteEmails(ids: $ids)
  }
`);
