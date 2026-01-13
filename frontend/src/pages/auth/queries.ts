import { gql } from '../../__generated__/gql';

export const FETCH_PROFILE_QUERY = gql(`
  query FetchProfile {
    fetchProfile {
      id
      email
      firstName
      lastName
    }
  }
`);
