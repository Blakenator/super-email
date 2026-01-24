/**
 * SMTP Profiles Settings Screen
 * Manage outgoing email server profiles
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme, sharedStyles, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon } from '../../components/ui';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';

const GET_SMTP_PROFILES_QUERY = gql`
  query GetSmtpProfiles {
    getSmtpProfiles {
      id
      name
      email
      host
      port
      isDefault
    }
  }
`;

interface SmtpProfile {
  id: string;
  name: string;
  email: string;
  host: string;
  port: number;
  isDefault: boolean;
}

interface SmtpSettingsScreenProps {
  onEditProfile?: (profileId: string) => void;
  onAddProfile?: () => void;
}

export function SmtpSettingsScreen({ onEditProfile, onAddProfile }: SmtpSettingsScreenProps) {
  const theme = useTheme();
  const [profiles, setProfiles] = useState<SmtpProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_SMTP_PROFILES_QUERY,
        fetchPolicy: 'network-only',
      });
      setProfiles(data?.getSmtpProfiles ?? []);
    } catch (error) {
      console.error('Error loading SMTP profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderProfile = (profile: SmtpProfile) => (
    <TouchableOpacity
      key={profile.id}
      style={[
        styles.profileItem,
        { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
      ]}
      onPress={() => onEditProfile?.(profile.id)}
    >
      <View style={[styles.profileIcon, { backgroundColor: theme.colors.secondary }]}>
        <Icon name="send" size="md" color={theme.colors.textInverse} />
      </View>
      <View style={styles.profileInfo}>
        <Text style={[styles.profileName, { color: theme.colors.text }]}>
          {profile.name}
        </Text>
        <Text style={[styles.profileHost, { color: theme.colors.textMuted }]}>
          {profile.host}:{profile.port}
        </Text>
        <View style={styles.profileMeta}>
          <Text style={[styles.profileUsername, { color: theme.colors.textMuted }]}>
            {profile.email}
          </Text>
          {profile.isDefault && (
            <View style={[styles.defaultBadge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.defaultText, { color: theme.colors.primary }]}>Default</Text>
            </View>
          )}
        </View>
      </View>
      <Icon name="chevron-right" size="md" color={theme.colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={sharedStyles.screenScrollContent}
    >
      <View style={[sharedStyles.sectionHeader]}>
        <Text style={[sharedStyles.sectionTitle, { color: theme.colors.textMuted }]}>
          SMTP PROFILES
        </Text>
      </View>

      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        {profiles.length === 0 && !isLoading ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
            <Icon name="send" size="xl" color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No SMTP profiles
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              Add an SMTP profile to send emails.
            </Text>
          </View>
        ) : (
          profiles.map(renderProfile)
        )}
      </View>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={onAddProfile}
      >
        <Icon name="plus" size="md" color={theme.colors.textInverse} />
        <Text style={[styles.addButtonText, { color: theme.colors.textInverse }]}>Add SMTP Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
  },
  profileHost: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: SPACING.sm,
  },
  profileUsername: {
    fontSize: FONT_SIZE.xs,
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
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
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
});
