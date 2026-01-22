import { gql } from '../../__generated__/gql';

export const FETCH_PROFILE_QUERY = gql(`
  query FetchProfile {
    fetchProfile {
      id
      email
      firstName
      lastName
      themePreference
      navbarCollapsed
      notificationDetailLevel
      inboxDensity
      inboxGroupByDate
      blockExternalImages
    }
  }
`);

export const UPDATE_USER_PREFERENCES_MUTATION = gql(`
  mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
    updateUserPreferences(input: $input) {
      id
      themePreference
      navbarCollapsed
      notificationDetailLevel
      inboxDensity
      inboxGroupByDate
      blockExternalImages
    }
  }
`);
