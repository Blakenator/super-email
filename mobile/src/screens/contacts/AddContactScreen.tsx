/**
 * Add Contact Screen
 * Quick-add contacts from email addresses with option to merge with existing
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
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme, sharedStyles, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon, Button } from '../../components/ui';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';

const SEARCH_CONTACTS_QUERY = gql`
  query SearchContactsForMerge($email: String!) {
    getContacts(input: { searchQuery: $email, limit: 10 }) {
      id
      firstName
      lastName
      emails
      company
      isAutoCreated
    }
  }
`;

const CREATE_CONTACT_MUTATION = gql`
  mutation CreateContact($input: CreateContactInput!) {
    createContact(input: $input) {
      id
      firstName
      lastName
      emails
    }
  }
`;

const UPDATE_CONTACT_MUTATION = gql`
  mutation UpdateContactEmails($id: String!, $input: UpdateContactInput!) {
    updateContact(id: $id, input: $input) {
      id
      firstName
      lastName
      emails
    }
  }
`;

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  emails: string[];
  company?: string;
  isAutoCreated: boolean;
}

interface AddContactScreenProps {
  onClose: () => void;
}

export function AddContactScreen({ onClose }: AddContactScreenProps) {
  const theme = useTheme();
  const route = useRoute();
  const params = route.params as { email?: string; name?: string } | undefined;

  // Pre-fill from route params
  const initialEmail = params?.email || '';
  const nameParts = (params?.name || '').split(' ');
  const initialFirstName = nameParts[0] || '';
  const initialLastName = nameParts.slice(1).join(' ') || '';

  const [mode, setMode] = useState<'new' | 'merge'>('new');
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(initialEmail);
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');

  const [matchingContacts, setMatchingContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Search for existing contacts when email changes
  useEffect(() => {
    if (email.length > 2) {
      searchContacts();
    } else {
      setMatchingContacts([]);
    }
  }, [email]);

  const searchContacts = async () => {
    setIsSearching(true);
    try {
      const { data } = await apolloClient.query({
        query: SEARCH_CONTACTS_QUERY,
        variables: { email },
        fetchPolicy: 'network-only',
      });
      const contacts = data?.getContacts ?? [];
      setMatchingContacts(contacts.filter((c: Contact) => !c.emails.includes(email)));
    } catch (error) {
      console.error('Error searching contacts:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Email address is required');
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'merge' && selectedContactId) {
        // Add email to existing contact
        const existingContact = matchingContacts.find(c => c.id === selectedContactId);
        if (existingContact) {
          await apolloClient.mutate({
            mutation: UPDATE_CONTACT_MUTATION,
            variables: {
              id: selectedContactId,
              input: {
                emails: [...existingContact.emails, email.trim()],
              },
            },
          });
          Alert.alert('Success', `Added ${email} to ${existingContact.firstName} ${existingContact.lastName}`, [
            { text: 'OK', onPress: onClose },
          ]);
        }
      } else {
        // Create new contact
        await apolloClient.mutate({
          mutation: CREATE_CONTACT_MUTATION,
          variables: {
            input: {
              firstName: firstName.trim() || email.split('@')[0],
              lastName: lastName.trim(),
              emails: [email.trim()],
              company: company.trim() || undefined,
              notes: notes.trim() || undefined,
            },
          },
        });
        Alert.alert('Success', 'Contact created successfully', [
          { text: 'OK', onPress: onClose },
        ]);
      }
    } catch (error: any) {
      console.error('Error saving contact:', error);
      Alert.alert('Error', error.message || 'Failed to save contact');
    } finally {
      setIsSaving(false);
    }
  };

  const getContactInitials = (contact: Contact) => {
    return `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase() || '?';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Icon name="x" size="md" color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Add Contact
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || !email.trim()}
          style={[
            styles.saveButton,
            { backgroundColor: theme.colors.primary },
            (!email.trim() || isSaving) && { opacity: 0.5 },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="check" size="sm" color="#fff" />
              <Text style={styles.saveButtonText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Mode Toggle */}
        <View style={[styles.modeToggle, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'new' && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => {
              setMode('new');
              setSelectedContactId(null);
            }}
          >
            <Icon
              name="user-plus"
              size="sm"
              color={mode === 'new' ? '#fff' : theme.colors.text}
            />
            <Text
              style={[
                styles.modeButtonText,
                { color: mode === 'new' ? '#fff' : theme.colors.text },
              ]}
            >
              New Contact
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'merge' && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setMode('merge')}
          >
            <Icon
              name="users"
              size="sm"
              color={mode === 'merge' ? '#fff' : theme.colors.text}
            />
            <Text
              style={[
                styles.modeButtonText,
                { color: mode === 'merge' ? '#fff' : theme.colors.text },
              ]}
            >
              Add to Existing
            </Text>
          </TouchableOpacity>
        </View>

        {/* Email Field (always shown) */}
        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Email</Text>
          <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
            <Icon name="mail" size="sm" color={theme.colors.textMuted} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {mode === 'new' ? (
          /* New Contact Form */
          <>
            <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>First Name</Text>
              <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                <Icon name="user" size="sm" color={theme.colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Last Name</Text>
              <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                <Icon name="user" size="sm" color={theme.colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Company</Text>
              <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                <Icon name="briefcase" size="sm" color={theme.colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={company}
                  onChangeText={setCompany}
                  placeholder="Company name (optional)"
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Notes</Text>
              <View style={[styles.inputContainer, styles.notesInput, { borderColor: theme.colors.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Notes (optional)"
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </>
        ) : (
          /* Merge with Existing Contact */
          <View style={[styles.mergeSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Select a contact to add this email to:
            </Text>

            {isSearching && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                  Searching contacts...
                </Text>
              </View>
            )}

            {!isSearching && matchingContacts.length === 0 && email.length > 2 && (
              <View style={styles.emptyContainer}>
                <Icon name="users" size="lg" color={theme.colors.textMuted} />
                <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                  No matching contacts found
                </Text>
              </View>
            )}

            {matchingContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={[
                  styles.contactOption,
                  { borderColor: theme.colors.border },
                  selectedContactId === contact.id && {
                    backgroundColor: theme.colors.primary + '15',
                    borderColor: theme.colors.primary,
                  },
                ]}
                onPress={() => setSelectedContactId(contact.id)}
              >
                <View style={[styles.contactAvatar, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.contactAvatarText}>
                    {getContactInitials(contact)}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: theme.colors.text }]}>
                    {contact.firstName} {contact.lastName}
                  </Text>
                  <Text style={[styles.contactEmails, { color: theme.colors.textMuted }]} numberOfLines={1}>
                    {contact.emails.join(', ')}
                  </Text>
                  {contact.company && (
                    <Text style={[styles.contactCompany, { color: theme.colors.textMuted }]}>
                      {contact.company}
                    </Text>
                  )}
                </View>
                {selectedContactId === contact.id && (
                  <Icon name="check-circle" size="md" color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  modeButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  notesInput: {
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    minHeight: 80,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    padding: 0,
  },
  mergeSection: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.sm,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  contactEmails: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  contactCompany: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
});
