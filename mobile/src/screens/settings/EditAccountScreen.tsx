/**
 * Edit Email Account Screen
 * Create or edit IMAP/POP3 and custom domain email accounts
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon, SafeHeader } from '../../components/ui';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';

const GET_EMAIL_ACCOUNT_QUERY = gql`
  query GetEmailAccount($id: String!) {
    getEmailAccount(id: $id) {
      id
      name
      email
      type
      isDefault
      imapSettings {
        host
        port
        accountType
        useSsl
      }
    }
  }
`;

const GET_CUSTOM_DOMAINS_QUERY = gql`
  query GetCustomDomainsForPicker {
    getCustomDomains {
      id
      domain
      status
    }
  }
`;

const CREATE_EMAIL_ACCOUNT_MUTATION = gql`
  mutation CreateEmailAccount($input: CreateEmailAccountInput!) {
    createEmailAccount(input: $input) {
      id
      name
      email
    }
  }
`;

const CREATE_CUSTOM_DOMAIN_ACCOUNT_MUTATION = gql`
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
`;

const UPDATE_EMAIL_ACCOUNT_MUTATION = gql`
  mutation UpdateEmailAccount($input: UpdateEmailAccountInput!) {
    updateEmailAccount(input: $input) {
      id
      name
      email
    }
  }
`;

const DELETE_EMAIL_ACCOUNT_MUTATION = gql`
  mutation DeleteEmailAccount($id: String!) {
    deleteEmailAccount(id: $id)
  }
`;

interface CustomDomain {
  id: string;
  domain: string;
  status: string;
}

type CreateMode = 'imap' | 'custom-domain';

interface EditAccountScreenProps {
  onClose: () => void;
  onAccountCreated?: (accountId: string) => void;
}

export function EditAccountScreen({ onClose, onAccountCreated }: EditAccountScreenProps) {
  const theme = useTheme();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const params = route.params as { accountId?: string } | undefined;
  const accountId = params?.accountId;
  const isEditing = !!accountId;

  // Shared state
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingType, setEditingType] = useState<string>('IMAP');

  // IMAP-specific state
  const [email, setEmail] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('993');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'IMAP' | 'POP3'>('IMAP');
  const [useSsl, setUseSsl] = useState(true);

  // Custom domain create state
  const [createMode, setCreateMode] = useState<CreateMode>('imap');
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [localPart, setLocalPart] = useState('');

  const verifiedDomains = customDomains.filter((d) => d.status === 'VERIFIED');
  const showModeSelector = !isEditing && verifiedDomains.length > 0;
  const isCustomDomainEdit = isEditing && editingType === 'CUSTOM_DOMAIN';

  useEffect(() => {
    if (accountId) {
      loadAccount();
    }
    loadCustomDomains();
  }, [accountId]);

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

  const loadAccount = async () => {
    if (!accountId) return;
    setIsLoading(true);
    try {
      const { data } = await apolloClient.query({
        query: GET_EMAIL_ACCOUNT_QUERY,
        variables: { id: accountId },
        fetchPolicy: 'network-only',
      });
      if (data?.getEmailAccount) {
        const account = data.getEmailAccount;
        setName(account.name);
        setEmail(account.email);
        setIsDefault(account.isDefault);
        setEditingType(account.type || 'IMAP');
        if (account.imapSettings) {
          setHost(account.imapSettings.host);
          setPort(String(account.imapSettings.port));
          setAccountType(account.imapSettings.accountType || 'IMAP');
          setUseSsl(account.imapSettings.useSsl);
        }
        setUsername(account.email);
      }
    } catch (error) {
      console.error('Error loading account:', error);
      Alert.alert('Error', 'Failed to load account');
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
      Alert.alert('Error', 'Password is required for new accounts');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await apolloClient.mutate({
          mutation: UPDATE_EMAIL_ACCOUNT_MUTATION,
          variables: {
            input: {
              id: accountId,
              name: name.trim(),
              imapHost: host.trim(),
              imapPort: parseInt(port, 10),
              imapUseSsl: useSsl,
              isDefault,
              ...(password.trim() ? { imapPassword: password.trim() } : {}),
            },
          },
          refetchQueries: ['GetEmailAccounts'],
        });
        Alert.alert('Success', 'Account updated', [{ text: 'OK', onPress: onClose }]);
      } else {
        const { data } = await apolloClient.mutate({
          mutation: CREATE_EMAIL_ACCOUNT_MUTATION,
          variables: {
            input: {
              type: 'IMAP',
              name: name.trim(),
              email: email.trim(),
              imapHost: host.trim(),
              imapPort: parseInt(port, 10),
              imapUsername: username.trim() || email.trim(),
              imapPassword: password.trim(),
              imapAccountType: accountType,
              imapUseSsl: useSsl,
              isDefault,
            },
          },
          refetchQueries: ['GetEmailAccounts'],
        });
        const newAccountId = data?.createEmailAccount?.id;
        if (newAccountId && onAccountCreated) {
          onAccountCreated(newAccountId);
        } else {
          onClose();
        }
      }
    } catch (error: any) {
      console.error('Error saving account:', error);
      Alert.alert('Error', error.message || 'Failed to save account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCustomDomain = async () => {
    if (!selectedDomainId || !localPart.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsSaving(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_CUSTOM_DOMAIN_ACCOUNT_MUTATION,
        variables: {
          input: {
            customDomainId: selectedDomainId,
            localPart: localPart.trim(),
            name: name.trim() || undefined,
          },
        },
        refetchQueries: ['GetEmailAccounts', 'GetSendProfiles'],
      });
      const newAccountId = data?.createCustomDomainAccount?.emailAccount?.id;
      if (newAccountId && onAccountCreated) {
        onAccountCreated(newAccountId);
      } else {
        onClose();
      }
    } catch (error: any) {
      console.error('Error creating custom domain account:', error);
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCustomDomainEdit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    setIsSaving(true);
    try {
      await apolloClient.mutate({
        mutation: UPDATE_EMAIL_ACCOUNT_MUTATION,
        variables: {
          input: {
            id: accountId,
            name: name.trim(),
            isDefault,
          },
        },
        refetchQueries: ['GetEmailAccounts'],
      });
      Alert.alert('Success', 'Account updated', [{ text: 'OK', onPress: onClose }]);
    } catch (error: any) {
      console.error('Error updating account:', error);
      Alert.alert('Error', error.message || 'Failed to update account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this email account? This will also delete all associated emails.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              await apolloClient.mutate({
                mutation: DELETE_EMAIL_ACCOUNT_MUTATION,
                variables: { id: accountId },
                refetchQueries: ['GetEmailAccounts'],
              });
              Alert.alert('Success', 'Account deleted', [{ text: 'OK', onPress: onClose }]);
            } catch (error: any) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', error.message || 'Failed to delete account');
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
      <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Account Type</Text>
      <View style={styles.typeSelector}>
        {([
          { key: 'imap' as const, label: 'IMAP' },
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

      {/* Display Name */}
      <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Display Name (Optional)</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Blake Smith"
          placeholderTextColor={theme.colors.textMuted}
        />
        <Text style={[styles.fieldHint, { color: theme.colors.textMuted }]}>
          Defaults to the full email address if left blank. This will create both an email account and a send profile.
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

      {/* Account Name */}
      <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Account Name *</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder="Display name"
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      {/* Default Account */}
      <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={[styles.switchLabel, { color: theme.colors.text }]}>Default Account</Text>
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

  const renderImapForm = () => (
    <>
      {/* Account Name */}
      <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Account Name *</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Personal Gmail"
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      {/* Email Address */}
      <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Email Address *</Text>
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

      {/* Server Settings */}
      <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Server Host *</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={host}
          onChangeText={setHost}
          placeholder="imap.gmail.com"
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
          placeholder="993"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="number-pad"
        />
      </View>

      {/* Account Type */}
      {!isEditing && (
        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Protocol</Text>
          <View style={styles.typeSelector}>
            {(['IMAP', 'POP3'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  { borderColor: theme.colors.border },
                  accountType === type && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setAccountType(type)}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    { color: accountType === type ? theme.colors.textInverse : theme.colors.text },
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Username (if different from email) */}
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
            <Text style={[styles.switchLabel, { color: theme.colors.text }]}>Default Account</Text>
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
    return renderImapForm();
  };

  const getTitle = () => {
    if (isEditing) {
      return isCustomDomainEdit ? 'Edit Account' : 'Edit Account';
    }
    return createMode === 'custom-domain' ? 'New Custom Domain Account' : 'New Email Account';
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
              Delete Account
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: Math.max(insets.bottom, SPACING.xl) }} />
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
});
