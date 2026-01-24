/**
 * Edit SMTP Profile Screen
 * Create or edit SMTP profiles for sending emails
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon, SafeHeader } from '../../components/ui';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';

const GET_SMTP_PROFILE_QUERY = gql`
  query GetSmtpProfile($id: String!) {
    getSmtpProfile(id: $id) {
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
`;

const CREATE_SMTP_PROFILE_MUTATION = gql`
  mutation CreateSmtpProfile($input: CreateSmtpProfileInput!) {
    createSmtpProfile(input: $input) {
      id
      name
      email
    }
  }
`;

const UPDATE_SMTP_PROFILE_MUTATION = gql`
  mutation UpdateSmtpProfile($input: UpdateSmtpProfileInput!) {
    updateSmtpProfile(input: $input) {
      id
      name
      email
    }
  }
`;

const DELETE_SMTP_PROFILE_MUTATION = gql`
  mutation DeleteSmtpProfile($id: String!) {
    deleteSmtpProfile(id: $id)
  }
`;

interface EditSmtpProfileScreenProps {
  onClose: () => void;
}

export function EditSmtpProfileScreen({ onClose }: EditSmtpProfileScreenProps) {
  const theme = useTheme();
  const route = useRoute();
  const params = route.params as { profileId?: string } | undefined;
  const profileId = params?.profileId;
  const isEditing = !!profileId;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [alias, setAlias] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('587');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [useSsl, setUseSsl] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profileId) {
      loadProfile();
    }
  }, [profileId]);

  const loadProfile = async () => {
    if (!profileId) return;
    setIsLoading(true);
    try {
      const { data } = await apolloClient.query({
        query: GET_SMTP_PROFILE_QUERY,
        variables: { id: profileId },
        fetchPolicy: 'network-only',
      });
      if (data?.getSmtpProfile) {
        const profile = data.getSmtpProfile;
        setName(profile.name);
        setEmail(profile.email);
        setAlias(profile.alias || '');
        setHost(profile.host);
        setPort(String(profile.port));
        setUseSsl(profile.useSsl);
        setIsDefault(profile.isDefault);
      }
    } catch (error) {
      console.error('Error loading SMTP profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !host.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isEditing && !password.trim()) {
      Alert.alert('Error', 'Password is required for new profiles');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await apolloClient.mutate({
          mutation: UPDATE_SMTP_PROFILE_MUTATION,
          variables: {
            input: {
              id: profileId,
              name: name.trim(),
              alias: alias.trim() || undefined,
              host: host.trim(),
              port: parseInt(port, 10),
              useSsl,
              isDefault,
              ...(password.trim() ? { password: password.trim() } : {}),
            },
          },
          refetchQueries: ['GetSmtpProfiles'],
        });
        Alert.alert('Success', 'Profile updated', [{ text: 'OK', onPress: onClose }]);
      } else {
        await apolloClient.mutate({
          mutation: CREATE_SMTP_PROFILE_MUTATION,
          variables: {
            input: {
              name: name.trim(),
              email: email.trim(),
              alias: alias.trim() || undefined,
              host: host.trim(),
              port: parseInt(port, 10),
              username: username.trim() || email.trim(),
              password: password.trim(),
              useSsl,
              isDefault,
            },
          },
          refetchQueries: ['GetSmtpProfiles'],
        });
        Alert.alert('Success', 'Profile created', [{ text: 'OK', onPress: onClose }]);
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete this SMTP profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              await apolloClient.mutate({
                mutation: DELETE_SMTP_PROFILE_MUTATION,
                variables: { id: profileId },
                refetchQueries: ['GetSmtpProfiles'],
              });
              Alert.alert('Success', 'Profile deleted', [{ text: 'OK', onPress: onClose }]);
            } catch (error: any) {
              console.error('Error deleting profile:', error);
              Alert.alert('Error', error.message || 'Failed to delete profile');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeHeader style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Icon name="x" size="md" color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isEditing ? 'Edit SMTP Profile' : 'New SMTP Profile'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[
            styles.saveButton,
            { backgroundColor: theme.colors.primary },
            isSaving && { opacity: 0.5 },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={theme.colors.textInverse} />
          ) : (
            <>
              <Icon name="check" size="sm" color={theme.colors.textInverse} />
              <Text style={[styles.saveButtonText, { color: theme.colors.textInverse }]}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </SafeHeader>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Profile Name */}
        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Profile Name *</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Work Email"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        {/* From Email */}
        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>From Email *</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isEditing}
          />
        </View>

        {/* Display Name Alias */}
        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Display Name (Optional)</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={alias}
            onChangeText={setAlias}
            placeholder="John Doe"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        {/* Server Settings */}
        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>SMTP Server *</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={host}
            onChangeText={setHost}
            placeholder="smtp.gmail.com"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
          />
        </View>

        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Port</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={port}
            onChangeText={setPort}
            placeholder="587"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="number-pad"
          />
        </View>

        {/* Username */}
        {!isEditing && (
          <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Username (optional)</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              value={username}
              onChangeText={setUsername}
              placeholder="Usually same as email"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
            />
          </View>
        )}

        {/* Password */}
        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>
            Password {isEditing ? '(leave empty to keep current)' : '*'}
          </Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
          />
        </View>

        {/* Options */}
        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchLabel, { color: theme.colors.text }]}>Use SSL/TLS</Text>
              <Text style={[styles.switchHint, { color: theme.colors.textMuted }]}>Recommended for security</Text>
            </View>
            <Switch
              value={useSsl}
              onValueChange={setUseSsl}
              trackColor={{ true: theme.colors.primary }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchLabel, { color: theme.colors.text }]}>Default Profile</Text>
              <Text style={[styles.switchHint, { color: theme.colors.textMuted }]}>Use for new emails</Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ true: theme.colors.primary }}
            />
          </View>
        </View>

        {/* Delete Button */}
        {isEditing && (
          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: theme.colors.error }]}
            onPress={handleDelete}
          >
            <Icon name="trash-2" size="md" color={theme.colors.error} />
            <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>
              Delete Profile
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  headerButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  saveButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  fieldContainer: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: FONT_SIZE.md,
  },
  switchHint: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: SPACING.xs,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  deleteButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
