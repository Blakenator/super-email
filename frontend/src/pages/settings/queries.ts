import { gql } from '../../__generated__/gql';

// ============ Email Accounts ============

export const GET_EMAIL_ACCOUNTS_QUERY = gql(`
  query GetEmailAccounts {
    getEmailAccounts {
      id
      name
      email
      host
      port
      accountType
      useSsl
      lastSyncedAt
      isHistoricalSyncing
      historicalSyncProgress
      historicalSyncStatus
      historicalSyncLastAt
      isUpdateSyncing
      updateSyncProgress
      updateSyncStatus
      lastSyncEmailReceivedAt
      defaultSmtpProfileId
      defaultSmtpProfile {
        id
        name
        email
      }
      providerId
      isDefault
    }
  }
`);

export const CREATE_EMAIL_ACCOUNT_MUTATION = gql(`
  mutation CreateEmailAccount($input: CreateEmailAccountInput!) {
    createEmailAccount(input: $input) {
      id
      name
      email
    }
  }
`);

export const DELETE_EMAIL_ACCOUNT_MUTATION = gql(`
  mutation DeleteEmailAccount($id: String!) {
    deleteEmailAccount(id: $id)
  }
`);

export const SYNC_EMAIL_ACCOUNT_MUTATION = gql(`
  mutation SyncEmailAccount($input: SyncEmailAccountInput!) {
    syncEmailAccount(input: $input)
  }
`);

export const SYNC_ALL_ACCOUNTS_MUTATION = gql(`
  mutation SyncAllAccountsSettings {
    syncAllAccounts
  }
`);

export const UPDATE_EMAIL_ACCOUNT_MUTATION = gql(`
  mutation UpdateEmailAccount($input: UpdateEmailAccountInput!) {
    updateEmailAccount(input: $input) {
      id
      name
      email
      host
      port
      useSsl
      defaultSmtpProfileId
      isDefault
    }
  }
`);

export const TEST_EMAIL_ACCOUNT_CONNECTION_MUTATION = gql(`
  mutation TestEmailAccountConnection($input: TestEmailAccountConnectionInput!) {
    testEmailAccountConnection(input: $input) {
      success
      message
    }
  }
`);

// ============ SMTP Profiles ============

export const GET_SMTP_PROFILES_FULL_QUERY = gql(`
  query GetSmtpProfilesFull {
    getSmtpProfiles {
      id
      name
      email
      alias
      host
      port
      useSsl
      isDefault
      providerId
    }
  }
`);

export const CREATE_SMTP_PROFILE_MUTATION = gql(`
  mutation CreateSmtpProfile($input: CreateSmtpProfileInput!) {
    createSmtpProfile(input: $input) {
      id
      name
      email
    }
  }
`);

export const DELETE_SMTP_PROFILE_MUTATION = gql(`
  mutation DeleteSmtpProfile($id: String!) {
    deleteSmtpProfile(id: $id)
  }
`);

export const UPDATE_SMTP_PROFILE_MUTATION = gql(`
  mutation UpdateSmtpProfile($input: UpdateSmtpProfileInput!) {
    updateSmtpProfile(input: $input) {
      id
      name
      email
      alias
      host
      port
      useSsl
      isDefault
    }
  }
`);

export const TEST_SMTP_CONNECTION_MUTATION = gql(`
  mutation TestSmtpConnection($input: TestSmtpConnectionInput!) {
    testSmtpConnection(input: $input) {
      success
      message
    }
  }
`);

// ============ Authentication Methods ============

export const GET_AUTHENTICATION_METHODS_QUERY = gql(`
  query GetAuthenticationMethods {
    getAuthenticationMethods {
      id
      provider
      email
      displayName
      lastUsedAt
      createdAt
    }
  }
`);

export const DELETE_AUTHENTICATION_METHOD_MUTATION = gql(`
  mutation DeleteAuthenticationMethod($id: String!) {
    deleteAuthenticationMethod(id: $id)
  }
`);

// ============ Inbox Zero ============

export const NUKE_OLD_EMAILS_MUTATION = gql(`
  mutation NukeOldEmails($input: NukeOldEmailsInput!) {
    nukeOldEmails(input: $input)
  }
`);

// ============ Tags ============

export const GET_TAGS_QUERY = gql(`
  query GetTags {
    getTags {
      id
      name
      color
      description
      emailCount
    }
  }
`);

export const CREATE_TAG_MUTATION = gql(`
  mutation CreateTag($input: CreateTagInput!) {
    createTag(input: $input) {
      id
      name
      color
      description
      emailCount
    }
  }
`);

export const UPDATE_TAG_MUTATION = gql(`
  mutation UpdateTag($input: UpdateTagInput!) {
    updateTag(input: $input) {
      id
      name
      color
      description
      emailCount
    }
  }
`);

export const DELETE_TAG_MUTATION = gql(`
  mutation DeleteTag($id: String!) {
    deleteTag(id: $id)
  }
`);

export const ADD_TAGS_TO_EMAILS_MUTATION = gql(`
  mutation AddTagsToEmails($input: AddTagsToEmailsInput!) {
    addTagsToEmails(input: $input) {
      id
      tags {
        id
        name
        color
      }
    }
  }
`);

export const REMOVE_TAGS_FROM_EMAILS_MUTATION = gql(`
  mutation RemoveTagsFromEmails($input: RemoveTagsFromEmailsInput!) {
    removeTagsFromEmails(input: $input) {
      id
      tags {
        id
        name
        color
      }
    }
  }
`);

// ============ Mail Rules ============

export const GET_MAIL_RULES_QUERY = gql(`
  query GetMailRules {
    getMailRules {
      id
      name
      description
      emailAccountId
      emailAccount {
        id
        name
        email
      }
      conditions {
        fromContains
        toContains
        ccContains
        bccContains
        subjectContains
        bodyContains
      }
      actions {
        archive
        star
        delete
        markRead
        addTagIds
        forwardTo
      }
      isEnabled
      priority
      stopProcessing
    }
  }
`);

export const CREATE_MAIL_RULE_MUTATION = gql(`
  mutation CreateMailRule($input: CreateMailRuleInput!) {
    createMailRule(input: $input) {
      id
      name
      description
      isEnabled
      priority
    }
  }
`);

export const UPDATE_MAIL_RULE_MUTATION = gql(`
  mutation UpdateMailRule($input: UpdateMailRuleInput!) {
    updateMailRule(input: $input) {
      id
      name
      description
      isEnabled
      priority
    }
  }
`);

export const DELETE_MAIL_RULE_MUTATION = gql(`
  mutation DeleteMailRule($id: String!) {
    deleteMailRule(id: $id)
  }
`);

export const PREVIEW_MAIL_RULE_QUERY = gql(`
  query PreviewMailRule($id: String!) {
    previewMailRule(id: $id)
  }
`);

export const RUN_MAIL_RULE_MUTATION = gql(`
  mutation RunMailRule($id: String!) {
    runMailRule(id: $id) {
      matchedCount
      processedCount
    }
  }
`);

// ============ Billing ============

export const GET_BILLING_INFO_QUERY = gql(`
  query GetBillingInfo {
    getBillingInfo {
      subscription {
        id
        status
        storageTier
        accountTier
        storageLimitBytes
        accountLimit
        isValid
        currentPeriodEnd
        cancelAtPeriodEnd
      }
      hasStripeCustomer
      usage {
        userId
        accountCount
        totalBodySizeBytes
        totalAttachmentSizeBytes
        totalStorageBytes
        totalStorageGB
        emailCount
        attachmentCount
        lastRefreshedAt
      }
      storageUsagePercent
      accountUsagePercent
      isStorageLimitExceeded
      isAccountLimitExceeded
      isStripeConfigured
      prices {
        id
        tier
        type
        name
        unitAmount
        currency
        interval
      }
    }
  }
`);

export const CREATE_BILLING_PORTAL_SESSION_MUTATION = gql(`
  mutation CreateBillingPortalSession {
    createBillingPortalSession
  }
`);

export const REFRESH_STORAGE_USAGE_MUTATION = gql(`
  mutation RefreshStorageUsage {
    refreshStorageUsage
  }
`);

export const CREATE_CHECKOUT_SESSION_MUTATION = gql(`
  mutation CreateCheckoutSession($storageTier: StorageTier!, $accountTier: AccountTier!) {
    createCheckoutSession(storageTier: $storageTier, accountTier: $accountTier)
  }
`);
