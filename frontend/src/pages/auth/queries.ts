import { gql } from '../../__generated__/gql';

export const SIGN_UP_MUTATION = gql(`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      token
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`);

export const LOGIN_MUTATION = gql(`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`);
