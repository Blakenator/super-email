import { gql } from '../../__generated__/gql';

export const GET_CONTACTS_QUERY = gql(`
  query GetContacts {
    getContacts {
      id
      email
      name
      firstName
      lastName
      company
      phone
      notes
      isAutoCreated
      createdAt
    }
  }
`);

export const SEARCH_CONTACTS_QUERY = gql(`
  query SearchContacts($query: String!) {
    searchContacts(query: $query) {
      id
      email
      name
      firstName
      lastName
    }
  }
`);

export const CREATE_CONTACT_MUTATION = gql(`
  mutation CreateContact($input: CreateContactInput!) {
    createContact(input: $input) {
      id
      email
      name
    }
  }
`);

export const UPDATE_CONTACT_MUTATION = gql(`
  mutation UpdateContact($input: UpdateContactInput!) {
    updateContact(input: $input) {
      id
      email
      name
      firstName
      lastName
      company
      phone
      notes
    }
  }
`);

export const DELETE_CONTACT_MUTATION = gql(`
  mutation DeleteContact($id: String!) {
    deleteContact(id: $id)
  }
`);
