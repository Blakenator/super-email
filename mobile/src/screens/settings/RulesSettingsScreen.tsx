/**
 * Mail Rules Settings Screen
 * Manage automatic email filtering rules
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useTheme, sharedStyles, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon } from '../../components/ui';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';

const GET_MAIL_RULES_QUERY = gql`
  query GetMailRules {
    getMailRules {
      id
      name
      description
      isEnabled
      priority
    }
  }
`;

interface MailRule {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  priority: number;
}

interface RulesSettingsScreenProps {
  onEditRule?: (ruleId: string) => void;
  onAddRule?: () => void;
}

export function RulesSettingsScreen({ onEditRule, onAddRule }: RulesSettingsScreenProps) {
  const theme = useTheme();
  const [rules, setRules] = useState<MailRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_MAIL_RULES_QUERY,
        fetchPolicy: 'network-only',
      });
      setRules(data?.getMailRules ?? []);
    } catch (error) {
      console.error('Error loading rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRule = (rule: MailRule) => (
    <TouchableOpacity
      key={rule.id}
      style={[
        styles.ruleItem,
        { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
      ]}
      onPress={() => onEditRule?.(rule.id)}
    >
      <View style={styles.ruleInfo}>
        <Text style={[styles.ruleName, { color: theme.colors.text }]}>{rule.name}</Text>
        {rule.description && (
          <Text style={[styles.ruleConditions, { color: theme.colors.textMuted }]}>
            {rule.description}
          </Text>
        )}
      </View>
      <Switch
        value={rule.isEnabled}
        trackColor={{ true: theme.colors.primary }}
        onValueChange={() => {}}
      />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={sharedStyles.screenScrollContent}
    >
      <View style={[sharedStyles.sectionHeader]}>
        <Text style={[sharedStyles.sectionTitle, { color: theme.colors.textMuted }]}>
          MAIL RULES
        </Text>
      </View>

      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        {rules.length === 0 && !isLoading ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
            <Icon name="zap" size="xl" color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No mail rules
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              Create rules to automatically filter and organize incoming emails.
            </Text>
          </View>
        ) : (
          rules.map(renderRule)
        )}
      </View>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={onAddRule}
      >
        <Icon name="plus" size="md" color="#fff" />
        <Text style={styles.addButtonText}>Create Rule</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  ruleInfo: {
    flex: 1,
  },
  ruleName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
  },
  ruleConditions: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  addButtonText: {
    color: '#fff',
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
});
