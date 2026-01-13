/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  mutation CreateContactFromModal($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      name\n    }\n  }\n": typeof types.CreateContactFromModalDocument,
    "\n  mutation UpdateContactFromModal($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      name\n    }\n  }\n": typeof types.UpdateContactFromModalDocument,
    "\n  query SearchContactsForChipInput($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n    }\n  }\n": typeof types.SearchContactsForChipInputDocument,
    "\n  query SearchContactByEmail($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n": typeof types.SearchContactByEmailDocument,
    "\n  query FetchProfile {\n    fetchProfile {\n      id\n      email\n      firstName\n      lastName\n    }\n  }\n": typeof types.FetchProfileDocument,
    "\n  query GetSmtpProfiles {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      isDefault\n    }\n  }\n": typeof types.GetSmtpProfilesDocument,
    "\n  query GetEmailAccountsForCompose {\n    getEmailAccounts {\n      id\n      name\n      email\n      defaultSmtpProfileId\n    }\n  }\n": typeof types.GetEmailAccountsForComposeDocument,
    "\n  mutation SendEmail($input: ComposeEmailInput!) {\n    sendEmail(input: $input) {\n      id\n      messageId\n      subject\n    }\n  }\n": typeof types.SendEmailDocument,
    "\n  mutation SaveDraft($input: SaveDraftInput!) {\n    saveDraft(input: $input) {\n      id\n      subject\n    }\n  }\n": typeof types.SaveDraftDocument,
    "\n  query GetContacts {\n    getContacts {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n      isAutoCreated\n      createdAt\n    }\n  }\n": typeof types.GetContactsDocument,
    "\n  query SearchContacts($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n    }\n  }\n": typeof types.SearchContactsDocument,
    "\n  mutation CreateContact($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      name\n    }\n  }\n": typeof types.CreateContactDocument,
    "\n  mutation UpdateContact($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n": typeof types.UpdateContactDocument,
    "\n  mutation DeleteContact($id: String!) {\n    deleteContact(id: $id)\n  }\n": typeof types.DeleteContactDocument,
    "\n  query GetEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n      threadId\n      threadCount\n    }\n  }\n": typeof types.GetEmailsDocument,
    "\n  query GetEmailsByThread($threadId: String!) {\n    getEmailsByThread(threadId: $threadId) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n      threadId\n    }\n  }\n": typeof types.GetEmailsByThreadDocument,
    "\n  query GetEmail($input: GetEmailInput!) {\n    getEmail(input: $input) {\n      id\n      emailAccountId\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      inReplyTo\n      references\n      threadId\n      threadCount\n      headers\n      isUnsubscribed\n      unsubscribeUrl\n      unsubscribeEmail\n    }\n  }\n": typeof types.GetEmailDocument,
    "\n  query GetEmailCount($input: GetEmailsInput!) {\n    getEmailCount(input: $input)\n  }\n": typeof types.GetEmailCountDocument,
    "\n  query GetStarredEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      subject\n      textBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n    }\n  }\n": typeof types.GetStarredEmailsDocument,
    "\n  query GetEmailAccountsForInbox {\n    getEmailAccounts {\n      id\n      name\n      email\n      lastSyncedAt\n    }\n  }\n": typeof types.GetEmailAccountsForInboxDocument,
    "\n  mutation SyncAllAccounts {\n    syncAllAccounts\n  }\n": typeof types.SyncAllAccountsDocument,
    "\n  mutation Unsubscribe($input: UnsubscribeInput!) {\n    unsubscribe(input: $input) {\n      id\n      isUnsubscribed\n    }\n  }\n": typeof types.UnsubscribeDocument,
    "\n  mutation CreateContactFromEmail($emailId: String!) {\n    createContactFromEmail(emailId: $emailId) {\n      id\n      email\n      name\n    }\n  }\n": typeof types.CreateContactFromEmailDocument,
    "\n  mutation BulkUpdateEmails($input: BulkUpdateEmailsInput!) {\n    bulkUpdateEmails(input: $input) {\n      id\n      isRead\n      isStarred\n      folder\n    }\n  }\n": typeof types.BulkUpdateEmailsDocument,
    "\n  mutation BulkDeleteEmails($ids: [String!]!) {\n    bulkDeleteEmails(ids: $ids)\n  }\n": typeof types.BulkDeleteEmailsDocument,
    "\n  mutation ForwardEmail($input: ForwardEmailInput!) {\n    forwardEmail(input: $input) {\n      id\n      messageId\n      subject\n    }\n  }\n": typeof types.ForwardEmailDocument,
    "\n  query GetEmailAccounts {\n    getEmailAccounts {\n      id\n      name\n      email\n      host\n      port\n      accountType\n      useSsl\n      lastSyncedAt\n      isSyncing\n      syncProgress\n      syncStatus\n      defaultSmtpProfileId\n      defaultSmtpProfile {\n        id\n        name\n        email\n      }\n    }\n  }\n": typeof types.GetEmailAccountsDocument,
    "\n  mutation CreateEmailAccount($input: CreateEmailAccountInput!) {\n    createEmailAccount(input: $input) {\n      id\n      name\n      email\n    }\n  }\n": typeof types.CreateEmailAccountDocument,
    "\n  mutation DeleteEmailAccount($id: String!) {\n    deleteEmailAccount(id: $id)\n  }\n": typeof types.DeleteEmailAccountDocument,
    "\n  mutation SyncEmailAccount($input: SyncEmailAccountInput!) {\n    syncEmailAccount(input: $input)\n  }\n": typeof types.SyncEmailAccountDocument,
    "\n  mutation SyncAllAccountsSettings {\n    syncAllAccounts\n  }\n": typeof types.SyncAllAccountsSettingsDocument,
    "\n  query GetSmtpProfilesFull {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n    }\n  }\n": typeof types.GetSmtpProfilesFullDocument,
    "\n  mutation CreateSmtpProfile($input: CreateSmtpProfileInput!) {\n    createSmtpProfile(input: $input) {\n      id\n      name\n      email\n    }\n  }\n": typeof types.CreateSmtpProfileDocument,
    "\n  mutation DeleteSmtpProfile($id: String!) {\n    deleteSmtpProfile(id: $id)\n  }\n": typeof types.DeleteSmtpProfileDocument,
    "\n  mutation TestEmailAccountConnection($input: TestEmailAccountConnectionInput!) {\n    testEmailAccountConnection(input: $input) {\n      success\n      message\n    }\n  }\n": typeof types.TestEmailAccountConnectionDocument,
    "\n  mutation TestSmtpConnection($input: TestSmtpConnectionInput!) {\n    testSmtpConnection(input: $input) {\n      success\n      message\n    }\n  }\n": typeof types.TestSmtpConnectionDocument,
    "\n  mutation UpdateEmailAccount($input: UpdateEmailAccountInput!) {\n    updateEmailAccount(input: $input) {\n      id\n      name\n      email\n      host\n      port\n      useSsl\n      defaultSmtpProfileId\n    }\n  }\n": typeof types.UpdateEmailAccountDocument,
    "\n  mutation UpdateSmtpProfile($input: UpdateSmtpProfileInput!) {\n    updateSmtpProfile(input: $input) {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n    }\n  }\n": typeof types.UpdateSmtpProfileDocument,
    "\n  query GetAuthenticationMethods {\n    getAuthenticationMethods {\n      id\n      provider\n      email\n      displayName\n      lastUsedAt\n      createdAt\n    }\n  }\n": typeof types.GetAuthenticationMethodsDocument,
    "\n  mutation DeleteAuthenticationMethod($id: String!) {\n    deleteAuthenticationMethod(id: $id)\n  }\n": typeof types.DeleteAuthenticationMethodDocument,
};
const documents: Documents = {
    "\n  mutation CreateContactFromModal($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      name\n    }\n  }\n": types.CreateContactFromModalDocument,
    "\n  mutation UpdateContactFromModal($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      name\n    }\n  }\n": types.UpdateContactFromModalDocument,
    "\n  query SearchContactsForChipInput($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n    }\n  }\n": types.SearchContactsForChipInputDocument,
    "\n  query SearchContactByEmail($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n": types.SearchContactByEmailDocument,
    "\n  query FetchProfile {\n    fetchProfile {\n      id\n      email\n      firstName\n      lastName\n    }\n  }\n": types.FetchProfileDocument,
    "\n  query GetSmtpProfiles {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      isDefault\n    }\n  }\n": types.GetSmtpProfilesDocument,
    "\n  query GetEmailAccountsForCompose {\n    getEmailAccounts {\n      id\n      name\n      email\n      defaultSmtpProfileId\n    }\n  }\n": types.GetEmailAccountsForComposeDocument,
    "\n  mutation SendEmail($input: ComposeEmailInput!) {\n    sendEmail(input: $input) {\n      id\n      messageId\n      subject\n    }\n  }\n": types.SendEmailDocument,
    "\n  mutation SaveDraft($input: SaveDraftInput!) {\n    saveDraft(input: $input) {\n      id\n      subject\n    }\n  }\n": types.SaveDraftDocument,
    "\n  query GetContacts {\n    getContacts {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n      isAutoCreated\n      createdAt\n    }\n  }\n": types.GetContactsDocument,
    "\n  query SearchContacts($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n    }\n  }\n": types.SearchContactsDocument,
    "\n  mutation CreateContact($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      name\n    }\n  }\n": types.CreateContactDocument,
    "\n  mutation UpdateContact($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n": types.UpdateContactDocument,
    "\n  mutation DeleteContact($id: String!) {\n    deleteContact(id: $id)\n  }\n": types.DeleteContactDocument,
    "\n  query GetEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n      threadId\n      threadCount\n    }\n  }\n": types.GetEmailsDocument,
    "\n  query GetEmailsByThread($threadId: String!) {\n    getEmailsByThread(threadId: $threadId) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n      threadId\n    }\n  }\n": types.GetEmailsByThreadDocument,
    "\n  query GetEmail($input: GetEmailInput!) {\n    getEmail(input: $input) {\n      id\n      emailAccountId\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      inReplyTo\n      references\n      threadId\n      threadCount\n      headers\n      isUnsubscribed\n      unsubscribeUrl\n      unsubscribeEmail\n    }\n  }\n": types.GetEmailDocument,
    "\n  query GetEmailCount($input: GetEmailsInput!) {\n    getEmailCount(input: $input)\n  }\n": types.GetEmailCountDocument,
    "\n  query GetStarredEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      subject\n      textBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n    }\n  }\n": types.GetStarredEmailsDocument,
    "\n  query GetEmailAccountsForInbox {\n    getEmailAccounts {\n      id\n      name\n      email\n      lastSyncedAt\n    }\n  }\n": types.GetEmailAccountsForInboxDocument,
    "\n  mutation SyncAllAccounts {\n    syncAllAccounts\n  }\n": types.SyncAllAccountsDocument,
    "\n  mutation Unsubscribe($input: UnsubscribeInput!) {\n    unsubscribe(input: $input) {\n      id\n      isUnsubscribed\n    }\n  }\n": types.UnsubscribeDocument,
    "\n  mutation CreateContactFromEmail($emailId: String!) {\n    createContactFromEmail(emailId: $emailId) {\n      id\n      email\n      name\n    }\n  }\n": types.CreateContactFromEmailDocument,
    "\n  mutation BulkUpdateEmails($input: BulkUpdateEmailsInput!) {\n    bulkUpdateEmails(input: $input) {\n      id\n      isRead\n      isStarred\n      folder\n    }\n  }\n": types.BulkUpdateEmailsDocument,
    "\n  mutation BulkDeleteEmails($ids: [String!]!) {\n    bulkDeleteEmails(ids: $ids)\n  }\n": types.BulkDeleteEmailsDocument,
    "\n  mutation ForwardEmail($input: ForwardEmailInput!) {\n    forwardEmail(input: $input) {\n      id\n      messageId\n      subject\n    }\n  }\n": types.ForwardEmailDocument,
    "\n  query GetEmailAccounts {\n    getEmailAccounts {\n      id\n      name\n      email\n      host\n      port\n      accountType\n      useSsl\n      lastSyncedAt\n      isSyncing\n      syncProgress\n      syncStatus\n      defaultSmtpProfileId\n      defaultSmtpProfile {\n        id\n        name\n        email\n      }\n    }\n  }\n": types.GetEmailAccountsDocument,
    "\n  mutation CreateEmailAccount($input: CreateEmailAccountInput!) {\n    createEmailAccount(input: $input) {\n      id\n      name\n      email\n    }\n  }\n": types.CreateEmailAccountDocument,
    "\n  mutation DeleteEmailAccount($id: String!) {\n    deleteEmailAccount(id: $id)\n  }\n": types.DeleteEmailAccountDocument,
    "\n  mutation SyncEmailAccount($input: SyncEmailAccountInput!) {\n    syncEmailAccount(input: $input)\n  }\n": types.SyncEmailAccountDocument,
    "\n  mutation SyncAllAccountsSettings {\n    syncAllAccounts\n  }\n": types.SyncAllAccountsSettingsDocument,
    "\n  query GetSmtpProfilesFull {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n    }\n  }\n": types.GetSmtpProfilesFullDocument,
    "\n  mutation CreateSmtpProfile($input: CreateSmtpProfileInput!) {\n    createSmtpProfile(input: $input) {\n      id\n      name\n      email\n    }\n  }\n": types.CreateSmtpProfileDocument,
    "\n  mutation DeleteSmtpProfile($id: String!) {\n    deleteSmtpProfile(id: $id)\n  }\n": types.DeleteSmtpProfileDocument,
    "\n  mutation TestEmailAccountConnection($input: TestEmailAccountConnectionInput!) {\n    testEmailAccountConnection(input: $input) {\n      success\n      message\n    }\n  }\n": types.TestEmailAccountConnectionDocument,
    "\n  mutation TestSmtpConnection($input: TestSmtpConnectionInput!) {\n    testSmtpConnection(input: $input) {\n      success\n      message\n    }\n  }\n": types.TestSmtpConnectionDocument,
    "\n  mutation UpdateEmailAccount($input: UpdateEmailAccountInput!) {\n    updateEmailAccount(input: $input) {\n      id\n      name\n      email\n      host\n      port\n      useSsl\n      defaultSmtpProfileId\n    }\n  }\n": types.UpdateEmailAccountDocument,
    "\n  mutation UpdateSmtpProfile($input: UpdateSmtpProfileInput!) {\n    updateSmtpProfile(input: $input) {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n    }\n  }\n": types.UpdateSmtpProfileDocument,
    "\n  query GetAuthenticationMethods {\n    getAuthenticationMethods {\n      id\n      provider\n      email\n      displayName\n      lastUsedAt\n      createdAt\n    }\n  }\n": types.GetAuthenticationMethodsDocument,
    "\n  mutation DeleteAuthenticationMethod($id: String!) {\n    deleteAuthenticationMethod(id: $id)\n  }\n": types.DeleteAuthenticationMethodDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateContactFromModal($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation CreateContactFromModal($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      name\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateContactFromModal($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateContactFromModal($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      name\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query SearchContactsForChipInput($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n    }\n  }\n"): (typeof documents)["\n  query SearchContactsForChipInput($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query SearchContactByEmail($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n"): (typeof documents)["\n  query SearchContactByEmail($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query FetchProfile {\n    fetchProfile {\n      id\n      email\n      firstName\n      lastName\n    }\n  }\n"): (typeof documents)["\n  query FetchProfile {\n    fetchProfile {\n      id\n      email\n      firstName\n      lastName\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetSmtpProfiles {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      isDefault\n    }\n  }\n"): (typeof documents)["\n  query GetSmtpProfiles {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      isDefault\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmailAccountsForCompose {\n    getEmailAccounts {\n      id\n      name\n      email\n      defaultSmtpProfileId\n    }\n  }\n"): (typeof documents)["\n  query GetEmailAccountsForCompose {\n    getEmailAccounts {\n      id\n      name\n      email\n      defaultSmtpProfileId\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SendEmail($input: ComposeEmailInput!) {\n    sendEmail(input: $input) {\n      id\n      messageId\n      subject\n    }\n  }\n"): (typeof documents)["\n  mutation SendEmail($input: ComposeEmailInput!) {\n    sendEmail(input: $input) {\n      id\n      messageId\n      subject\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SaveDraft($input: SaveDraftInput!) {\n    saveDraft(input: $input) {\n      id\n      subject\n    }\n  }\n"): (typeof documents)["\n  mutation SaveDraft($input: SaveDraftInput!) {\n    saveDraft(input: $input) {\n      id\n      subject\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetContacts {\n    getContacts {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n      isAutoCreated\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query GetContacts {\n    getContacts {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n      isAutoCreated\n      createdAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query SearchContacts($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n    }\n  }\n"): (typeof documents)["\n  query SearchContacts($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateContact($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation CreateContact($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      name\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateContact($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateContact($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteContact($id: String!) {\n    deleteContact(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteContact($id: String!) {\n    deleteContact(id: $id)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n      threadId\n      threadCount\n    }\n  }\n"): (typeof documents)["\n  query GetEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n      threadId\n      threadCount\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmailsByThread($threadId: String!) {\n    getEmailsByThread(threadId: $threadId) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n      threadId\n    }\n  }\n"): (typeof documents)["\n  query GetEmailsByThread($threadId: String!) {\n    getEmailsByThread(threadId: $threadId) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n      threadId\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmail($input: GetEmailInput!) {\n    getEmail(input: $input) {\n      id\n      emailAccountId\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      inReplyTo\n      references\n      threadId\n      threadCount\n      headers\n      isUnsubscribed\n      unsubscribeUrl\n      unsubscribeEmail\n    }\n  }\n"): (typeof documents)["\n  query GetEmail($input: GetEmailInput!) {\n    getEmail(input: $input) {\n      id\n      emailAccountId\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      inReplyTo\n      references\n      threadId\n      threadCount\n      headers\n      isUnsubscribed\n      unsubscribeUrl\n      unsubscribeEmail\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmailCount($input: GetEmailsInput!) {\n    getEmailCount(input: $input)\n  }\n"): (typeof documents)["\n  query GetEmailCount($input: GetEmailsInput!) {\n    getEmailCount(input: $input)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetStarredEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      subject\n      textBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n    }\n  }\n"): (typeof documents)["\n  query GetStarredEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      subject\n      textBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmailAccountsForInbox {\n    getEmailAccounts {\n      id\n      name\n      email\n      lastSyncedAt\n    }\n  }\n"): (typeof documents)["\n  query GetEmailAccountsForInbox {\n    getEmailAccounts {\n      id\n      name\n      email\n      lastSyncedAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SyncAllAccounts {\n    syncAllAccounts\n  }\n"): (typeof documents)["\n  mutation SyncAllAccounts {\n    syncAllAccounts\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation Unsubscribe($input: UnsubscribeInput!) {\n    unsubscribe(input: $input) {\n      id\n      isUnsubscribed\n    }\n  }\n"): (typeof documents)["\n  mutation Unsubscribe($input: UnsubscribeInput!) {\n    unsubscribe(input: $input) {\n      id\n      isUnsubscribed\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateContactFromEmail($emailId: String!) {\n    createContactFromEmail(emailId: $emailId) {\n      id\n      email\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation CreateContactFromEmail($emailId: String!) {\n    createContactFromEmail(emailId: $emailId) {\n      id\n      email\n      name\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation BulkUpdateEmails($input: BulkUpdateEmailsInput!) {\n    bulkUpdateEmails(input: $input) {\n      id\n      isRead\n      isStarred\n      folder\n    }\n  }\n"): (typeof documents)["\n  mutation BulkUpdateEmails($input: BulkUpdateEmailsInput!) {\n    bulkUpdateEmails(input: $input) {\n      id\n      isRead\n      isStarred\n      folder\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation BulkDeleteEmails($ids: [String!]!) {\n    bulkDeleteEmails(ids: $ids)\n  }\n"): (typeof documents)["\n  mutation BulkDeleteEmails($ids: [String!]!) {\n    bulkDeleteEmails(ids: $ids)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation ForwardEmail($input: ForwardEmailInput!) {\n    forwardEmail(input: $input) {\n      id\n      messageId\n      subject\n    }\n  }\n"): (typeof documents)["\n  mutation ForwardEmail($input: ForwardEmailInput!) {\n    forwardEmail(input: $input) {\n      id\n      messageId\n      subject\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmailAccounts {\n    getEmailAccounts {\n      id\n      name\n      email\n      host\n      port\n      accountType\n      useSsl\n      lastSyncedAt\n      isSyncing\n      syncProgress\n      syncStatus\n      defaultSmtpProfileId\n      defaultSmtpProfile {\n        id\n        name\n        email\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetEmailAccounts {\n    getEmailAccounts {\n      id\n      name\n      email\n      host\n      port\n      accountType\n      useSsl\n      lastSyncedAt\n      isSyncing\n      syncProgress\n      syncStatus\n      defaultSmtpProfileId\n      defaultSmtpProfile {\n        id\n        name\n        email\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateEmailAccount($input: CreateEmailAccountInput!) {\n    createEmailAccount(input: $input) {\n      id\n      name\n      email\n    }\n  }\n"): (typeof documents)["\n  mutation CreateEmailAccount($input: CreateEmailAccountInput!) {\n    createEmailAccount(input: $input) {\n      id\n      name\n      email\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteEmailAccount($id: String!) {\n    deleteEmailAccount(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteEmailAccount($id: String!) {\n    deleteEmailAccount(id: $id)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SyncEmailAccount($input: SyncEmailAccountInput!) {\n    syncEmailAccount(input: $input)\n  }\n"): (typeof documents)["\n  mutation SyncEmailAccount($input: SyncEmailAccountInput!) {\n    syncEmailAccount(input: $input)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SyncAllAccountsSettings {\n    syncAllAccounts\n  }\n"): (typeof documents)["\n  mutation SyncAllAccountsSettings {\n    syncAllAccounts\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetSmtpProfilesFull {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n    }\n  }\n"): (typeof documents)["\n  query GetSmtpProfilesFull {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateSmtpProfile($input: CreateSmtpProfileInput!) {\n    createSmtpProfile(input: $input) {\n      id\n      name\n      email\n    }\n  }\n"): (typeof documents)["\n  mutation CreateSmtpProfile($input: CreateSmtpProfileInput!) {\n    createSmtpProfile(input: $input) {\n      id\n      name\n      email\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteSmtpProfile($id: String!) {\n    deleteSmtpProfile(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteSmtpProfile($id: String!) {\n    deleteSmtpProfile(id: $id)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation TestEmailAccountConnection($input: TestEmailAccountConnectionInput!) {\n    testEmailAccountConnection(input: $input) {\n      success\n      message\n    }\n  }\n"): (typeof documents)["\n  mutation TestEmailAccountConnection($input: TestEmailAccountConnectionInput!) {\n    testEmailAccountConnection(input: $input) {\n      success\n      message\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation TestSmtpConnection($input: TestSmtpConnectionInput!) {\n    testSmtpConnection(input: $input) {\n      success\n      message\n    }\n  }\n"): (typeof documents)["\n  mutation TestSmtpConnection($input: TestSmtpConnectionInput!) {\n    testSmtpConnection(input: $input) {\n      success\n      message\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateEmailAccount($input: UpdateEmailAccountInput!) {\n    updateEmailAccount(input: $input) {\n      id\n      name\n      email\n      host\n      port\n      useSsl\n      defaultSmtpProfileId\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateEmailAccount($input: UpdateEmailAccountInput!) {\n    updateEmailAccount(input: $input) {\n      id\n      name\n      email\n      host\n      port\n      useSsl\n      defaultSmtpProfileId\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateSmtpProfile($input: UpdateSmtpProfileInput!) {\n    updateSmtpProfile(input: $input) {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateSmtpProfile($input: UpdateSmtpProfileInput!) {\n    updateSmtpProfile(input: $input) {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetAuthenticationMethods {\n    getAuthenticationMethods {\n      id\n      provider\n      email\n      displayName\n      lastUsedAt\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query GetAuthenticationMethods {\n    getAuthenticationMethods {\n      id\n      provider\n      email\n      displayName\n      lastUsedAt\n      createdAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteAuthenticationMethod($id: String!) {\n    deleteAuthenticationMethod(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteAuthenticationMethod($id: String!) {\n    deleteAuthenticationMethod(id: $id)\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;