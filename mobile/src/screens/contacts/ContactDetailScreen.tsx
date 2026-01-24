/**
 * Contact Detail Screen
 * Displays contact information in read-only mode with option to edit
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon, Button } from '../../components/ui';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';

const GET_CONTACT_QUERY = gql`
  query GetContact($id: String!) {
    getContact(id: $id) {
      id
      email
      name
      firstName
      lastName
      company
      phone
      notes
      isAutoCreated
      createdAt
      emails {
        id
        email
        isPrimary
        label
      }
    }
  }
`;

const UPDATE_CONTACT_MUTATION = gql`
  mutation UpdateContact($input: UpdateContactInput!) {
    updateContact(input: $input) {
      id
      email
      name
      firstName
      lastName
      company
      phone
      notes
      isAutoCreated
      emails {
        id
        email
        isPrimary
        label
      }
    }
  }
`;

const DELETE_CONTACT_MUTATION = gql`
  mutation DeleteContact($id: String!) {
    deleteContact(id: $id)
  }
`;

interface ContactEmail {
  id: string;
  email: string;
  isPrimary: boolean;
  label?: string | null;
}

interface Contact {
  id: string;
  email?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  phone?: string | null;
  notes?: string | null;
  isAutoCreated: boolean;
  createdAt?: string | null;
  emails: ContactEmail[];
}

interface ContactDetailScreenProps {
  onClose: () => void;
  onDeleted?: () => void;
}

export function ContactDetailScreen({ onClose, onDeleted }: ContactDetailScreenProps) {
  const theme = useTheme();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const params = route.params as { contactId: string };

  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [emails, setEmails] = useState<Array<{ email: string; isPrimary: boolean; label: string }>>([]);

  const fetchContact = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_CONTACT_QUERY,
        variables: { id: params.contactId },
        fetchPolicy: 'network-only',
      });

      if (data?.getContact) {
        setContact(data.getContact);
        // Initialize edit form state
        setFirstName(data.getContact.firstName || '');
        setLastName(data.getContact.lastName || '');
        setCompany(data.getContact.company || '');
        setPhone(data.getContact.phone || '');
        setNotes(data.getContact.notes || '');
        setEmails(
          data.getContact.emails.map((e: ContactEmail) => ({
            email: e.email,
            isPrimary: e.isPrimary,
            label: e.label || '',
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching contact:', error);
      Alert.alert('Error', 'Failed to load contact');
    } finally {
      setIsLoading(false);
    }
  }, [params.contactId]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  const getDisplayName = (): string => {
    if (!contact) return '';
    if (contact.name) return contact.name;
    if (contact.firstName || contact.lastName) {
      return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
    }
    return contact.emails[0]?.email || contact.email || 'Unknown';
  };

  const getInitials = (): string => {
    const name = getDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSave = async () => {
    if (!contact) return;

    // Validate at least one email
    const validEmails = emails.filter((e) => e.email.trim());
    if (validEmails.length === 0) {
      Alert.alert('Error', 'At least one email address is required');
      return;
    }

    // Ensure one email is primary
    if (!validEmails.some((e) => e.isPrimary)) {
      validEmails[0].isPrimary = true;
    }

    setIsSaving(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_CONTACT_MUTATION,
        variables: {
          input: {
            id: contact.id,
            firstName: firstName.trim() || undefined,
            lastName: lastName.trim() || undefined,
            company: company.trim() || undefined,
            phone: phone.trim() || undefined,
            notes: notes.trim() || undefined,
            emails: validEmails.map((e) => ({
              email: e.email.trim(),
              isPrimary: e.isPrimary,
              label: e.label.trim() || undefined,
            })),
          },
        },
      });

      if (data?.updateContact) {
        setContact(data.updateContact);
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Error updating contact:', error);
      Alert.alert('Error', error.message || 'Failed to update contact');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!contact) return;

    Alert.alert('Delete Contact', `Are you sure you want to delete ${getDisplayName()}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apolloClient.mutate({
              mutation: DELETE_CONTACT_MUTATION,
              variables: { id: contact.id },
            });
            onDeleted?.();
            onClose();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete contact');
          }
        },
      },
    ]);
  };

  const handleCancelEdit = () => {
    // Reset form state to contact values
    if (contact) {
      setFirstName(contact.firstName || '');
      setLastName(contact.lastName || '');
      setCompany(contact.company || '');
      setPhone(contact.phone || '');
      setNotes(contact.notes || '');
      setEmails(
        contact.emails.map((e) => ({
          email: e.email,
          isPrimary: e.isPrimary,
          label: e.label || '',
        }))
      );
    }
    setIsEditing(false);
  };

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handlePhonePress = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const addEmail = () => {
    setEmails([...emails, { email: '', isPrimary: false, label: '' }]);
  };

  const removeEmail = (index: number) => {
    if (emails.length <= 1) {
      Alert.alert('Error', 'Contact must have at least one email');
      return;
    }
    const newEmails = emails.filter((_, i) => i !== index);
    // If we removed the primary, make the first one primary
    if (emails[index].isPrimary && newEmails.length > 0) {
      newEmails[0].isPrimary = true;
    }
    setEmails(newEmails);
  };

  const setPrimaryEmail = (index: number) => {
    setEmails(
      emails.map((e, i) => ({
        ...e,
        isPrimary: i === index,
      }))
    );
  };

  const updateEmail = (index: number, field: 'email' | 'label', value: string) => {
    setEmails(
      emails.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Icon name="user-x" size="xl" color={theme.colors.textMuted} />
        <Text style={[styles.errorText, { color: theme.colors.textMuted }]}>Contact not found</Text>
        <Button title="Go Back" onPress={onClose} variant="outline" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border, paddingTop: insets.top },
        ]}
      >
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Icon name="arrow-left" size="md" color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isEditing ? 'Edit Contact' : 'Contact'}
        </Text>
        {isEditing ? (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.headerButton}>
              <Text style={[styles.headerActionText, { color: theme.colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={theme.colors.textInverse} />
              ) : (
                <Text style={[styles.saveButtonText, { color: theme.colors.textInverse }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.headerButton}>
            <Icon name="edit-2" size="md" color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(SPACING.xl, insets.bottom + SPACING.md) }]}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.avatarText, { color: theme.colors.textInverse }]}>{getInitials()}</Text>
          </View>
          {!isEditing && (
            <>
              <Text style={[styles.displayName, { color: theme.colors.text }]}>{getDisplayName()}</Text>
              {contact.isAutoCreated && (
                <View style={[styles.autoBadge, { backgroundColor: theme.colors.border }]}>
                  <Text style={[styles.autoBadgeText, { color: theme.colors.textMuted }]}>Auto-created</Text>
                </View>
              )}
            </>
          )}
        </View>

        {isEditing ? (
          /* Edit Mode */
          <>
            {/* Name Fields */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Name</Text>
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>First</Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First name"
                    placeholderTextColor={theme.colors.textMuted}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.nameField}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Last</Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last name"
                    placeholderTextColor={theme.colors.textMuted}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            {/* Email Fields */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Email Addresses</Text>
                <TouchableOpacity onPress={addEmail}>
                  <Icon name="plus-circle" size="md" color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              {emails.map((email, index) => (
                <View key={index} style={styles.emailEditRow}>
                  <TouchableOpacity
                    onPress={() => setPrimaryEmail(index)}
                    style={[
                      styles.primaryToggle,
                      email.isPrimary && { backgroundColor: theme.colors.primary },
                      !email.isPrimary && { borderColor: theme.colors.border },
                    ]}
                  >
                    {email.isPrimary && <Icon name="check" size="xs" color={theme.colors.textInverse} />}
                  </TouchableOpacity>
                  <View style={styles.emailEditFields}>
                    <TextInput
                      style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                      value={email.email}
                      onChangeText={(value) => updateEmail(index, 'email', value)}
                      placeholder="email@example.com"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <TextInput
                      style={[
                        styles.input,
                        styles.labelInput,
                        { color: theme.colors.text, borderColor: theme.colors.border },
                      ]}
                      value={email.label}
                      onChangeText={(value) => updateEmail(index, 'label', value)}
                      placeholder="Label (Work, Personal)"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
                  <TouchableOpacity onPress={() => removeEmail(index)} style={styles.removeButton}>
                    <Icon name="x-circle" size="md" color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Company */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Company</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                value={company}
                onChangeText={setCompany}
                placeholder="Company name"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* Phone */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Phone</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            {/* Notes */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Notes</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.notesInput,
                  { color: theme.colors.text, borderColor: theme.colors.border },
                ]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Delete Button */}
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: theme.colors.error }]}
              onPress={handleDelete}
            >
              <Icon name="trash-2" size="md" color={theme.colors.error} />
              <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>Delete Contact</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Read-only Mode */
          <>
            {/* Email Section */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Email</Text>
              {contact.emails.map((email) => (
                <TouchableOpacity
                  key={email.id}
                  style={styles.infoRow}
                  onPress={() => handleEmailPress(email.email)}
                >
                  <View style={styles.infoContent}>
                    <View style={styles.emailRow}>
                      <Icon name="mail" size="sm" color={theme.colors.primary} />
                      <Text style={[styles.infoValue, { color: theme.colors.primary }]}>{email.email}</Text>
                    </View>
                    <View style={styles.emailMeta}>
                      {email.isPrimary && (
                        <View style={[styles.primaryBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                          <Text style={[styles.primaryBadgeText, { color: theme.colors.primary }]}>Primary</Text>
                        </View>
                      )}
                      {email.label && (
                        <Text style={[styles.emailLabel, { color: theme.colors.textMuted }]}>{email.label}</Text>
                      )}
                    </View>
                  </View>
                  <Icon name="chevron-right" size="sm" color={theme.colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Phone Section */}
            {contact.phone && (
              <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Phone</Text>
                <TouchableOpacity style={styles.infoRow} onPress={() => handlePhonePress(contact.phone!)}>
                  <View style={styles.infoContent}>
                    <View style={styles.emailRow}>
                      <Icon name="phone" size="sm" color={theme.colors.primary} />
                      <Text style={[styles.infoValue, { color: theme.colors.primary }]}>{contact.phone}</Text>
                    </View>
                  </View>
                  <Icon name="chevron-right" size="sm" color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            {/* Company Section */}
            {contact.company && (
              <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Company</Text>
                <View style={styles.infoRow}>
                  <View style={styles.infoContent}>
                    <View style={styles.emailRow}>
                      <Icon name="briefcase" size="sm" color={theme.colors.textMuted} />
                      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{contact.company}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Notes Section */}
            {contact.notes && (
              <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Notes</Text>
                <View style={styles.infoRow}>
                  <View style={styles.infoContent}>
                    <Text style={[styles.notesText, { color: theme.colors.text }]}>{contact.notes}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Actions Section */}
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => contact.emails[0] && handleEmailPress(contact.emails[0].email)}
              >
                <Icon name="mail" size="md" color={theme.colors.textInverse} />
                <Text style={[styles.actionButtonText, { color: theme.colors.textInverse }]}>Send Email</Text>
              </TouchableOpacity>
              {contact.phone && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonOutline, { borderColor: theme.colors.primary }]}
                  onPress={() => handlePhonePress(contact.phone!)}
                >
                  <Icon name="phone" size="md" color={theme.colors.primary} />
                  <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Call</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Created Date */}
            {contact.createdAt && (
              <Text style={[styles.createdText, { color: theme.colors.textMuted }]}>
                Added {new Date(contact.createdAt).toLocaleDateString()}
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    marginTop: SPACING.md,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerActionText: {
    fontSize: FONT_SIZE.md,
  },
  saveButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: SPACING.xl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
  },
  displayName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '600',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  autoBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
  },
  autoBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoContent: {
    flex: 1,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginLeft: 28, // Align with text after icon
    gap: SPACING.sm,
  },
  primaryBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  primaryBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  emailLabel: {
    fontSize: FONT_SIZE.xs,
  },
  infoValue: {
    fontSize: FONT_SIZE.lg,
  },
  notesText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  actionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  createdText: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  // Edit mode styles
  nameRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  nameField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.xs,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  labelInput: {
    marginTop: SPACING.xs,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  emailEditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  primaryToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  emailEditFields: {
    flex: 1,
  },
  removeButton: {
    padding: SPACING.xs,
    marginTop: SPACING.xs,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  deleteButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
