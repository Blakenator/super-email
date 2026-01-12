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
      subject
      textBody
      receivedAt
      isRead
      isStarred
      emailAccountId
    }
  }
`);

export const GET_EMAIL_QUERY = gql(`
  query GetEmail($input: GetEmailInput!) {
    getEmail(input: $input) {
      id
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
