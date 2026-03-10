/**
 * Send Profiles Settings Screen
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, sharedStyles, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon } from '../../components/ui';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';

const GET_SEND_PROFILES_QUERY = gql`
  query GetSendProfiles {
    getSendProfiles {
      id
      name
      email
      type
      isDefault
      smtpSettings {
        host
        port
      }
    }
  }
`;

interface SendProfile {
  id: string;
  name: string;
  email: string;
  type: string;
  isDefault: boolean;
  smtpSettings?: { host: string; port: number } | null;
}

interface SendProfileSettingsScreenProps {
  onEditProfile?: (profileId: string) => void;
  onAddProfile?: () => void;
}

export function SendProfileSettingsScreen({ onEditProfile, onAddProfile }: SendProfileSettingsScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [profiles, setProfiles] = useState<SendProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_SEND_PROFILES_QUERY,
        fetchPolicy: 'network-only',
      });
      setProfiles(data?.getSendProfiles ?? []);
    } catch (error) {
      console.error('Error loading send profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderProfile = (profile: SendProfile) => (
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
          {profile.smtpSettings
            ? `${profile.smtpSettings.host}:${profile.smtpSettings.port}`
            : profile.type === 'CUSTOM_DOMAIN' ? 'Custom Domain (SES)' : profile.email}
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
      contentContainerStyle={[sharedStyles.screenScrollContent, { paddingBottom: Math.max(SPACING.xl, insets.bottom + SPACING.md) }]}
    >
      <View style={[sharedStyles.sectionHeader]}>
        <Text style={[sharedStyles.sectionTitle, { color: theme.colors.textMuted }]}>
          SEND PROFILES
        </Text>
      </View>

      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        {profiles.length === 0 && !isLoading ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
            <Icon name="send" size="xl" color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No send profiles
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              Add a send profile to send emails.
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
        <Text style={[styles.addButtonText, { color: theme.colors.textInverse }]}>Add Send Profile</Text>
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
