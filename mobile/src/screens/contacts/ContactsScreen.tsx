/**
 * Contacts Screen
 * Displays and manages contacts
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme, sharedStyles, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';
import { Icon, useSafeInsets } from '../../components/ui';

const GET_CONTACTS_QUERY = gql`
  query GetContacts {
    getContacts {
      id
      email
      name
      firstName
      lastName
      company
      phone
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

interface Contact {
  id: string;
  email?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  phone?: string | null;
  isAutoCreated: boolean;
  emails: Array<{
    id: string;
    email: string;
    isPrimary: boolean;
    label?: string | null;
  }>;
}

interface ContactsScreenProps {
  onContactPress: (contactId: string) => void;
  onAddContact: () => void;
}

export function ContactsScreen({ onContactPress, onAddContact }: ContactsScreenProps) {
  const theme = useTheme();
  const { top: topInset, bottom: bottomInset } = useSafeInsets(['top', 'bottom']);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fetchContacts = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_CONTACTS_QUERY,
        fetchPolicy: 'network-only',
      });
      
      setContacts(data?.getContacts ?? []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchContacts();
    setIsRefreshing(false);
  };
  
  const handleDeleteContact = (contact: Contact) => {
    const displayName = getDisplayName(contact);
    
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${displayName}?`,
      [
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
              setContacts((prev) => prev.filter((c) => c.id !== contact.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };
  
  const getDisplayName = (contact: Contact): string => {
    if (contact.name) return contact.name;
    if (contact.firstName || contact.lastName) {
      return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
    }
    return contact.emails[0]?.email || contact.email || 'Unknown';
  };
  
  const getInitials = (contact: Contact): string => {
    const name = getDisplayName(contact);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const filteredContacts = searchQuery
    ? contacts.filter((c) => {
        const query = searchQuery.toLowerCase();
        return (
          c.name?.toLowerCase().includes(query) ||
          c.firstName?.toLowerCase().includes(query) ||
          c.lastName?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.emails?.some((e) => e.email.toLowerCase().includes(query)) ||
          c.company?.toLowerCase().includes(query)
        );
      })
    : contacts;
  
  const renderContact = ({ item }: { item: Contact }) => {
    const displayName = getDisplayName(item);
    const primaryEmail = item.emails.find((e) => e.isPrimary)?.email || item.email;
    
    return (
      <TouchableOpacity
        onPress={() => onContactPress(item.id)}
        onLongPress={() => handleDeleteContact(item)}
        style={[
          styles.contactCard,
          { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
        ]}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: theme.colors.primary + '20' },
          ]}
        >
          <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
            {getInitials(item)}
          </Text>
        </View>
        
        <View style={styles.contactInfo}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.contactName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {item.isAutoCreated && (
              <View
                style={[
                  styles.autoBadge,
                  { backgroundColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[styles.autoBadgeText, { color: theme.colors.textMuted }]}
                >
                  Auto
                </Text>
              </View>
            )}
          </View>
          
          {primaryEmail && (
            <Text
              style={[styles.contactEmail, { color: theme.colors.textMuted }]}
              numberOfLines={1}
            >
              {primaryEmail}
            </Text>
          )}
          
          {item.company && (
            <View style={styles.companyRow}>
              <Icon name="globe" size="xs" color={theme.colors.textMuted} />
              <Text
                style={[styles.contactCompany, { color: theme.colors.textMuted }]}
                numberOfLines={1}
              >
                {item.company}
              </Text>
            </View>
          )}
        </View>
        
        <Icon name="chevron-right" size="md" color={theme.colors.textMuted} />
      </TouchableOpacity>
    );
  };
  
  const renderEmptyState = () => (
    <View style={sharedStyles.emptyContainer}>
      <Icon name="users" size="xl" color={theme.colors.textMuted} />
      <Text style={[sharedStyles.emptyTitle, { color: theme.colors.text }]}>
        {searchQuery ? 'No contacts found' : 'No contacts'}
      </Text>
      <Text style={[sharedStyles.emptySubtitle, { color: theme.colors.textMuted }]}>
        {searchQuery
          ? 'Try a different search term'
          : 'Your contacts will appear here'}
      </Text>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border, paddingTop: topInset + SPACING.sm }]}>
        <View
          style={[
            styles.searchInput,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <Icon name="search" size="sm" color={theme.colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search contacts..."
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.searchTextInput, { color: theme.colors.text }]}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size="sm" color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Contact Count */}
      <View style={styles.countContainer}>
        <Text style={[styles.countText, { color: theme.colors.textMuted }]}>
          {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          filteredContacts.length === 0 && styles.listContentEmpty,
          { paddingBottom: Math.max(SPACING.xl + 56, bottomInset + 56 + SPACING.md) }, // Account for FAB
        ]}
      />

      {/* Add Contact FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: Math.max(SPACING.lg, bottomInset + SPACING.sm) }]}
        onPress={onAddContact}
      >
        <Icon name="user-plus" size="lg" color={theme.colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchTextInput: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
  },
  countContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  countText: {
    fontSize: FONT_SIZE.sm,
  },
  listContent: {
    flexGrow: 1,
  },
  listContentEmpty: {
    flex: 1,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  contactName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
  },
  autoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  autoBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  contactEmail: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: SPACING.xs,
  },
  contactCompany: {
    fontSize: FONT_SIZE.sm,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
