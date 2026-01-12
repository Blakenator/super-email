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

export const SEND_EMAIL_MUTATION = gql(`
  mutation SendEmail($input: ComposeEmailInput!) {
    sendEmail(input: $input) {
      id
      messageId
      subject
    }
  }
`);
