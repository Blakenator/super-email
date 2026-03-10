/**
 * Edit Send Profile Screen
 * Create or edit SMTP and custom domain send profiles
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

const GET_SEND_PROFILE_QUERY = gql`
  query GetSendProfile($id: String!) {
    getSendProfile(id: $id) {
      id
      name
      email
      alias
      type
      isDefault
      smtpSettings {
        host
        port
        useSsl
      }
    }
  }
`;

const GET_CUSTOM_DOMAINS_QUERY = gql`
  query GetCustomDomainsForProfilePicker {
    getCustomDomains {
      id
      domain
      status
    }
  }
`;

const CREATE_SEND_PROFILE_MUTATION = gql`
  mutation CreateSendProfile($input: CreateSendProfileInput!) {
    createSendProfile(input: $input) {
      id
      name
      email
    }
  }
`;

const UPDATE_SEND_PROFILE_MUTATION = gql`
  mutation UpdateSendProfile($input: UpdateSendProfileInput!) {
    updateSendProfile(input: $input) {
      id
      name
      email
    }
  }
`;

const DELETE_SEND_PROFILE_MUTATION = gql`
  mutation DeleteSendProfile($id: String!) {
    deleteSendProfile(id: $id)
  }
`;

interface CustomDomain {
  id: string;
  domain: string;
  status: string;
}

type CreateMode = 'smtp' | 'custom-domain';

interface EditSendProfileScreenProps {
  onClose: () => void;
}

export function EditSendProfileScreen({ onClose }: EditSendProfileScreenProps) {
  const theme = useTheme();
  const route = useRoute();
  const params = route.params as { profileId?: string } | undefined;
  const profileId = params?.profileId;
  const isEditing = !!profileId;

  // Shared state
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingType, setEditingType] = useState<string>('SMTP');

  // SMTP-specific state
  const [email, setEmail] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('587');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [useSsl, setUseSsl] = useState(true);

  // Custom domain create state
  const [createMode, setCreateMode] = useState<CreateMode>('smtp');
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [localPart, setLocalPart] = useState('');

  const verifiedDomains = customDomains.filter((d) => d.status === 'VERIFIED');
  const showModeSelector = !isEditing && verifiedDomains.length > 0;
  const isCustomDomainEdit = isEditing && editingType === 'CUSTOM_DOMAIN';

  useEffect(() => {
    if (profileId) {
      loadProfile();
    }
    loadCustomDomains();
  }, [profileId]);

  const loadCustomDomains = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_CUSTOM_DOMAINS_QUERY,
        fetchPolicy: 'network-only',
      });
      const domains = data?.getCustomDomains ?? [];
      setCustomDomains(domains);
      const verified = domains.filter((d: CustomDomain) => d.status === 'VERIFIED');
      if (verified.length > 0 && !selectedDomainId) {
        setSelectedDomainId(verified[0].id);
      }
    } catch (error) {
      console.error('Error loading custom domains:', error);
    }
  };

  const loadProfile = async () => {
    if (!profileId) return;
    setIsLoading(true);
    try {
      const { data } = await apolloClient.query({
        query: GET_SEND_PROFILE_QUERY,
        variables: { id: profileId },
        fetchPolicy: 'network-only',
      });
      if (data?.getSendProfile) {
        const profile = data.getSendProfile;
        setName(profile.name);
        setEmail(profile.email);
        setAlias(profile.alias || '');
        setEditingType(profile.type || 'SMTP');
        if (profile.smtpSettings) {
          setHost(profile.smtpSettings.host);
          setPort(String(profile.smtpSettings.port));
          setUseSsl(profile.smtpSettings.useSsl);
        }
        setIsDefault(profile.isDefault);
      }
    } catch (error) {
      console.error('Error loading send profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (createMode === 'custom-domain' && !isEditing) {
      return handleSaveCustomDomain();
    }

    if (isCustomDomainEdit) {
      return handleSaveCustomDomainEdit();
    }

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
          mutation: UPDATE_SEND_PROFILE_MUTATION,
          variables: {
            input: {
              id: profileId,
              name: name.trim(),
              alias: alias.trim() || undefined,
              smtpHost: host.trim(),
              smtpPort: parseInt(port, 10),
              smtpUseSsl: useSsl,
              isDefault,
              ...(password.trim() ? { smtpPassword: password.trim() } : {}),
            },
          },
          refetchQueries: ['GetSendProfiles'],
        });
        Alert.alert('Success', 'Profile updated', [{ text: 'OK', onPress: onClose }]);
      } else {
        await apolloClient.mutate({
          mutation: CREATE_SEND_PROFILE_MUTATION,
          variables: {
            input: {
              type: 'SMTP',
              name: name.trim(),
              email: email.trim(),
              alias: alias.trim() || undefined,
              smtpHost: host.trim(),
              smtpPort: parseInt(port, 10),
              smtpUsername: username.trim() || email.trim(),
              smtpPassword: password.trim(),
              smtpUseSsl: useSsl,
              isDefault,
            },
          },
          refetchQueries: ['GetSendProfiles'],
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

  const handleSaveCustomDomain = async () => {
    if (!selectedDomainId || !localPart.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    const domain = verifiedDomains.find((d) => d.id === selectedDomainId);
    const fullEmail = `${localPart.trim()}@${domain?.domain ?? ''}`;

    setIsSaving(true);
    try {
      await apolloClient.mutate({
        mutation: CREATE_SEND_PROFILE_MUTATION,
        variables: {
          input: {
            type: 'CUSTOM_DOMAIN',
            name: name.trim() || fullEmail,
            email: fullEmail,
            alias: alias.trim() || undefined,
            customDomainId: selectedDomainId,
            localPart: localPart.trim(),
          },
        },
        refetchQueries: ['GetSendProfiles'],
      });
      Alert.alert('Success', 'Profile created', [{ text: 'OK', onPress: onClose }]);
    } catch (error: any) {
      console.error('Error creating custom domain profile:', error);
      Alert.alert('Error', error.message || 'Failed to create profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCustomDomainEdit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a profile name');
      return;
    }

    setIsSaving(true);
    try {
      await apolloClient.mutate({
        mutation: UPDATE_SEND_PROFILE_MUTATION,
        variables: {
          input: {
            id: profileId,
            name: name.trim(),
            alias: alias.trim() || undefined,
            isDefault,
          },
        },
        refetchQueries: ['GetSendProfiles'],
      });
      Alert.alert('Success', 'Profile updated', [{ text: 'OK', onPress: onClose }]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete this send profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              await apolloClient.mutate({
                mutation: DELETE_SEND_PROFILE_MUTATION,
                variables: { id: profileId },
                refetchQueries: ['GetSendProfiles'],
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

  const selectedDomain = verifiedDomains.find((d) => d.id === selectedDomainId);

  const renderModeSelector = () => (
    <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Profile Type</Text>
      <View style={styles.typeSelector}>
        {([
          { key: 'smtp' as const, label: 'SMTP' },
          { key: 'custom-domain' as const, label: 'Custom Domain' },
        ]).map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.typeOption,
              { borderColor: theme.colors.border },
              createMode === key && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
            ]}
            onPress={() => setCreateMode(key)}
          >
            <Text
              style={[
                styles.typeOptionText,
                { color: createMode === key ? theme.colors.textInverse : theme.colors.text },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCustomDomainCreateForm = () => (
    <>
      {/* Domain Picker */}
      <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Domain</Text>
        <View style={styles.typeSelector}>
          {verifiedDomains.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.typeOption,
                { borderColor: theme.colors.border },
                selectedDomainId === d.id && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
              ]}
              onPress={() => setSelectedDomainId(d.id)}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  { color: selectedDomainId === d.id ? theme.colors.textInverse : theme.colors.text },
                ]}
              >
                {d.domain}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Email Local Part */}
      <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Email Address *</Text>
        <View style={styles.emailRow}>
          <TextInput
            style={[styles.input, styles.localPartInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={localPart}
            onChangeText={setLocalPart}
            placeholder="username"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={[styles.domainSuffix, { color: theme.colors.textMuted }]}>
            @{selectedDomain?.domain ?? '...'}
          </Text>
        </View>
      </View>

      {/* Profile Name */}
      <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Profile Name (Optional)</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Blake Smith"
          placeholderTextColor={theme.colors.textMuted}
        />
        <Text style={[styles.fieldHint, { color: theme.colors.textMuted }]}>
          Defaults to the full email address if left blank.
        </Text>
      </View>

      {/* Alias */}
      <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Display Name (Optional)</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={alias}
          onChangeText={setAlias}
          placeholder="John Doe"
          placeholderTextColor={theme.colors.textMuted}
        />
        <Text style={[styles.fieldHint, { color: theme.colors.textMuted }]}>
          This name will appear as the sender in outgoing emails.
        </Text>
      </View>
    </>
  );

  const renderCustomDomainEditForm = () => (
    <>
      {/* Email (read-only) */}
      <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Email Address</Text>
        <TextInput
          style={[styles.input, styles.disabledInput, { color: theme.colors.textMuted, borderColor: theme.colors.border }]}
          value={email}
          editable={false}
        />
      </View>

      {/* Profile Name */}
      <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Profile Name *</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder="Display name"
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      {/* Alias */}
      <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Display Name (Optional)</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={alias}
          onChangeText={setAlias}
          placeholder="John Doe"
          placeholderTextColor={theme.colors.textMuted}
        />
        <Text style={[styles.fieldHint, { color: theme.colors.textMuted }]}>
          This name will appear as the sender in outgoing emails.
        </Text>
      </View>

      {/* Default Profile */}
      <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
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
    </>
  );

  const renderSmtpForm = () => (
    <>
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
    </>
  );

  const renderBody = () => {
    if (isCustomDomainEdit) {
      return renderCustomDomainEditForm();
    }
    if (!isEditing && createMode === 'custom-domain') {
      return renderCustomDomainCreateForm();
    }
    return renderSmtpForm();
  };

  const getTitle = () => {
    if (isEditing) {
      return 'Edit Send Profile';
    }
    return createMode === 'custom-domain' ? 'New Custom Domain Profile' : 'New Send Profile';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeHeader style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Icon name="x" size="md" color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {getTitle()}
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
        {showModeSelector && renderModeSelector()}
        {renderBody()}

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
  fieldHint: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  disabledInput: {
    opacity: 0.6,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  localPartInput: {
    flex: 1,
  },
  domainSuffix: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  typeOptionText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
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
