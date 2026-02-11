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
    "\n  query GetAttachmentDownloadUrl($id: String!) {\n    getAttachmentDownloadUrl(id: $id)\n  }\n": typeof types.GetAttachmentDownloadUrlDocument,
    "\n  mutation UpdateThemePreference($themePreference: ThemePreference!) {\n    updateThemePreference(themePreference: $themePreference) {\n      id\n      themePreference\n    }\n  }\n": typeof types.UpdateThemePreferenceDocument,
    "\n  query GetContactsForModal {\n    getContacts {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n      company\n    }\n  }\n": typeof types.GetContactsForModalDocument,
    "\n  mutation CreateContactFromModal($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      name\n      emails {\n        id\n        email\n        isPrimary\n      }\n    }\n  }\n": typeof types.CreateContactFromModalDocument,
    "\n  mutation UpdateContactFromModal($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      name\n      emails {\n        id\n        email\n        isPrimary\n      }\n    }\n  }\n": typeof types.UpdateContactFromModalDocument,
    "\n  mutation AddEmailToContact($input: AddEmailToContactInput!) {\n    addEmailToContact(input: $input) {\n      id\n      email\n      name\n      emails {\n        id\n        email\n        isPrimary\n      }\n    }\n  }\n": typeof types.AddEmailToContactDocument,
    "\n  query SearchContactsForChipInput($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n    }\n  }\n": typeof types.SearchContactsForChipInputDocument,
    "\n  query SearchContactByEmail($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n": typeof types.SearchContactByEmailDocument,
    "\n  subscription MailboxUpdates {\n    mailboxUpdates {\n      type\n      emailAccountId\n      message\n      emails {\n        id\n        messageId\n        folder\n        fromAddress\n        fromName\n        subject\n        textBody\n        receivedAt\n        isRead\n        isStarred\n        emailAccountId\n        toAddresses\n        ccAddresses\n        bccAddresses\n        threadId\n        threadCount\n        tags {\n          id\n          name\n          color\n        }\n      }\n    }\n  }\n": typeof types.MailboxUpdatesDocument,
    "\n  query FetchProfile {\n    fetchProfile {\n      id\n      email\n      firstName\n      lastName\n      themePreference\n      navbarCollapsed\n      notificationDetailLevel\n      inboxDensity\n      inboxGroupByDate\n      blockExternalImages\n    }\n  }\n": typeof types.FetchProfileDocument,
    "\n  mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {\n    updateUserPreferences(input: $input) {\n      id\n      themePreference\n      navbarCollapsed\n      notificationDetailLevel\n      inboxDensity\n      inboxGroupByDate\n      blockExternalImages\n    }\n  }\n": typeof types.UpdateUserPreferencesDocument,
    "\n  query GetSmtpProfiles {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      isDefault\n    }\n  }\n": typeof types.GetSmtpProfilesDocument,
    "\n  query GetEmailAccountsForCompose {\n    getEmailAccounts {\n      id\n      name\n      email\n      defaultSmtpProfileId\n      isDefault\n    }\n  }\n": typeof types.GetEmailAccountsForComposeDocument,
    "\n  mutation SendEmail($input: ComposeEmailInput!) {\n    sendEmail(input: $input) {\n      id\n      messageId\n      subject\n    }\n  }\n": typeof types.SendEmailDocument,
    "\n  mutation SaveDraft($input: SaveDraftInput!) {\n    saveDraft(input: $input) {\n      id\n      subject\n    }\n  }\n": typeof types.SaveDraftDocument,
    "\n  query GetContacts {\n    getContacts {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n      isAutoCreated\n      createdAt\n    }\n  }\n": typeof types.GetContactsDocument,
    "\n  query SearchContacts($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n    }\n  }\n": typeof types.SearchContactsDocument,
    "\n  mutation CreateContact($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n    }\n  }\n": typeof types.CreateContactDocument,
    "\n  mutation UpdateContact($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n": typeof types.UpdateContactDocument,
    "\n  mutation DeleteContact($id: String!) {\n    deleteContact(id: $id)\n  }\n": typeof types.DeleteContactDocument,
    "\n  query GetEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n      threadId\n      threadCount\n      hasAttachments\n      attachmentCount\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n": typeof types.GetEmailsDocument,
    "\n  query GetEmailsByThread($threadId: String!) {\n    getEmailsByThread(threadId: $threadId) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      hasAttachments\n      attachmentCount\n      attachments {\n        id\n        filename\n        mimeType\n        extension\n        size\n        attachmentType\n        contentId\n        isSafe\n      }\n      inReplyTo\n      threadId\n    }\n  }\n": typeof types.GetEmailsByThreadDocument,
    "\n  query GetEmail($input: GetEmailInput!) {\n    getEmail(input: $input) {\n      id\n      emailAccountId\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      inReplyTo\n      references\n      threadId\n      threadCount\n      headers\n      isUnsubscribed\n      unsubscribeUrl\n      unsubscribeEmail\n      hasAttachments\n      attachmentCount\n      attachments {\n        id\n        filename\n        mimeType\n        extension\n        size\n        attachmentType\n        contentId\n        isSafe\n      }\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n": typeof types.GetEmailDocument,
    "\n  query GetEmailCount($input: GetEmailsInput!) {\n    getEmailCount(input: $input)\n  }\n": typeof types.GetEmailCountDocument,
    "\n  query GetStarredEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      subject\n      textBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n    }\n  }\n": typeof types.GetStarredEmailsDocument,
    "\n  query GetEmailAccountsForInbox {\n    getEmailAccounts {\n      id\n      name\n      email\n      host\n      lastSyncedAt\n      providerId\n    }\n  }\n": typeof types.GetEmailAccountsForInboxDocument,
    "\n  mutation SyncAllAccounts {\n    syncAllAccounts\n  }\n": typeof types.SyncAllAccountsDocument,
    "\n  mutation Unsubscribe($input: UnsubscribeInput!) {\n    unsubscribe(input: $input) {\n      id\n      isUnsubscribed\n    }\n  }\n": typeof types.UnsubscribeDocument,
    "\n  mutation CreateContactFromEmail($emailId: String!) {\n    createContactFromEmail(emailId: $emailId) {\n      id\n      email\n      name\n    }\n  }\n": typeof types.CreateContactFromEmailDocument,
    "\n  mutation BulkUpdateEmails($input: BulkUpdateEmailsInput!) {\n    bulkUpdateEmails(input: $input) {\n      id\n      isRead\n      isStarred\n      folder\n    }\n  }\n": typeof types.BulkUpdateEmailsDocument,
    "\n  mutation BulkDeleteEmails($ids: [String!]!) {\n    bulkDeleteEmails(ids: $ids)\n  }\n": typeof types.BulkDeleteEmailsDocument,
    "\n  mutation ForwardEmail($input: ForwardEmailInput!) {\n    forwardEmail(input: $input) {\n      id\n      messageId\n      subject\n    }\n  }\n": typeof types.ForwardEmailDocument,
    "\n  mutation NukeOldEmails($input: NukeOldEmailsInput!) {\n    nukeOldEmails(input: $input)\n  }\n": typeof types.NukeOldEmailsDocument,
    "\n  query GetTagsForInbox {\n    getTags {\n      id\n      name\n      color\n      emailCount\n    }\n  }\n": typeof types.GetTagsForInboxDocument,
    "\n  mutation AddTagsToEmailsInbox($input: AddTagsToEmailsInput!) {\n    addTagsToEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n": typeof types.AddTagsToEmailsInboxDocument,
    "\n  mutation RemoveTagsFromEmailsInbox($input: RemoveTagsFromEmailsInput!) {\n    removeTagsFromEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n": typeof types.RemoveTagsFromEmailsInboxDocument,
    "\n  mutation GetPushTokens {\n    getPushTokens {\n      id\n      token\n      platform\n      deviceName\n      isActive\n      lastUsedAt\n      createdAt\n    }\n  }\n": typeof types.GetPushTokensDocument,
    "\n  mutation RegisterPushToken($input: RegisterPushTokenInput!) {\n    registerPushToken(input: $input) {\n      success\n      message\n    }\n  }\n": typeof types.RegisterPushTokenDocument,
    "\n  mutation UnregisterPushToken($token: String!) {\n    unregisterPushToken(token: $token)\n  }\n": typeof types.UnregisterPushTokenDocument,
    "\n  query GetEmailAccounts {\n    getEmailAccounts {\n      id\n      name\n      email\n      host\n      port\n      accountType\n      useSsl\n      lastSyncedAt\n      isHistoricalSyncing\n      historicalSyncProgress\n      historicalSyncStatus\n      historicalSyncLastAt\n      isUpdateSyncing\n      updateSyncProgress\n      updateSyncStatus\n      lastSyncEmailReceivedAt\n      defaultSmtpProfileId\n      defaultSmtpProfile {\n        id\n        name\n        email\n      }\n      providerId\n      isDefault\n    }\n  }\n": typeof types.GetEmailAccountsDocument,
    "\n  mutation CreateEmailAccount($input: CreateEmailAccountInput!) {\n    createEmailAccount(input: $input) {\n      id\n      name\n      email\n    }\n  }\n": typeof types.CreateEmailAccountDocument,
    "\n  mutation DeleteEmailAccount($id: String!) {\n    deleteEmailAccount(id: $id)\n  }\n": typeof types.DeleteEmailAccountDocument,
    "\n  mutation SyncEmailAccount($input: SyncEmailAccountInput!) {\n    syncEmailAccount(input: $input)\n  }\n": typeof types.SyncEmailAccountDocument,
    "\n  mutation SyncAllAccountsSettings {\n    syncAllAccounts\n  }\n": typeof types.SyncAllAccountsSettingsDocument,
    "\n  mutation UpdateEmailAccount($input: UpdateEmailAccountInput!) {\n    updateEmailAccount(input: $input) {\n      id\n      name\n      email\n      host\n      port\n      useSsl\n      defaultSmtpProfileId\n      isDefault\n    }\n  }\n": typeof types.UpdateEmailAccountDocument,
    "\n  mutation TestEmailAccountConnection($input: TestEmailAccountConnectionInput!) {\n    testEmailAccountConnection(input: $input) {\n      success\n      message\n    }\n  }\n": typeof types.TestEmailAccountConnectionDocument,
    "\n  query GetSmtpProfilesFull {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n      providerId\n    }\n  }\n": typeof types.GetSmtpProfilesFullDocument,
    "\n  mutation CreateSmtpProfile($input: CreateSmtpProfileInput!) {\n    createSmtpProfile(input: $input) {\n      id\n      name\n      email\n    }\n  }\n": typeof types.CreateSmtpProfileDocument,
    "\n  mutation DeleteSmtpProfile($id: String!) {\n    deleteSmtpProfile(id: $id)\n  }\n": typeof types.DeleteSmtpProfileDocument,
    "\n  mutation UpdateSmtpProfile($input: UpdateSmtpProfileInput!) {\n    updateSmtpProfile(input: $input) {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n    }\n  }\n": typeof types.UpdateSmtpProfileDocument,
    "\n  mutation TestSmtpConnection($input: TestSmtpConnectionInput!) {\n    testSmtpConnection(input: $input) {\n      success\n      message\n    }\n  }\n": typeof types.TestSmtpConnectionDocument,
    "\n  query GetAuthenticationMethods {\n    getAuthenticationMethods {\n      id\n      provider\n      email\n      displayName\n      lastUsedAt\n      createdAt\n    }\n  }\n": typeof types.GetAuthenticationMethodsDocument,
    "\n  mutation DeleteAuthenticationMethod($id: String!) {\n    deleteAuthenticationMethod(id: $id)\n  }\n": typeof types.DeleteAuthenticationMethodDocument,
    "\n  query GetTags {\n    getTags {\n      id\n      name\n      color\n      description\n      emailCount\n    }\n  }\n": typeof types.GetTagsDocument,
    "\n  mutation CreateTag($input: CreateTagInput!) {\n    createTag(input: $input) {\n      id\n      name\n      color\n      description\n      emailCount\n    }\n  }\n": typeof types.CreateTagDocument,
    "\n  mutation UpdateTag($input: UpdateTagInput!) {\n    updateTag(input: $input) {\n      id\n      name\n      color\n      description\n      emailCount\n    }\n  }\n": typeof types.UpdateTagDocument,
    "\n  mutation DeleteTag($id: String!) {\n    deleteTag(id: $id)\n  }\n": typeof types.DeleteTagDocument,
    "\n  mutation AddTagsToEmails($input: AddTagsToEmailsInput!) {\n    addTagsToEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n": typeof types.AddTagsToEmailsDocument,
    "\n  mutation RemoveTagsFromEmails($input: RemoveTagsFromEmailsInput!) {\n    removeTagsFromEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n": typeof types.RemoveTagsFromEmailsDocument,
    "\n  query GetMailRules {\n    getMailRules {\n      id\n      name\n      description\n      emailAccountId\n      emailAccount {\n        id\n        name\n        email\n      }\n      conditions {\n        fromContains\n        toContains\n        ccContains\n        bccContains\n        subjectContains\n        bodyContains\n      }\n      actions {\n        archive\n        star\n        delete\n        markRead\n        addTagIds\n        forwardTo\n      }\n      isEnabled\n      priority\n      stopProcessing\n    }\n  }\n": typeof types.GetMailRulesDocument,
    "\n  mutation CreateMailRule($input: CreateMailRuleInput!) {\n    createMailRule(input: $input) {\n      id\n      name\n      description\n      isEnabled\n      priority\n    }\n  }\n": typeof types.CreateMailRuleDocument,
    "\n  mutation UpdateMailRule($input: UpdateMailRuleInput!) {\n    updateMailRule(input: $input) {\n      id\n      name\n      description\n      isEnabled\n      priority\n    }\n  }\n": typeof types.UpdateMailRuleDocument,
    "\n  mutation DeleteMailRule($id: String!) {\n    deleteMailRule(id: $id)\n  }\n": typeof types.DeleteMailRuleDocument,
    "\n  query PreviewMailRule($id: String!) {\n    previewMailRule(id: $id)\n  }\n": typeof types.PreviewMailRuleDocument,
    "\n  mutation RunMailRule($id: String!) {\n    runMailRule(id: $id) {\n      matchedCount\n      processedCount\n    }\n  }\n": typeof types.RunMailRuleDocument,
    "\n  query GetBillingInfo($sessionId: String) {\n    getBillingInfo(sessionId: $sessionId) {\n      subscription {\n        id\n        status\n        storageTier\n        accountTier\n        storageLimitBytes\n        accountLimit\n        isValid\n        currentPeriodEnd\n        cancelAtPeriodEnd\n      }\n      hasStripeCustomer\n      usage {\n        userId\n        accountCount\n        totalBodySizeBytes\n        totalAttachmentSizeBytes\n        totalStorageBytes\n        totalStorageGB\n        emailCount\n        attachmentCount\n        lastRefreshedAt\n      }\n      storageUsagePercent\n      accountUsagePercent\n      isStorageLimitExceeded\n      isAccountLimitExceeded\n      isStripeConfigured\n      prices {\n        id\n        tier\n        type\n        name\n        unitAmount\n        currency\n        interval\n      }\n    }\n  }\n": typeof types.GetBillingInfoDocument,
    "\n  mutation CreateBillingPortalSession {\n    createBillingPortalSession\n  }\n": typeof types.CreateBillingPortalSessionDocument,
    "\n  mutation RefreshStorageUsage {\n    refreshStorageUsage\n  }\n": typeof types.RefreshStorageUsageDocument,
    "\n  mutation CreateCheckoutSession($storageTier: StorageTier!, $accountTier: AccountTier!) {\n    createCheckoutSession(storageTier: $storageTier, accountTier: $accountTier)\n  }\n": typeof types.CreateCheckoutSessionDocument,
    "\n  query GetTopEmailSources($limit: Int) {\n    getTopEmailSources(limit: $limit) {\n      fromAddress\n      fromName\n      count\n    }\n  }\n": typeof types.GetTopEmailSourcesDocument,
    "\n  query GetEmailsForTriage($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      subject\n      textBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n": typeof types.GetEmailsForTriageDocument,
    "\n  query GetEmailCountForTriage($input: GetEmailsInput!) {\n    getEmailCount(input: $input)\n  }\n": typeof types.GetEmailCountForTriageDocument,
    "\n  mutation BulkUpdateEmailsTriage($input: BulkUpdateEmailsInput!) {\n    bulkUpdateEmails(input: $input) {\n      id\n      isRead\n      isStarred\n      folder\n    }\n  }\n": typeof types.BulkUpdateEmailsTriageDocument,
    "\n  mutation BulkDeleteEmailsTriage($ids: [String!]!) {\n    bulkDeleteEmails(ids: $ids)\n  }\n": typeof types.BulkDeleteEmailsTriageDocument,
};
const documents: Documents = {
    "\n  query GetAttachmentDownloadUrl($id: String!) {\n    getAttachmentDownloadUrl(id: $id)\n  }\n": types.GetAttachmentDownloadUrlDocument,
    "\n  mutation UpdateThemePreference($themePreference: ThemePreference!) {\n    updateThemePreference(themePreference: $themePreference) {\n      id\n      themePreference\n    }\n  }\n": types.UpdateThemePreferenceDocument,
    "\n  query GetContactsForModal {\n    getContacts {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n      company\n    }\n  }\n": types.GetContactsForModalDocument,
    "\n  mutation CreateContactFromModal($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      name\n      emails {\n        id\n        email\n        isPrimary\n      }\n    }\n  }\n": types.CreateContactFromModalDocument,
    "\n  mutation UpdateContactFromModal($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      name\n      emails {\n        id\n        email\n        isPrimary\n      }\n    }\n  }\n": types.UpdateContactFromModalDocument,
    "\n  mutation AddEmailToContact($input: AddEmailToContactInput!) {\n    addEmailToContact(input: $input) {\n      id\n      email\n      name\n      emails {\n        id\n        email\n        isPrimary\n      }\n    }\n  }\n": types.AddEmailToContactDocument,
    "\n  query SearchContactsForChipInput($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n    }\n  }\n": types.SearchContactsForChipInputDocument,
    "\n  query SearchContactByEmail($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n": types.SearchContactByEmailDocument,
    "\n  subscription MailboxUpdates {\n    mailboxUpdates {\n      type\n      emailAccountId\n      message\n      emails {\n        id\n        messageId\n        folder\n        fromAddress\n        fromName\n        subject\n        textBody\n        receivedAt\n        isRead\n        isStarred\n        emailAccountId\n        toAddresses\n        ccAddresses\n        bccAddresses\n        threadId\n        threadCount\n        tags {\n          id\n          name\n          color\n        }\n      }\n    }\n  }\n": types.MailboxUpdatesDocument,
    "\n  query FetchProfile {\n    fetchProfile {\n      id\n      email\n      firstName\n      lastName\n      themePreference\n      navbarCollapsed\n      notificationDetailLevel\n      inboxDensity\n      inboxGroupByDate\n      blockExternalImages\n    }\n  }\n": types.FetchProfileDocument,
    "\n  mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {\n    updateUserPreferences(input: $input) {\n      id\n      themePreference\n      navbarCollapsed\n      notificationDetailLevel\n      inboxDensity\n      inboxGroupByDate\n      blockExternalImages\n    }\n  }\n": types.UpdateUserPreferencesDocument,
    "\n  query GetSmtpProfiles {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      isDefault\n    }\n  }\n": types.GetSmtpProfilesDocument,
    "\n  query GetEmailAccountsForCompose {\n    getEmailAccounts {\n      id\n      name\n      email\n      defaultSmtpProfileId\n      isDefault\n    }\n  }\n": types.GetEmailAccountsForComposeDocument,
    "\n  mutation SendEmail($input: ComposeEmailInput!) {\n    sendEmail(input: $input) {\n      id\n      messageId\n      subject\n    }\n  }\n": types.SendEmailDocument,
    "\n  mutation SaveDraft($input: SaveDraftInput!) {\n    saveDraft(input: $input) {\n      id\n      subject\n    }\n  }\n": types.SaveDraftDocument,
    "\n  query GetContacts {\n    getContacts {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n      isAutoCreated\n      createdAt\n    }\n  }\n": types.GetContactsDocument,
    "\n  query SearchContacts($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n    }\n  }\n": types.SearchContactsDocument,
    "\n  mutation CreateContact($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n    }\n  }\n": types.CreateContactDocument,
    "\n  mutation UpdateContact($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n": types.UpdateContactDocument,
    "\n  mutation DeleteContact($id: String!) {\n    deleteContact(id: $id)\n  }\n": types.DeleteContactDocument,
    "\n  query GetEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n      threadId\n      threadCount\n      hasAttachments\n      attachmentCount\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n": types.GetEmailsDocument,
    "\n  query GetEmailsByThread($threadId: String!) {\n    getEmailsByThread(threadId: $threadId) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      hasAttachments\n      attachmentCount\n      attachments {\n        id\n        filename\n        mimeType\n        extension\n        size\n        attachmentType\n        contentId\n        isSafe\n      }\n      inReplyTo\n      threadId\n    }\n  }\n": types.GetEmailsByThreadDocument,
    "\n  query GetEmail($input: GetEmailInput!) {\n    getEmail(input: $input) {\n      id\n      emailAccountId\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      inReplyTo\n      references\n      threadId\n      threadCount\n      headers\n      isUnsubscribed\n      unsubscribeUrl\n      unsubscribeEmail\n      hasAttachments\n      attachmentCount\n      attachments {\n        id\n        filename\n        mimeType\n        extension\n        size\n        attachmentType\n        contentId\n        isSafe\n      }\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n": types.GetEmailDocument,
    "\n  query GetEmailCount($input: GetEmailsInput!) {\n    getEmailCount(input: $input)\n  }\n": types.GetEmailCountDocument,
    "\n  query GetStarredEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      subject\n      textBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n    }\n  }\n": types.GetStarredEmailsDocument,
    "\n  query GetEmailAccountsForInbox {\n    getEmailAccounts {\n      id\n      name\n      email\n      host\n      lastSyncedAt\n      providerId\n    }\n  }\n": types.GetEmailAccountsForInboxDocument,
    "\n  mutation SyncAllAccounts {\n    syncAllAccounts\n  }\n": types.SyncAllAccountsDocument,
    "\n  mutation Unsubscribe($input: UnsubscribeInput!) {\n    unsubscribe(input: $input) {\n      id\n      isUnsubscribed\n    }\n  }\n": types.UnsubscribeDocument,
    "\n  mutation CreateContactFromEmail($emailId: String!) {\n    createContactFromEmail(emailId: $emailId) {\n      id\n      email\n      name\n    }\n  }\n": types.CreateContactFromEmailDocument,
    "\n  mutation BulkUpdateEmails($input: BulkUpdateEmailsInput!) {\n    bulkUpdateEmails(input: $input) {\n      id\n      isRead\n      isStarred\n      folder\n    }\n  }\n": types.BulkUpdateEmailsDocument,
    "\n  mutation BulkDeleteEmails($ids: [String!]!) {\n    bulkDeleteEmails(ids: $ids)\n  }\n": types.BulkDeleteEmailsDocument,
    "\n  mutation ForwardEmail($input: ForwardEmailInput!) {\n    forwardEmail(input: $input) {\n      id\n      messageId\n      subject\n    }\n  }\n": types.ForwardEmailDocument,
    "\n  mutation NukeOldEmails($input: NukeOldEmailsInput!) {\n    nukeOldEmails(input: $input)\n  }\n": types.NukeOldEmailsDocument,
    "\n  query GetTagsForInbox {\n    getTags {\n      id\n      name\n      color\n      emailCount\n    }\n  }\n": types.GetTagsForInboxDocument,
    "\n  mutation AddTagsToEmailsInbox($input: AddTagsToEmailsInput!) {\n    addTagsToEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n": types.AddTagsToEmailsInboxDocument,
    "\n  mutation RemoveTagsFromEmailsInbox($input: RemoveTagsFromEmailsInput!) {\n    removeTagsFromEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n": types.RemoveTagsFromEmailsInboxDocument,
    "\n  mutation GetPushTokens {\n    getPushTokens {\n      id\n      token\n      platform\n      deviceName\n      isActive\n      lastUsedAt\n      createdAt\n    }\n  }\n": types.GetPushTokensDocument,
    "\n  mutation RegisterPushToken($input: RegisterPushTokenInput!) {\n    registerPushToken(input: $input) {\n      success\n      message\n    }\n  }\n": types.RegisterPushTokenDocument,
    "\n  mutation UnregisterPushToken($token: String!) {\n    unregisterPushToken(token: $token)\n  }\n": types.UnregisterPushTokenDocument,
    "\n  query GetEmailAccounts {\n    getEmailAccounts {\n      id\n      name\n      email\n      host\n      port\n      accountType\n      useSsl\n      lastSyncedAt\n      isHistoricalSyncing\n      historicalSyncProgress\n      historicalSyncStatus\n      historicalSyncLastAt\n      isUpdateSyncing\n      updateSyncProgress\n      updateSyncStatus\n      lastSyncEmailReceivedAt\n      defaultSmtpProfileId\n      defaultSmtpProfile {\n        id\n        name\n        email\n      }\n      providerId\n      isDefault\n    }\n  }\n": types.GetEmailAccountsDocument,
    "\n  mutation CreateEmailAccount($input: CreateEmailAccountInput!) {\n    createEmailAccount(input: $input) {\n      id\n      name\n      email\n    }\n  }\n": types.CreateEmailAccountDocument,
    "\n  mutation DeleteEmailAccount($id: String!) {\n    deleteEmailAccount(id: $id)\n  }\n": types.DeleteEmailAccountDocument,
    "\n  mutation SyncEmailAccount($input: SyncEmailAccountInput!) {\n    syncEmailAccount(input: $input)\n  }\n": types.SyncEmailAccountDocument,
    "\n  mutation SyncAllAccountsSettings {\n    syncAllAccounts\n  }\n": types.SyncAllAccountsSettingsDocument,
    "\n  mutation UpdateEmailAccount($input: UpdateEmailAccountInput!) {\n    updateEmailAccount(input: $input) {\n      id\n      name\n      email\n      host\n      port\n      useSsl\n      defaultSmtpProfileId\n      isDefault\n    }\n  }\n": types.UpdateEmailAccountDocument,
    "\n  mutation TestEmailAccountConnection($input: TestEmailAccountConnectionInput!) {\n    testEmailAccountConnection(input: $input) {\n      success\n      message\n    }\n  }\n": types.TestEmailAccountConnectionDocument,
    "\n  query GetSmtpProfilesFull {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n      providerId\n    }\n  }\n": types.GetSmtpProfilesFullDocument,
    "\n  mutation CreateSmtpProfile($input: CreateSmtpProfileInput!) {\n    createSmtpProfile(input: $input) {\n      id\n      name\n      email\n    }\n  }\n": types.CreateSmtpProfileDocument,
    "\n  mutation DeleteSmtpProfile($id: String!) {\n    deleteSmtpProfile(id: $id)\n  }\n": types.DeleteSmtpProfileDocument,
    "\n  mutation UpdateSmtpProfile($input: UpdateSmtpProfileInput!) {\n    updateSmtpProfile(input: $input) {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n    }\n  }\n": types.UpdateSmtpProfileDocument,
    "\n  mutation TestSmtpConnection($input: TestSmtpConnectionInput!) {\n    testSmtpConnection(input: $input) {\n      success\n      message\n    }\n  }\n": types.TestSmtpConnectionDocument,
    "\n  query GetAuthenticationMethods {\n    getAuthenticationMethods {\n      id\n      provider\n      email\n      displayName\n      lastUsedAt\n      createdAt\n    }\n  }\n": types.GetAuthenticationMethodsDocument,
    "\n  mutation DeleteAuthenticationMethod($id: String!) {\n    deleteAuthenticationMethod(id: $id)\n  }\n": types.DeleteAuthenticationMethodDocument,
    "\n  query GetTags {\n    getTags {\n      id\n      name\n      color\n      description\n      emailCount\n    }\n  }\n": types.GetTagsDocument,
    "\n  mutation CreateTag($input: CreateTagInput!) {\n    createTag(input: $input) {\n      id\n      name\n      color\n      description\n      emailCount\n    }\n  }\n": types.CreateTagDocument,
    "\n  mutation UpdateTag($input: UpdateTagInput!) {\n    updateTag(input: $input) {\n      id\n      name\n      color\n      description\n      emailCount\n    }\n  }\n": types.UpdateTagDocument,
    "\n  mutation DeleteTag($id: String!) {\n    deleteTag(id: $id)\n  }\n": types.DeleteTagDocument,
    "\n  mutation AddTagsToEmails($input: AddTagsToEmailsInput!) {\n    addTagsToEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n": types.AddTagsToEmailsDocument,
    "\n  mutation RemoveTagsFromEmails($input: RemoveTagsFromEmailsInput!) {\n    removeTagsFromEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n": types.RemoveTagsFromEmailsDocument,
    "\n  query GetMailRules {\n    getMailRules {\n      id\n      name\n      description\n      emailAccountId\n      emailAccount {\n        id\n        name\n        email\n      }\n      conditions {\n        fromContains\n        toContains\n        ccContains\n        bccContains\n        subjectContains\n        bodyContains\n      }\n      actions {\n        archive\n        star\n        delete\n        markRead\n        addTagIds\n        forwardTo\n      }\n      isEnabled\n      priority\n      stopProcessing\n    }\n  }\n": types.GetMailRulesDocument,
    "\n  mutation CreateMailRule($input: CreateMailRuleInput!) {\n    createMailRule(input: $input) {\n      id\n      name\n      description\n      isEnabled\n      priority\n    }\n  }\n": types.CreateMailRuleDocument,
    "\n  mutation UpdateMailRule($input: UpdateMailRuleInput!) {\n    updateMailRule(input: $input) {\n      id\n      name\n      description\n      isEnabled\n      priority\n    }\n  }\n": types.UpdateMailRuleDocument,
    "\n  mutation DeleteMailRule($id: String!) {\n    deleteMailRule(id: $id)\n  }\n": types.DeleteMailRuleDocument,
    "\n  query PreviewMailRule($id: String!) {\n    previewMailRule(id: $id)\n  }\n": types.PreviewMailRuleDocument,
    "\n  mutation RunMailRule($id: String!) {\n    runMailRule(id: $id) {\n      matchedCount\n      processedCount\n    }\n  }\n": types.RunMailRuleDocument,
    "\n  query GetBillingInfo($sessionId: String) {\n    getBillingInfo(sessionId: $sessionId) {\n      subscription {\n        id\n        status\n        storageTier\n        accountTier\n        storageLimitBytes\n        accountLimit\n        isValid\n        currentPeriodEnd\n        cancelAtPeriodEnd\n      }\n      hasStripeCustomer\n      usage {\n        userId\n        accountCount\n        totalBodySizeBytes\n        totalAttachmentSizeBytes\n        totalStorageBytes\n        totalStorageGB\n        emailCount\n        attachmentCount\n        lastRefreshedAt\n      }\n      storageUsagePercent\n      accountUsagePercent\n      isStorageLimitExceeded\n      isAccountLimitExceeded\n      isStripeConfigured\n      prices {\n        id\n        tier\n        type\n        name\n        unitAmount\n        currency\n        interval\n      }\n    }\n  }\n": types.GetBillingInfoDocument,
    "\n  mutation CreateBillingPortalSession {\n    createBillingPortalSession\n  }\n": types.CreateBillingPortalSessionDocument,
    "\n  mutation RefreshStorageUsage {\n    refreshStorageUsage\n  }\n": types.RefreshStorageUsageDocument,
    "\n  mutation CreateCheckoutSession($storageTier: StorageTier!, $accountTier: AccountTier!) {\n    createCheckoutSession(storageTier: $storageTier, accountTier: $accountTier)\n  }\n": types.CreateCheckoutSessionDocument,
    "\n  query GetTopEmailSources($limit: Int) {\n    getTopEmailSources(limit: $limit) {\n      fromAddress\n      fromName\n      count\n    }\n  }\n": types.GetTopEmailSourcesDocument,
    "\n  query GetEmailsForTriage($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      subject\n      textBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n": types.GetEmailsForTriageDocument,
    "\n  query GetEmailCountForTriage($input: GetEmailsInput!) {\n    getEmailCount(input: $input)\n  }\n": types.GetEmailCountForTriageDocument,
    "\n  mutation BulkUpdateEmailsTriage($input: BulkUpdateEmailsInput!) {\n    bulkUpdateEmails(input: $input) {\n      id\n      isRead\n      isStarred\n      folder\n    }\n  }\n": types.BulkUpdateEmailsTriageDocument,
    "\n  mutation BulkDeleteEmailsTriage($ids: [String!]!) {\n    bulkDeleteEmails(ids: $ids)\n  }\n": types.BulkDeleteEmailsTriageDocument,
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
export function gql(source: "\n  query GetAttachmentDownloadUrl($id: String!) {\n    getAttachmentDownloadUrl(id: $id)\n  }\n"): (typeof documents)["\n  query GetAttachmentDownloadUrl($id: String!) {\n    getAttachmentDownloadUrl(id: $id)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateThemePreference($themePreference: ThemePreference!) {\n    updateThemePreference(themePreference: $themePreference) {\n      id\n      themePreference\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateThemePreference($themePreference: ThemePreference!) {\n    updateThemePreference(themePreference: $themePreference) {\n      id\n      themePreference\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetContactsForModal {\n    getContacts {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n      company\n    }\n  }\n"): (typeof documents)["\n  query GetContactsForModal {\n    getContacts {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n      company\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateContactFromModal($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      name\n      emails {\n        id\n        email\n        isPrimary\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateContactFromModal($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      name\n      emails {\n        id\n        email\n        isPrimary\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateContactFromModal($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      name\n      emails {\n        id\n        email\n        isPrimary\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateContactFromModal($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      name\n      emails {\n        id\n        email\n        isPrimary\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation AddEmailToContact($input: AddEmailToContactInput!) {\n    addEmailToContact(input: $input) {\n      id\n      email\n      name\n      emails {\n        id\n        email\n        isPrimary\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddEmailToContact($input: AddEmailToContactInput!) {\n    addEmailToContact(input: $input) {\n      id\n      email\n      name\n      emails {\n        id\n        email\n        isPrimary\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query SearchContactsForChipInput($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n    }\n  }\n"): (typeof documents)["\n  query SearchContactsForChipInput($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query SearchContactByEmail($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n"): (typeof documents)["\n  query SearchContactByEmail($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  subscription MailboxUpdates {\n    mailboxUpdates {\n      type\n      emailAccountId\n      message\n      emails {\n        id\n        messageId\n        folder\n        fromAddress\n        fromName\n        subject\n        textBody\n        receivedAt\n        isRead\n        isStarred\n        emailAccountId\n        toAddresses\n        ccAddresses\n        bccAddresses\n        threadId\n        threadCount\n        tags {\n          id\n          name\n          color\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription MailboxUpdates {\n    mailboxUpdates {\n      type\n      emailAccountId\n      message\n      emails {\n        id\n        messageId\n        folder\n        fromAddress\n        fromName\n        subject\n        textBody\n        receivedAt\n        isRead\n        isStarred\n        emailAccountId\n        toAddresses\n        ccAddresses\n        bccAddresses\n        threadId\n        threadCount\n        tags {\n          id\n          name\n          color\n        }\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query FetchProfile {\n    fetchProfile {\n      id\n      email\n      firstName\n      lastName\n      themePreference\n      navbarCollapsed\n      notificationDetailLevel\n      inboxDensity\n      inboxGroupByDate\n      blockExternalImages\n    }\n  }\n"): (typeof documents)["\n  query FetchProfile {\n    fetchProfile {\n      id\n      email\n      firstName\n      lastName\n      themePreference\n      navbarCollapsed\n      notificationDetailLevel\n      inboxDensity\n      inboxGroupByDate\n      blockExternalImages\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {\n    updateUserPreferences(input: $input) {\n      id\n      themePreference\n      navbarCollapsed\n      notificationDetailLevel\n      inboxDensity\n      inboxGroupByDate\n      blockExternalImages\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {\n    updateUserPreferences(input: $input) {\n      id\n      themePreference\n      navbarCollapsed\n      notificationDetailLevel\n      inboxDensity\n      inboxGroupByDate\n      blockExternalImages\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetSmtpProfiles {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      isDefault\n    }\n  }\n"): (typeof documents)["\n  query GetSmtpProfiles {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      isDefault\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmailAccountsForCompose {\n    getEmailAccounts {\n      id\n      name\n      email\n      defaultSmtpProfileId\n      isDefault\n    }\n  }\n"): (typeof documents)["\n  query GetEmailAccountsForCompose {\n    getEmailAccounts {\n      id\n      name\n      email\n      defaultSmtpProfileId\n      isDefault\n    }\n  }\n"];
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
export function gql(source: "\n  query GetContacts {\n    getContacts {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n      isAutoCreated\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query GetContacts {\n    getContacts {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n      isAutoCreated\n      createdAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query SearchContacts($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n    }\n  }\n"): (typeof documents)["\n  query SearchContacts($query: String!) {\n    searchContacts(query: $query) {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateContact($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation CreateContact($input: CreateContactInput!) {\n    createContact(input: $input) {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateContact($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateContact($input: UpdateContactInput!) {\n    updateContact(input: $input) {\n      id\n      email\n      emails {\n        id\n        email\n        isPrimary\n        label\n      }\n      name\n      firstName\n      lastName\n      company\n      phone\n      notes\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteContact($id: String!) {\n    deleteContact(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteContact($id: String!) {\n    deleteContact(id: $id)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n      threadId\n      threadCount\n      hasAttachments\n      attachmentCount\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetEmails($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      inReplyTo\n      threadId\n      threadCount\n      hasAttachments\n      attachmentCount\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmailsByThread($threadId: String!) {\n    getEmailsByThread(threadId: $threadId) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      hasAttachments\n      attachmentCount\n      attachments {\n        id\n        filename\n        mimeType\n        extension\n        size\n        attachmentType\n        contentId\n        isSafe\n      }\n      inReplyTo\n      threadId\n    }\n  }\n"): (typeof documents)["\n  query GetEmailsByThread($threadId: String!) {\n    getEmailsByThread(threadId: $threadId) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      bccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      hasAttachments\n      attachmentCount\n      attachments {\n        id\n        filename\n        mimeType\n        extension\n        size\n        attachmentType\n        contentId\n        isSafe\n      }\n      inReplyTo\n      threadId\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmail($input: GetEmailInput!) {\n    getEmail(input: $input) {\n      id\n      emailAccountId\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      inReplyTo\n      references\n      threadId\n      threadCount\n      headers\n      isUnsubscribed\n      unsubscribeUrl\n      unsubscribeEmail\n      hasAttachments\n      attachmentCount\n      attachments {\n        id\n        filename\n        mimeType\n        extension\n        size\n        attachmentType\n        contentId\n        isSafe\n      }\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetEmail($input: GetEmailInput!) {\n    getEmail(input: $input) {\n      id\n      emailAccountId\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      ccAddresses\n      subject\n      textBody\n      htmlBody\n      receivedAt\n      isRead\n      isStarred\n      inReplyTo\n      references\n      threadId\n      threadCount\n      headers\n      isUnsubscribed\n      unsubscribeUrl\n      unsubscribeEmail\n      hasAttachments\n      attachmentCount\n      attachments {\n        id\n        filename\n        mimeType\n        extension\n        size\n        attachmentType\n        contentId\n        isSafe\n      }\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n"];
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
export function gql(source: "\n  query GetEmailAccountsForInbox {\n    getEmailAccounts {\n      id\n      name\n      email\n      host\n      lastSyncedAt\n      providerId\n    }\n  }\n"): (typeof documents)["\n  query GetEmailAccountsForInbox {\n    getEmailAccounts {\n      id\n      name\n      email\n      host\n      lastSyncedAt\n      providerId\n    }\n  }\n"];
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
export function gql(source: "\n  mutation NukeOldEmails($input: NukeOldEmailsInput!) {\n    nukeOldEmails(input: $input)\n  }\n"): (typeof documents)["\n  mutation NukeOldEmails($input: NukeOldEmailsInput!) {\n    nukeOldEmails(input: $input)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetTagsForInbox {\n    getTags {\n      id\n      name\n      color\n      emailCount\n    }\n  }\n"): (typeof documents)["\n  query GetTagsForInbox {\n    getTags {\n      id\n      name\n      color\n      emailCount\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation AddTagsToEmailsInbox($input: AddTagsToEmailsInput!) {\n    addTagsToEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddTagsToEmailsInbox($input: AddTagsToEmailsInput!) {\n    addTagsToEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation RemoveTagsFromEmailsInbox($input: RemoveTagsFromEmailsInput!) {\n    removeTagsFromEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation RemoveTagsFromEmailsInbox($input: RemoveTagsFromEmailsInput!) {\n    removeTagsFromEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation GetPushTokens {\n    getPushTokens {\n      id\n      token\n      platform\n      deviceName\n      isActive\n      lastUsedAt\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  mutation GetPushTokens {\n    getPushTokens {\n      id\n      token\n      platform\n      deviceName\n      isActive\n      lastUsedAt\n      createdAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation RegisterPushToken($input: RegisterPushTokenInput!) {\n    registerPushToken(input: $input) {\n      success\n      message\n    }\n  }\n"): (typeof documents)["\n  mutation RegisterPushToken($input: RegisterPushTokenInput!) {\n    registerPushToken(input: $input) {\n      success\n      message\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UnregisterPushToken($token: String!) {\n    unregisterPushToken(token: $token)\n  }\n"): (typeof documents)["\n  mutation UnregisterPushToken($token: String!) {\n    unregisterPushToken(token: $token)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmailAccounts {\n    getEmailAccounts {\n      id\n      name\n      email\n      host\n      port\n      accountType\n      useSsl\n      lastSyncedAt\n      isHistoricalSyncing\n      historicalSyncProgress\n      historicalSyncStatus\n      historicalSyncLastAt\n      isUpdateSyncing\n      updateSyncProgress\n      updateSyncStatus\n      lastSyncEmailReceivedAt\n      defaultSmtpProfileId\n      defaultSmtpProfile {\n        id\n        name\n        email\n      }\n      providerId\n      isDefault\n    }\n  }\n"): (typeof documents)["\n  query GetEmailAccounts {\n    getEmailAccounts {\n      id\n      name\n      email\n      host\n      port\n      accountType\n      useSsl\n      lastSyncedAt\n      isHistoricalSyncing\n      historicalSyncProgress\n      historicalSyncStatus\n      historicalSyncLastAt\n      isUpdateSyncing\n      updateSyncProgress\n      updateSyncStatus\n      lastSyncEmailReceivedAt\n      defaultSmtpProfileId\n      defaultSmtpProfile {\n        id\n        name\n        email\n      }\n      providerId\n      isDefault\n    }\n  }\n"];
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
export function gql(source: "\n  mutation UpdateEmailAccount($input: UpdateEmailAccountInput!) {\n    updateEmailAccount(input: $input) {\n      id\n      name\n      email\n      host\n      port\n      useSsl\n      defaultSmtpProfileId\n      isDefault\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateEmailAccount($input: UpdateEmailAccountInput!) {\n    updateEmailAccount(input: $input) {\n      id\n      name\n      email\n      host\n      port\n      useSsl\n      defaultSmtpProfileId\n      isDefault\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation TestEmailAccountConnection($input: TestEmailAccountConnectionInput!) {\n    testEmailAccountConnection(input: $input) {\n      success\n      message\n    }\n  }\n"): (typeof documents)["\n  mutation TestEmailAccountConnection($input: TestEmailAccountConnectionInput!) {\n    testEmailAccountConnection(input: $input) {\n      success\n      message\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetSmtpProfilesFull {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n      providerId\n    }\n  }\n"): (typeof documents)["\n  query GetSmtpProfilesFull {\n    getSmtpProfiles {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n      providerId\n    }\n  }\n"];
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
export function gql(source: "\n  mutation UpdateSmtpProfile($input: UpdateSmtpProfileInput!) {\n    updateSmtpProfile(input: $input) {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateSmtpProfile($input: UpdateSmtpProfileInput!) {\n    updateSmtpProfile(input: $input) {\n      id\n      name\n      email\n      alias\n      host\n      port\n      useSsl\n      isDefault\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation TestSmtpConnection($input: TestSmtpConnectionInput!) {\n    testSmtpConnection(input: $input) {\n      success\n      message\n    }\n  }\n"): (typeof documents)["\n  mutation TestSmtpConnection($input: TestSmtpConnectionInput!) {\n    testSmtpConnection(input: $input) {\n      success\n      message\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetAuthenticationMethods {\n    getAuthenticationMethods {\n      id\n      provider\n      email\n      displayName\n      lastUsedAt\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query GetAuthenticationMethods {\n    getAuthenticationMethods {\n      id\n      provider\n      email\n      displayName\n      lastUsedAt\n      createdAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteAuthenticationMethod($id: String!) {\n    deleteAuthenticationMethod(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteAuthenticationMethod($id: String!) {\n    deleteAuthenticationMethod(id: $id)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetTags {\n    getTags {\n      id\n      name\n      color\n      description\n      emailCount\n    }\n  }\n"): (typeof documents)["\n  query GetTags {\n    getTags {\n      id\n      name\n      color\n      description\n      emailCount\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateTag($input: CreateTagInput!) {\n    createTag(input: $input) {\n      id\n      name\n      color\n      description\n      emailCount\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTag($input: CreateTagInput!) {\n    createTag(input: $input) {\n      id\n      name\n      color\n      description\n      emailCount\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateTag($input: UpdateTagInput!) {\n    updateTag(input: $input) {\n      id\n      name\n      color\n      description\n      emailCount\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTag($input: UpdateTagInput!) {\n    updateTag(input: $input) {\n      id\n      name\n      color\n      description\n      emailCount\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteTag($id: String!) {\n    deleteTag(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteTag($id: String!) {\n    deleteTag(id: $id)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation AddTagsToEmails($input: AddTagsToEmailsInput!) {\n    addTagsToEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddTagsToEmails($input: AddTagsToEmailsInput!) {\n    addTagsToEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation RemoveTagsFromEmails($input: RemoveTagsFromEmailsInput!) {\n    removeTagsFromEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation RemoveTagsFromEmails($input: RemoveTagsFromEmailsInput!) {\n    removeTagsFromEmails(input: $input) {\n      id\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetMailRules {\n    getMailRules {\n      id\n      name\n      description\n      emailAccountId\n      emailAccount {\n        id\n        name\n        email\n      }\n      conditions {\n        fromContains\n        toContains\n        ccContains\n        bccContains\n        subjectContains\n        bodyContains\n      }\n      actions {\n        archive\n        star\n        delete\n        markRead\n        addTagIds\n        forwardTo\n      }\n      isEnabled\n      priority\n      stopProcessing\n    }\n  }\n"): (typeof documents)["\n  query GetMailRules {\n    getMailRules {\n      id\n      name\n      description\n      emailAccountId\n      emailAccount {\n        id\n        name\n        email\n      }\n      conditions {\n        fromContains\n        toContains\n        ccContains\n        bccContains\n        subjectContains\n        bodyContains\n      }\n      actions {\n        archive\n        star\n        delete\n        markRead\n        addTagIds\n        forwardTo\n      }\n      isEnabled\n      priority\n      stopProcessing\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateMailRule($input: CreateMailRuleInput!) {\n    createMailRule(input: $input) {\n      id\n      name\n      description\n      isEnabled\n      priority\n    }\n  }\n"): (typeof documents)["\n  mutation CreateMailRule($input: CreateMailRuleInput!) {\n    createMailRule(input: $input) {\n      id\n      name\n      description\n      isEnabled\n      priority\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateMailRule($input: UpdateMailRuleInput!) {\n    updateMailRule(input: $input) {\n      id\n      name\n      description\n      isEnabled\n      priority\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateMailRule($input: UpdateMailRuleInput!) {\n    updateMailRule(input: $input) {\n      id\n      name\n      description\n      isEnabled\n      priority\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteMailRule($id: String!) {\n    deleteMailRule(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteMailRule($id: String!) {\n    deleteMailRule(id: $id)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query PreviewMailRule($id: String!) {\n    previewMailRule(id: $id)\n  }\n"): (typeof documents)["\n  query PreviewMailRule($id: String!) {\n    previewMailRule(id: $id)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation RunMailRule($id: String!) {\n    runMailRule(id: $id) {\n      matchedCount\n      processedCount\n    }\n  }\n"): (typeof documents)["\n  mutation RunMailRule($id: String!) {\n    runMailRule(id: $id) {\n      matchedCount\n      processedCount\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetBillingInfo($sessionId: String) {\n    getBillingInfo(sessionId: $sessionId) {\n      subscription {\n        id\n        status\n        storageTier\n        accountTier\n        storageLimitBytes\n        accountLimit\n        isValid\n        currentPeriodEnd\n        cancelAtPeriodEnd\n      }\n      hasStripeCustomer\n      usage {\n        userId\n        accountCount\n        totalBodySizeBytes\n        totalAttachmentSizeBytes\n        totalStorageBytes\n        totalStorageGB\n        emailCount\n        attachmentCount\n        lastRefreshedAt\n      }\n      storageUsagePercent\n      accountUsagePercent\n      isStorageLimitExceeded\n      isAccountLimitExceeded\n      isStripeConfigured\n      prices {\n        id\n        tier\n        type\n        name\n        unitAmount\n        currency\n        interval\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetBillingInfo($sessionId: String) {\n    getBillingInfo(sessionId: $sessionId) {\n      subscription {\n        id\n        status\n        storageTier\n        accountTier\n        storageLimitBytes\n        accountLimit\n        isValid\n        currentPeriodEnd\n        cancelAtPeriodEnd\n      }\n      hasStripeCustomer\n      usage {\n        userId\n        accountCount\n        totalBodySizeBytes\n        totalAttachmentSizeBytes\n        totalStorageBytes\n        totalStorageGB\n        emailCount\n        attachmentCount\n        lastRefreshedAt\n      }\n      storageUsagePercent\n      accountUsagePercent\n      isStorageLimitExceeded\n      isAccountLimitExceeded\n      isStripeConfigured\n      prices {\n        id\n        tier\n        type\n        name\n        unitAmount\n        currency\n        interval\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateBillingPortalSession {\n    createBillingPortalSession\n  }\n"): (typeof documents)["\n  mutation CreateBillingPortalSession {\n    createBillingPortalSession\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation RefreshStorageUsage {\n    refreshStorageUsage\n  }\n"): (typeof documents)["\n  mutation RefreshStorageUsage {\n    refreshStorageUsage\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateCheckoutSession($storageTier: StorageTier!, $accountTier: AccountTier!) {\n    createCheckoutSession(storageTier: $storageTier, accountTier: $accountTier)\n  }\n"): (typeof documents)["\n  mutation CreateCheckoutSession($storageTier: StorageTier!, $accountTier: AccountTier!) {\n    createCheckoutSession(storageTier: $storageTier, accountTier: $accountTier)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetTopEmailSources($limit: Int) {\n    getTopEmailSources(limit: $limit) {\n      fromAddress\n      fromName\n      count\n    }\n  }\n"): (typeof documents)["\n  query GetTopEmailSources($limit: Int) {\n    getTopEmailSources(limit: $limit) {\n      fromAddress\n      fromName\n      count\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmailsForTriage($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      subject\n      textBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetEmailsForTriage($input: GetEmailsInput!) {\n    getEmails(input: $input) {\n      id\n      messageId\n      folder\n      fromAddress\n      fromName\n      toAddresses\n      subject\n      textBody\n      receivedAt\n      isRead\n      isStarred\n      emailAccountId\n      tags {\n        id\n        name\n        color\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetEmailCountForTriage($input: GetEmailsInput!) {\n    getEmailCount(input: $input)\n  }\n"): (typeof documents)["\n  query GetEmailCountForTriage($input: GetEmailsInput!) {\n    getEmailCount(input: $input)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation BulkUpdateEmailsTriage($input: BulkUpdateEmailsInput!) {\n    bulkUpdateEmails(input: $input) {\n      id\n      isRead\n      isStarred\n      folder\n    }\n  }\n"): (typeof documents)["\n  mutation BulkUpdateEmailsTriage($input: BulkUpdateEmailsInput!) {\n    bulkUpdateEmails(input: $input) {\n      id\n      isRead\n      isStarred\n      folder\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation BulkDeleteEmailsTriage($ids: [String!]!) {\n    bulkDeleteEmails(ids: $ids)\n  }\n"): (typeof documents)["\n  mutation BulkDeleteEmailsTriage($ids: [String!]!) {\n    bulkDeleteEmails(ids: $ids)\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;