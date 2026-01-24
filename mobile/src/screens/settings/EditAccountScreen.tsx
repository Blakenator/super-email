/**
 * Edit Email Account Screen
 * Create or edit IMAP/POP3 email accounts
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

const GET_EMAIL_ACCOUNT_QUERY = gql`
  query GetEmailAccount($id: String!) {
    getEmailAccount(id: $id) {
      id
      name
      email
      host
      port
      accountType
      useSsl
      isDefault
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

const UPDATE_EMAIL_ACCOUNT_MUTATION = gql`
  mutation UpdateEmailAccount($id: String!, $input: UpdateEmailAccountInput!) {
    updateEmailAccount(id: $id, input: $input) {
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

interface EditAccountScreenProps {
  onClose: () => void;
}

export function EditAccountScreen({ onClose }: EditAccountScreenProps) {
  const theme = useTheme();
  const route = useRoute();
  const params = route.params as { accountId?: string } | undefined;
  const accountId = params?.accountId;
  const isEditing = !!accountId;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('993');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'IMAP' | 'POP3'>('IMAP');
  const [useSsl, setUseSsl] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (accountId) {
      loadAccount();
    }
  }, [accountId]);

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
        setHost(account.host);
        setPort(String(account.port));
        setAccountType(account.accountType);
        setUseSsl(account.useSsl);
        setIsDefault(account.isDefault);
        setUsername(account.email); // Usually the email is the username
      }
    } catch (error) {
      console.error('Error loading account:', error);
      Alert.alert('Error', 'Failed to load account');
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
      Alert.alert('Error', 'Password is required for new accounts');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await apolloClient.mutate({
          mutation: UPDATE_EMAIL_ACCOUNT_MUTATION,
          variables: {
            id: accountId,
            input: {
              name: name.trim(),
              host: host.trim(),
              port: parseInt(port, 10),
              useSsl,
              isDefault,
              ...(password.trim() ? { password: password.trim() } : {}),
            },
          },
          refetchQueries: ['GetEmailAccounts'],
        });
        Alert.alert('Success', 'Account updated', [{ text: 'OK', onPress: onClose }]);
      } else {
        await apolloClient.mutate({
          mutation: CREATE_EMAIL_ACCOUNT_MUTATION,
          variables: {
            input: {
              name: name.trim(),
              email: email.trim(),
              host: host.trim(),
              port: parseInt(port, 10),
              username: username.trim() || email.trim(),
              password: password.trim(),
              accountType,
              useSsl,
              isDefault,
            },
          },
          refetchQueries: ['GetEmailAccounts'],
        });
        Alert.alert('Success', 'Account created', [{ text: 'OK', onPress: onClose }]);
      }
    } catch (error: any) {
      console.error('Error saving account:', error);
      Alert.alert('Error', error.message || 'Failed to save account');
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeHeader style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Icon name="x" size="md" color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isEditing ? 'Edit Account' : 'New Email Account'}
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
            <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Account Type</Text>
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
