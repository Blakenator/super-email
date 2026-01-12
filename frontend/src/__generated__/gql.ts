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
    "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      token\n      user {\n        id\n        email\n        firstName\n        lastName\n      }\n    }\n  }\n": typeof types.SignUpDocument,
    "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        id\n        email\n        firstName\n        lastName\n      }\n    }\n  }\n": typeof types.LoginDocument,
    "\n  query GetSmtpProfiles {\n    getSmtpProfiles {\n      id\n      name\n      email\n      isDefault\n    }\n  }\n": typeof types.GetSmtpProfilesDocument,
    "\n  query GetEmailAccountsForCompose {\n    getEmailAccounts {\n      id\n      name\n      email\n      defaultSmtpProfileId\n    }\n  }\n": typeof types.GetEmailAccountsForComposeDocument,
    "\n  mutation SendEmail($input: ComposeEmailInput!) {\n    sendEmail(input: $input) {\n      id\n      messageId\n      subject\n    }\n  }\n": typeof types.SendEmailDocument,
    "\n  mutation SaveDraft($input: SaveDraftInput!) {\n    saveDraft(input: $input) {\n      id\n      subject\n    }\n  }\n": typeof types.SaveDraftDocument,
    "\n  query GetEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n    }\n  }\n": typeof types.GetEmailsDocument,
    "\n  query GetEmail($input: GetEmailInput!) {\n    getEmail(input: $input) {\n      id\n      emailAccountId\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      inReplyTo\n      references\n    }\n  }\n": typeof types.GetEmailDocument,
    "\n  query GetEmailCount($input: GetEmailsInput!) {\n    getEmailCount(input: $input)\n  }\n": typeof types.GetEmailCountDocument,
    "\n  mutation UpdateEmail($input: UpdateEmailInput!) {\n    updateEmail(input: $input) {\n      id\n      isRead\n      isStarred\n      folder\n    }\n  }\n": typeof types.UpdateEmailDocument,
    "\n  mutation DeleteEmail($id: String!) {\n    deleteEmail(id: $id)\n  }\n": typeof types.DeleteEmailDocument,
    "\n  query GetStarredEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      subject\n      textBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n    }\n  }\n": typeof types.GetStarredEmailsDocument,
    "\n  query GetEmailAccountsForInbox {\n    getEmailAccounts {\n      id\n      name\n      email\n      lastSyncedAt\n    }\n  }\n": typeof types.GetEmailAccountsForInboxDocument,
    "\n  mutation SyncAllAccounts {\n    syncAllAccounts\n  }\n": typeof types.SyncAllAccountsDocument,
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
};
const documents: Documents = {
    "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      token\n      user {\n        id\n        email\n        firstName\n        lastName\n      }\n    }\n  }\n": types.SignUpDocument,
    "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        id\n        email\n        firstName\n        lastName\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  query GetSmtpProfiles {\n    getSmtpProfiles {\n      id\n      name\n      email\n      isDefault\n    }\n  }\n": types.GetSmtpProfilesDocument,
    "\n  query GetEmailAccountsForCompose {\n    getEmailAccounts {\n      id\n      name\n      email\n      defaultSmtpProfileId\n    }\n  }\n": types.GetEmailAccountsForComposeDocument,
    "\n  mutation SendEmail($input: ComposeEmailInput!) {\n    sendEmail(input: $input) {\n      id\n      messageId\n      subject\n    }\n  }\n": types.SendEmailDocument,
    "\n  mutation SaveDraft($input: SaveDraftInput!) {\n    saveDraft(input: $input) {\n      id\n      subject\n    }\n  }\n": types.SaveDraftDocument,
    "\n  query GetEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n    }\n  }\n": types.GetEmailsDocument,
    "\n  query GetEmail($input: GetEmailInput!) {\n    getEmail(input: $input) {\n      id\n      emailAccountId\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      inReplyTo\n      references\n    }\n  }\n": types.GetEmailDocument,
    "\n  query GetEmailCount($input: GetEmailsInput!) {\n    getEmailCount(input: $input)\n  }\n": types.GetEmailCountDocument,
    "\n  mutation UpdateEmail($input: UpdateEmailInput!) {\n    updateEmail(input: $input) {\n      id\n      isRead\n      isStarred\n      folder\n    }\n  }\n": types.UpdateEmailDocument,
    "\n  mutation DeleteEmail($id: String!) {\n    deleteEmail(id: $id)\n  }\n": types.DeleteEmailDocument,
    "\n  query GetStarredEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      subject\n      textBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n    }\n  }\n": types.GetStarredEmailsDocument,
    "\n  query GetEmailAccountsForInbox {\n    getEmailAccounts {\n      id\n      name\n      email\n      lastSyncedAt\n    }\n  }\n": types.GetEmailAccountsForInboxDocument,
    "\n  mutation SyncAllAccounts {\n    syncAllAccounts\n  }\n": types.SyncAllAccountsDocument,
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
export function gql(source: "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      token\n      user {\n        id\n        email\n        firstName\n        lastName\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      token\n      user {\n        id\n        email\n        firstName\n        lastName\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        id\n        email\n        firstName\n        lastName\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        id\n        email\n        firstName\n        lastName\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetSmtpProfiles {\n    getSmtpProfiles {\n      id\n      name\n      email\n      isDefault\n    }\n  }\n"): (typeof documents)["\n  query GetSmtpProfiles {\n    getSmtpProfiles {\n      id\n      name\n      email\n      isDefault\n    }\n  }\n"];
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
export function gql(source: "\n  query GetEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n    }\n  }\n"): (typeof documents)["\n  query GetEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmail($input: GetEmailInput!) {\n    getEmail(input: $input) {\n      id\n      emailAccountId\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      inReplyTo\n      references\n    }\n  }\n"): (typeof documents)["\n  query GetEmail($input: GetEmailInput!) {\n    getEmail(input: $input) {\n      id\n      emailAccountId\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      inReplyTo\n      references\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmailCount($input: GetEmailsInput!) {\n    getEmailCount(input: $input)\n  }\n"): (typeof documents)["\n  query GetEmailCount($input: GetEmailsInput!) {\n    getEmailCount(input: $input)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateEmail($input: UpdateEmailInput!) {\n    updateEmail(input: $input) {\n      id\n      isRead\n      isStarred\n      folder\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateEmail($input: UpdateEmailInput!) {\n    updateEmail(input: $input) {\n      id\n      isRead\n      isStarred\n      folder\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteEmail($id: String!) {\n    deleteEmail(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteEmail($id: String!) {\n    deleteEmail(id: $id)\n  }\n"];
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

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;