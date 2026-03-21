import {
  StorageTier,
  AccountTier,
  DomainTier,
} from '../../../__generated__/graphql';

export function formatTier(
  tier: string,
  category?: 'storage' | 'account' | 'domain',
): string {
  switch (tier) {
    case 'FREE':
      return 'Free';
    case 'BASIC':
      return 'Basic';
    case 'PRO':
      return 'Pro';
    case 'ENTERPRISE':
      return category === 'domain' ? 'Super Domains' : 'Enterprise';
    default:
      return tier;
  }
}

export function getStorageLimit(tier: string): string {
  switch (tier) {
    case 'FREE':
      return '5 GB';
    case 'BASIC':
      return '10 GB';
    case 'PRO':
      return '20 GB';
    case 'ENTERPRISE':
      return '100 GB';
    default:
      return 'Unknown';
  }
}

export function getAccountLimit(tier: string): string {
  switch (tier) {
    case 'FREE':
      return '1 account';
    case 'BASIC':
      return '2 accounts';
    case 'PRO':
      return '5 accounts';
    case 'ENTERPRISE':
      return 'Unlimited';
    default:
      return 'Unknown';
  }
}

export function getDomainLimit(tier: string): string {
  switch (tier) {
    case 'FREE':
      return '0 domains';
    case 'BASIC':
      return '1 domain';
    case 'PRO':
      return '2 domains';
    case 'ENTERPRISE':
      return '5 domains';
    default:
      return 'Unknown';
  }
}

export function formatPrice(
  unitAmount: number,
  currency: string,
  interval: string,
): string {
  const amount = unitAmount / 100;
  const currencySymbol = currency.toUpperCase() === 'USD' ? '$' : currency;
  const intervalLabel = interval === 'month' ? '/mo' : `/${interval}`;
  return `${currencySymbol}${amount}${intervalLabel}`;
}

export interface TierInfo {
  id: StorageTier | AccountTier | DomainTier;
  name: string;
  limit: string;
  price: string;
  isConfigured: boolean;
}

const DEFAULT_DOMAIN_TIERS: Omit<TierInfo, 'isConfigured'>[] = [
  { id: DomainTier.Free, name: 'Free', limit: '0 domains', price: '$0' },
  { id: DomainTier.Basic, name: 'Basic', limit: '1 domain', price: '$5/mo' },
  { id: DomainTier.Pro, name: 'Pro', limit: '2 domains', price: '$7/mo' },
  {
    id: DomainTier.Enterprise,
    name: 'Super Domains',
    limit: '5 domains',
    price: '$10/mo',
  },
];

const DEFAULT_STORAGE_TIERS: Omit<TierInfo, 'isConfigured'>[] = [
  { id: StorageTier.Free, name: 'Free', limit: '5 GB', price: '$0' },
  { id: StorageTier.Basic, name: 'Basic', limit: '10 GB', price: '$5/mo' },
  { id: StorageTier.Pro, name: 'Pro', limit: '20 GB', price: '$10/mo' },
  {
    id: StorageTier.Enterprise,
    name: 'Enterprise',
    limit: '100 GB',
    price: '$20/mo',
  },
];

const DEFAULT_ACCOUNT_TIERS: Omit<TierInfo, 'isConfigured'>[] = [
  { id: AccountTier.Free, name: 'Free', limit: '1 account', price: '$0' },
  { id: AccountTier.Basic, name: 'Basic', limit: '2 accounts', price: '$5/mo' },
  { id: AccountTier.Pro, name: 'Pro', limit: '5 accounts', price: '$10/mo' },
  {
    id: AccountTier.Enterprise,
    name: 'Enterprise',
    limit: 'Unlimited',
    price: '$20/mo',
  },
];

export function buildStorageTiers(
  prices: Array<{
    tier: string;
    type: string;
    name: string;
    unitAmount: number;
    currency: string;
    interval: string;
  }>,
): TierInfo[] {
  const storagePrices = prices.filter((p) => p.type === 'storage');
  const priceMap = new Map(storagePrices.map((p) => [p.tier, p]));

  return DEFAULT_STORAGE_TIERS.map((tier) => {
    const stripePrice = priceMap.get(tier.id.toUpperCase());
    const isFree = tier.id === StorageTier.Free;
    const isConfigured = isFree || !!stripePrice;

    if (stripePrice) {
      return {
        ...tier,
        name: stripePrice.name.replace(' Storage', '').replace(' storage', ''),
        price: formatPrice(
          stripePrice.unitAmount,
          stripePrice.currency,
          stripePrice.interval,
        ),
        isConfigured,
      };
    }
    return { ...tier, isConfigured };
  });
}

export function buildAccountTiers(
  prices: Array<{
    tier: string;
    type: string;
    name: string;
    unitAmount: number;
    currency: string;
    interval: string;
  }>,
): TierInfo[] {
  const accountPrices = prices.filter((p) => p.type === 'account');
  const priceMap = new Map(accountPrices.map((p) => [p.tier, p]));

  return DEFAULT_ACCOUNT_TIERS.map((tier) => {
    const stripePrice = priceMap.get(tier.id.toUpperCase());
    const isFree = tier.id === AccountTier.Free;
    const isConfigured = isFree || !!stripePrice;

    if (stripePrice) {
      return {
        ...tier,
        name: stripePrice.name
          .replace(' Accounts', '')
          .replace(' accounts', ''),
        price: formatPrice(
          stripePrice.unitAmount,
          stripePrice.currency,
          stripePrice.interval,
        ),
        isConfigured,
      };
    }
    return { ...tier, isConfigured };
  });
}

export function buildDomainTiers(
  prices: Array<{
    tier: string;
    type: string;
    name: string;
    unitAmount: number;
    currency: string;
    interval: string;
  }>,
): TierInfo[] {
  const domainPrices = prices.filter((p) => p.type === 'domain');
  const priceMap = new Map(domainPrices.map((p) => [p.tier, p]));

  return DEFAULT_DOMAIN_TIERS.map((tier) => {
    const stripePrice = priceMap.get(tier.id.toUpperCase());
    const isFree = tier.id === DomainTier.Free;
    const isConfigured = isFree || !!stripePrice;

    if (stripePrice) {
      return {
        ...tier,
        name: stripePrice.name
          .replace(' Domains', '')
          .replace(' domains', ''),
        price: formatPrice(
          stripePrice.unitAmount,
          stripePrice.currency,
          stripePrice.interval,
        ),
        isConfigured,
      };
    }
    return { ...tier, isConfigured };
  });
}
