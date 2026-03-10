/**
 * Custom Domains Settings Screen
 * Read-only view of custom email domains
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, sharedStyles, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon } from '../../components/ui';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';

const GET_CUSTOM_DOMAINS_QUERY = gql`
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
`;

interface DnsRecord {
  id: string;
  recordType: string;
  purpose: string;
  name: string;
  value: string;
  isVerified: boolean;
}

interface DomainAccount {
  id: string;
  localPart: string;
  emailAccount?: { id: string; name: string; email: string } | null;
  sendProfile?: { id: string; name: string; email: string } | null;
}

interface CustomDomain {
  id: string;
  domain: string;
  status: string;
  createdAt?: string;
  dnsRecords: DnsRecord[];
  accounts: DomainAccount[];
}

export function DomainsSettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(null);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_CUSTOM_DOMAINS_QUERY,
        fetchPolicy: 'network-only',
      });
      setDomains(data?.getCustomDomains ?? []);
    } catch (error) {
      console.error('Error loading custom domains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (domainId: string) => {
    setExpandedDomainId((prev) => (prev === domainId ? null : domainId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return theme.colors.success ?? '#28a745';
      case 'FAILED':
        return theme.colors.error;
      default:
        return theme.colors.warning ?? '#ffc107';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'Verified';
      case 'FAILED':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const renderDnsRecord = (record: DnsRecord) => (
    <View
      key={record.id}
      style={[styles.dnsRecord, { borderBottomColor: theme.colors.border }]}
    >
      <View style={styles.dnsRecordHeader}>
        <View style={[styles.dnsTypeBadge, { backgroundColor: theme.colors.primary + '15' }]}>
          <Text style={[styles.dnsTypeText, { color: theme.colors.primary }]}>
            {record.recordType}
          </Text>
        </View>
        <Text style={[styles.dnsPurpose, { color: theme.colors.textMuted }]}>
          {record.purpose}
        </Text>
        <View
          style={[
            styles.verifiedDot,
            { backgroundColor: record.isVerified ? (theme.colors.success ?? '#28a745') : theme.colors.textMuted },
          ]}
        />
      </View>
      <Text
        style={[styles.dnsName, { color: theme.colors.text }]}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {record.name}
      </Text>
      <Text
        style={[styles.dnsValue, { color: theme.colors.textMuted }]}
        numberOfLines={2}
        ellipsizeMode="middle"
      >
        {record.value}
      </Text>
    </View>
  );

  const renderAccount = (account: DomainAccount, domain: CustomDomain) => (
    <View
      key={account.id}
      style={[styles.accountRow, { borderBottomColor: theme.colors.border }]}
    >
      <Icon name="mail" size="sm" color={theme.colors.primary} />
      <View style={styles.accountInfo}>
        <Text style={[styles.accountEmail, { color: theme.colors.text }]}>
          {account.localPart}@{domain.domain}
        </Text>
        {account.emailAccount?.name && (
          <Text style={[styles.accountName, { color: theme.colors.textMuted }]}>
            {account.emailAccount.name}
          </Text>
        )}
      </View>
    </View>
  );

  const renderDomain = (domain: CustomDomain) => {
    const isExpanded = expandedDomainId === domain.id;

    return (
      <View key={domain.id}>
        <TouchableOpacity
          style={[
            styles.domainItem,
            { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
          ]}
          onPress={() => toggleExpanded(domain.id)}
        >
          <View style={[styles.domainIcon, { backgroundColor: theme.colors.primary }]}>
            <Icon name="globe" size="md" color={theme.colors.textInverse} />
          </View>
          <View style={styles.domainInfo}>
            <Text style={[styles.domainName, { color: theme.colors.text }]}>
              {domain.domain}
            </Text>
            <View style={styles.domainMeta}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(domain.status) + '20' },
                ]}
              >
                <Text style={[styles.statusText, { color: getStatusColor(domain.status) }]}>
                  {getStatusLabel(domain.status)}
                </Text>
              </View>
              {domain.accounts.length > 0 && (
                <Text style={[styles.accountCount, { color: theme.colors.textMuted }]}>
                  {domain.accounts.length} account{domain.accounts.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
          <Icon
            name={isExpanded ? 'chevron-down' : 'chevron-right'}
            size="md"
            color={theme.colors.textMuted}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.expandedContent, { backgroundColor: theme.colors.surface }]}>
            {/* DNS Records */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
              DNS RECORDS
            </Text>
            {domain.dnsRecords.length > 0 ? (
              domain.dnsRecords.map(renderDnsRecord)
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                No DNS records
              </Text>
            )}

            {/* Accounts */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>
              EMAIL ACCOUNTS
            </Text>
            {domain.accounts.length > 0 ? (
              domain.accounts.map((a) => renderAccount(a, domain))
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                No email accounts
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        sharedStyles.screenScrollContent,
        { paddingBottom: Math.max(SPACING.xl, insets.bottom + SPACING.md) },
      ]}
    >
      {/* Info banner */}
      <View style={[styles.infoBanner, { backgroundColor: theme.colors.primary + '10' }]}>
        <Icon name="info" size="sm" color={theme.colors.primary} />
        <Text style={[styles.infoBannerText, { color: theme.colors.primary }]}>
          Add, verify, and delete domains from the web app.
        </Text>
      </View>

      <View style={[sharedStyles.sectionHeader]}>
        <Text style={[sharedStyles.sectionTitle, { color: theme.colors.textMuted }]}>
          CUSTOM DOMAINS
        </Text>
      </View>

      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : domains.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
            <Icon name="globe" size="xl" color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No custom domains
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              Add a custom domain from the web app to start using your own email addresses.
            </Text>
          </View>
        ) : (
          domains.map(renderDomain)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  infoBannerText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  domainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  domainIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainInfo: {
    flex: 1,
  },
  domainName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
  },
  domainMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  accountCount: {
    fontSize: FONT_SIZE.xs,
  },
  expandedContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  dnsRecord: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dnsRecordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  dnsTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  dnsTypeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  dnsPurpose: {
    fontSize: FONT_SIZE.xs,
    flex: 1,
  },
  verifiedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dnsName: {
    fontSize: FONT_SIZE.xs,
    fontFamily: 'monospace',
  },
  dnsValue: {
    fontSize: FONT_SIZE.xs,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  accountInfo: {
    flex: 1,
  },
  accountEmail: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  accountName: {
    fontSize: FONT_SIZE.xs,
    marginTop: 1,
  },
  loadingState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    paddingVertical: SPACING.sm,
  },
});
