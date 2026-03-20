import { gql } from '../../__generated__/gql';

// ============ Health ============

export const HEALTH_CHECK_QUERY = gql(`
  query HealthCheck {
    healthCheck {
      status
      version
      timestamp
      uptimeSeconds
    }
  }
`);

// ============ Email Accounts ============

export const GET_EMAIL_ACCOUNTS_QUERY = gql(`
  query GetEmailAccounts {
    getEmailAccounts {
      id
      name
      email
      type
      defaultSendProfileId
      defaultSendProfile {
        id
        name
        email
      }
      providerId
      isDefault
      authMethod
      needsReauth
      imapSettings {
        id
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
      }
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
      type
      defaultSendProfileId
      isDefault
      imapSettings {
        id
        host
        port
        useSsl
      }
    }
  }
`);

export const TEST_IMAP_CONNECTION_MUTATION = gql(`
  mutation TestImapConnection($input: TestImapConnectionInput!) {
    testImapConnection(input: $input) {
      success
      message
    }
  }
`);

// ============ Send Profiles ============

export const GET_SEND_PROFILES_FULL_QUERY = gql(`
  query GetSendProfilesFull {
    getSendProfiles {
      id
      name
      email
      alias
      type
      isDefault
      providerId
      authMethod
      emailAccountId
      emailAccount {
        id
        name
        email
      }
      smtpSettings {
        id
        host
        port
        useSsl
      }
    }
  }
`);

export const CREATE_SEND_PROFILE_MUTATION = gql(`
  mutation CreateSendProfile($input: CreateSendProfileInput!) {
    createSendProfile(input: $input) {
      id
      name
      email
      type
    }
  }
`);

export const DELETE_SEND_PROFILE_MUTATION = gql(`
  mutation DeleteSendProfile($id: String!) {
    deleteSendProfile(id: $id)
  }
`);

export const UPDATE_SEND_PROFILE_MUTATION = gql(`
  mutation UpdateSendProfile($input: UpdateSendProfileInput!) {
    updateSendProfile(input: $input) {
      id
      name
      email
      alias
      type
      isDefault
      smtpSettings {
        id
        host
        port
        useSsl
      }
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

// ============ Custom Domains ============

export const GET_CUSTOM_DOMAINS_QUERY = gql(`
  query GetCustomDomains {
    getCustomDomains {
      id
      domain
      status
      createdAt
      dnsRecords {
        id
        recordType
        purpose
        name
        value
        isVerified
      }
      accounts {
        id
        localPart
        emailAccount {
          id
          name
          email
        }
        sendProfile {
          id
          name
          email
        }
      }
    }
  }
`);

export const ADD_CUSTOM_DOMAIN_MUTATION = gql(`
  mutation AddCustomDomain($input: AddCustomDomainInput!) {
    addCustomDomain(input: $input) {
      id
      domain
      status
    }
  }
`);

export const VERIFY_CUSTOM_DOMAIN_MUTATION = gql(`
  mutation VerifyCustomDomain($id: String!) {
    verifyCustomDomain(id: $id) {
      id
      domain
      status
    }
  }
`);

export const DELETE_CUSTOM_DOMAIN_MUTATION = gql(`
  mutation DeleteCustomDomain($id: String!) {
    deleteCustomDomain(id: $id)
  }
`);

export const CREATE_CUSTOM_DOMAIN_ACCOUNT_MUTATION = gql(`
  mutation CreateCustomDomainAccount($input: CreateCustomDomainAccountInput!) {
    createCustomDomainAccount(input: $input) {
      id
      localPart
      emailAccount {
        id
        email
      }
    }
  }
`);

export const DELETE_CUSTOM_DOMAIN_ACCOUNT_MUTATION = gql(`
  mutation DeleteCustomDomainAccount($id: String!) {
    deleteCustomDomainAccount(id: $id)
  }
`);

// ============ Billing ============

export const GET_BILLING_INFO_QUERY = gql(`
  query GetBillingInfo($sessionId: String) {
    getBillingInfo(sessionId: $sessionId) {
      subscription {
        id
        status
        storageTier
        accountTier
        domainTier
        storageLimitBytes
        accountLimit
        domainLimit
        isValid
        currentPeriodEnd
        cancelAtPeriodEnd
      }
      hasStripeCustomer
      usage {
        userId
        accountCount
        domainCount
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
      domainUsagePercent
      isStorageLimitExceeded
      isAccountLimitExceeded
      isDomainLimitExceeded
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
  mutation CreateCheckoutSession($storageTier: StorageTier!, $accountTier: AccountTier!, $domainTier: DomainTier!) {
    createCheckoutSession(storageTier: $storageTier, accountTier: $accountTier, domainTier: $domainTier)
  }
`);

export const PREVIEW_SUBSCRIPTION_CHANGE_QUERY = gql(`
  query PreviewSubscriptionChange($storageTier: StorageTier!, $accountTier: AccountTier!, $domainTier: DomainTier!) {
    previewSubscriptionChange(storageTier: $storageTier, accountTier: $accountTier, domainTier: $domainTier) {
      immediateAmount
      recurringAmount
      currency
      interval
      lineItems {
        description
        amount
      }
    }
  }
`);
