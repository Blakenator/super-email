# Email Auto-Categorization Plan

This document outlines strategies for automatically categorizing emails without using AI/LLM solutions.

## Categories

| Category | Description | Icon Suggestion |
|----------|-------------|-----------------|
| **Primary** | Personal, important conversations | `faUser` |
| **Marketing** | Promotional emails, newsletters, deals | `faBullhorn` |
| **Social** | Social network notifications | `faUsers` |
| **Updates** | Automated updates, receipts, confirmations | `faBell` |
| **Forums** | Mailing lists, group discussions | `faComments` |
| **Finance** | Banking, invoices, payments | `faDollarSign` |
| **Travel** | Flight confirmations, hotel bookings | `faPlane` |
| **High Priority** | Urgent/important emails | `faExclamationCircle` |

## Categorization Strategies

### 1. Sender Domain Analysis

Match sender domains against known lists:

```typescript
const MARKETING_DOMAINS = [
  'mailchimp.com', 'sendgrid.net', 'mailgun.org', 
  'campaign-archive.com', 'list-manage.com', 'exacttarget.com',
  'constantcontact.com', 'hubspot.com', 'klaviyo.com'
];

const SOCIAL_DOMAINS = [
  'facebookmail.com', 'twitter.com', 'linkedin.com',
  'instagram.com', 'pinterest.com', 'tiktok.com',
  'reddit.com', 'quora.com', 'medium.com'
];

const FINANCE_DOMAINS = [
  'paypal.com', 'venmo.com', 'chase.com', 'bankofamerica.com',
  'wellsfargo.com', 'stripe.com', 'square.com'
];

const TRAVEL_DOMAINS = [
  'booking.com', 'airbnb.com', 'expedia.com', 'kayak.com',
  'united.com', 'delta.com', 'southwest.com', 'hotels.com'
];
```

### 2. Email Header Analysis

#### List-Unsubscribe Header
Presence of `List-Unsubscribe` header strongly indicates marketing/newsletter:
```typescript
if (headers['list-unsubscribe']) {
  return 'MARKETING';
}
```

#### Precedence Header
```typescript
const precedence = headers['precedence']?.toLowerCase();
if (precedence === 'bulk' || precedence === 'list') {
  return 'MARKETING';
}
```

#### X-Mailer / X-Campaign Headers
```typescript
if (headers['x-campaign'] || headers['x-mailchimp-campaign']) {
  return 'MARKETING';
}
```

#### Reply-To Mismatch
If reply-to differs significantly from sender, likely automated:
```typescript
if (headers['reply-to'] && headers['reply-to'] !== fromAddress) {
  // Likely automated/marketing
}
```

### 3. Subject Line Pattern Matching

```typescript
const MARKETING_PATTERNS = [
  /\b(sale|discount|off|deal|offer|promo|save)\b/i,
  /\b(limited time|act now|don't miss|last chance)\b/i,
  /\b(unsubscribe|newsletter|weekly digest)\b/i,
  /\d+%\s*(off|discount|sale)/i,
  /\$\d+/,  // Price mentions
];

const UPDATE_PATTERNS = [
  /\b(receipt|invoice|order|confirmation|shipped|delivered)\b/i,
  /\b(your order|order #|tracking|shipment)\b/i,
  /\b(password reset|verify|confirm your|security alert)\b/i,
  /\b(statement|bill|payment due|payment received)\b/i,
];

const SOCIAL_PATTERNS = [
  /\b(commented|liked|mentioned|tagged|followed|shared)\b/i,
  /\b(new follower|friend request|connection request)\b/i,
  /\b(posted|replied to|reacted)\b/i,
];

const HIGH_PRIORITY_PATTERNS = [
  /\b(urgent|important|action required|immediate|asap)\b/i,
  /\b(deadline|due today|expires|final notice)\b/i,
];
```

### 4. Sender Pattern Analysis

```typescript
const NOREPLY_PATTERNS = [
  /^no-?reply@/i,
  /^do-?not-?reply@/i,
  /^notifications?@/i,
  /^alerts?@/i,
  /^news(letter)?@/i,
  /^updates?@/i,
  /^info@/i,
  /^support@/i,
  /^team@/i,
];

// noreply senders are typically automated
if (NOREPLY_PATTERNS.some(p => p.test(fromAddress))) {
  // Likely automated, check other signals for specific category
}
```

### 5. Body Content Analysis

```typescript
const MARKETING_BODY_SIGNALS = [
  // HTML-heavy with images
  (html) => (html.match(/<img/gi) || []).length > 3,
  // Multiple links
  (html) => (html.match(/<a\s/gi) || []).length > 5,
  // Tracking pixels (1x1 images)
  (html) => /width=["']?1["']?\s+height=["']?1["']?/i.test(html),
  // Unsubscribe links
  (html) => /unsubscribe/i.test(html),
  // View in browser links
  (html) => /view\s+(this\s+)?(email\s+)?in\s+(your\s+)?browser/i.test(html),
];

const FINANCE_BODY_SIGNALS = [
  // Transaction amounts
  (text) => /\$[\d,]+\.\d{2}/.test(text),
  // Account numbers (masked)
  (text) => /\*{4,}\d{4}/.test(text),
  // Routing/account keywords
  (text) => /\b(balance|transaction|deposit|withdrawal|transfer)\b/i.test(text),
];
```

### 6. Contact Book Integration

```typescript
// Emails from known contacts should be Primary
async function isKnownContact(fromAddress: string, userId: string): Promise<boolean> {
  const contact = await ContactEmail.findOne({
    include: [{ model: Contact, where: { userId } }],
    where: { email: fromAddress.toLowerCase() }
  });
  return !!contact;
}
```

### 7. Conversation Thread Analysis

```typescript
// If user has replied to this thread, it's likely Primary
async function hasUserReplied(threadId: string, userId: string): Promise<boolean> {
  const sentEmail = await Email.findOne({
    where: { 
      threadId, 
      folder: EmailFolder.SENT 
    },
    include: [{
      model: EmailAccount,
      where: { userId }
    }]
  });
  return !!sentEmail;
}
```

## Implementation Approach

### Priority Order for Categorization

1. **Known Contact** → Primary
2. **User has replied** → Primary  
3. **High Priority patterns** → High Priority
4. **List-Unsubscribe header** → Marketing
5. **Social domain** → Social
6. **Finance domain** → Finance
7. **Travel domain** → Travel
8. **Marketing patterns** → Marketing
9. **Update patterns** → Updates
10. **Default** → Primary

### Database Schema Addition

```typescript
// Add to Email model
@Column({ type: DataType.TEXT, allowNull: true })
declare category: string | null;

@Column({ type: DataType.BOOLEAN, defaultValue: false })
declare categoryConfirmed: boolean; // User manually set
```

### Categorization Service

```typescript
interface CategoryResult {
  category: EmailCategory;
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
}

async function categorizeEmail(email: Email, userId: string): Promise<CategoryResult> {
  const signals: string[] = [];
  
  // Check known contact first
  if (await isKnownContact(email.fromAddress, userId)) {
    return { category: 'PRIMARY', confidence: 'high', signals: ['known_contact'] };
  }
  
  // Check thread participation
  if (email.threadId && await hasUserReplied(email.threadId, userId)) {
    return { category: 'PRIMARY', confidence: 'high', signals: ['user_replied'] };
  }
  
  // Header-based detection
  const headers = email.headers as Record<string, string> || {};
  if (headers['list-unsubscribe']) {
    signals.push('list_unsubscribe_header');
  }
  
  // Domain-based detection
  const domain = email.fromAddress.split('@')[1]?.toLowerCase();
  if (MARKETING_DOMAINS.includes(domain)) {
    signals.push('marketing_domain');
  }
  // ... more checks
  
  // Score-based final decision
  return computeFinalCategory(signals);
}
```

### User Feedback Loop

Allow users to correct categorization:
- Store user corrections
- Build per-user domain/sender preferences
- Use corrections to improve future categorization

```typescript
interface UserCategoryPreference {
  userId: string;
  senderDomain: string;
  senderAddress?: string;
  preferredCategory: EmailCategory;
  createdAt: Date;
}
```

### Sync Integration

```typescript
// In imap-sync.ts, after email is saved:
async function postSyncProcessing(email: Email, userId: string) {
  // Auto-categorize
  if (!email.category) {
    const result = await categorizeEmail(email, userId);
    await email.update({ category: result.category });
  }
  
  // Apply mail rules (existing feature)
  await applyMailRules(email, userId);
}
```

## Future Enhancements

1. **Learning from User Behavior**
   - Track which emails users open/ignore
   - Track time-to-read patterns
   - Build sender reputation scores

2. **Batch Categorization**
   - Add "Categorize All" button for existing emails
   - Process in background with progress indicator

3. **Category-based Views**
   - Add category tabs/filters to inbox
   - Smart grouping by category

4. **Custom Categories**
   - Let users create their own categories
   - User-defined rules per category
