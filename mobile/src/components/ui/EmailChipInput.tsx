/**
 * EmailChipInput - Email address input with chip display and contact suggestions
 * Displays email addresses as chips with validation
 * Searches contacts as user types to provide autocomplete suggestions
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { gql, useLazyQuery } from '@apollo/client';
import { useTheme, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon } from './Icon';

const SEARCH_CONTACTS_QUERY = gql`
  query SearchContactsForEmailChip($query: String!) {
    searchContacts(query: $query) {
      id
      email
      name
      firstName
      lastName
      company
      emails {
        id
        email
        isPrimary
        label
      }
    }
  }
`;

interface Contact {
  id: string;
  email?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  emails: Array<{
    id: string;
    email: string;
    isPrimary: boolean;
    label?: string | null;
  }>;
}

interface EmailOption {
  email: string;
  contactId: string;
  contactName: string | null;
  emailLabel: string | null;
  isPrimary: boolean;
}

interface EmailChip {
  value: string;
  label: string;
  isValid: boolean;
  isContact?: boolean;
  contactId?: string;
}

interface EmailChipInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

// Simple email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Parse email string to chips
const parseChips = (value: string): EmailChip[] => {
  if (!value.trim()) return [];

  return value
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0)
    .map((email) => ({
      value: email,
      label: email.split('@')[0] || email,
      isValid: isValidEmail(email),
    }));
};

// Convert chips back to string
const chipsToString = (chips: EmailChip[]): string => {
  return chips.map((c) => c.value).join(', ');
};

export function EmailChipInput({
  value,
  onChange,
  placeholder = 'Enter email addresses...',
  disabled = false,
  label,
}: EmailChipInputProps) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const [searchContacts, { data: searchData, loading: isSearching }] = useLazyQuery(
    SEARCH_CONTACTS_QUERY,
    { fetchPolicy: 'cache-and-network' }
  );

  const chips = parseChips(value);

  // Flatten contacts into individual email options
  const emailOptions = useMemo<EmailOption[]>(() => {
    if (!searchData?.searchContacts) return [];

    const options: EmailOption[] = [];
    const existingEmails = new Set(chips.map(c => c.value.toLowerCase()));

    for (const contact of searchData.searchContacts as Contact[]) {
      // Add all emails from the emails array
      if (contact.emails && contact.emails.length > 0) {
        for (const emailEntry of contact.emails) {
          // Skip already added emails
          if (existingEmails.has(emailEntry.email.toLowerCase())) continue;
          
          options.push({
            email: emailEntry.email,
            contactId: contact.id,
            contactName:
              contact.name ||
              [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
              null,
            emailLabel: emailEntry.label ?? null,
            isPrimary: emailEntry.isPrimary,
          });
        }
      } else if (contact.email) {
        // Skip already added emails
        if (existingEmails.has(contact.email.toLowerCase())) continue;
        
        // Fallback to primary email if emails array is empty
        options.push({
          email: contact.email,
          contactId: contact.id,
          contactName:
            contact.name ||
            [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
            null,
          emailLabel: null,
          isPrimary: true,
        });
      }
    }

    return options;
  }, [searchData, chips]);

  // Search contacts when input changes
  useEffect(() => {
    if (inputValue.length >= 2) {
      searchContacts({ variables: { query: inputValue } });
      setShowSuggestions(true);
      setHighlightedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, [inputValue, searchContacts]);

  const addChip = useCallback(
    (email: string, contactName?: string | null, contactId?: string) => {
      const trimmed = email.trim();
      if (!trimmed) return;

      // Check for duplicates
      const existing = chips.find(
        (c) => c.value.toLowerCase() === trimmed.toLowerCase(),
      );
      if (existing) {
        setInputValue('');
        setShowSuggestions(false);
        return;
      }

      const newChip: EmailChip = {
        value: trimmed,
        label: contactName || trimmed.split('@')[0] || trimmed,
        isValid: isValidEmail(trimmed),
        isContact: !!contactId,
        contactId,
      };
      const newChips = [...chips, newChip];
      onChange(chipsToString(newChips));
      setInputValue('');
      setShowSuggestions(false);
    },
    [chips, onChange],
  );

  const removeChip = useCallback(
    (index: number) => {
      const newChips = chips.filter((_, i) => i !== index);
      onChange(chipsToString(newChips));
    },
    [chips, onChange],
  );

  const handleInputChange = (text: string) => {
    // Check if user typed a comma or space - add chip
    if (text.endsWith(',') || text.endsWith(' ')) {
      const email = text.slice(0, -1).trim();
      if (email && email.includes('@')) {
        addChip(email);
      }
      return;
    }
    setInputValue(text);
  };

  const handleInputSubmit = () => {
    // If suggestions are visible and an option is highlighted, select it
    if (showSuggestions && emailOptions.length > 0) {
      const selected = emailOptions[highlightedIndex];
      if (selected) {
        addChip(selected.email, selected.contactName, selected.contactId);
        return;
      }
    }
    
    if (inputValue.trim() && inputValue.includes('@')) {
      addChip(inputValue);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
      if (inputValue.trim() && inputValue.includes('@')) {
        addChip(inputValue);
      }
    }, 150);
  };

  const handleContainerPress = () => {
    inputRef.current?.focus();
  };

  const handleSuggestionPress = (option: EmailOption) => {
    addChip(option.email, option.contactName, option.contactId);
  };

  const renderSuggestion = ({ item, index }: { item: EmailOption; index: number }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        { backgroundColor: theme.colors.surface },
        index === highlightedIndex && { backgroundColor: theme.colors.primary + '10' },
      ]}
      onPress={() => handleSuggestionPress(item)}
    >
      <View style={[styles.suggestionAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
        <Icon name="user" size="sm" color={theme.colors.primary} />
      </View>
      <View style={styles.suggestionInfo}>
        <Text style={[styles.suggestionName, { color: theme.colors.text }]} numberOfLines={1}>
          {item.contactName || item.email}
          {item.emailLabel && ` (${item.emailLabel})`}
          {item.isPrimary && !item.emailLabel && ' (Primary)'}
        </Text>
        {item.contactName && (
          <Text style={[styles.suggestionEmail, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {item.email}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>
          {label}
        </Text>
      )}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleContainerPress}
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            borderColor: isFocused ? theme.colors.primary : theme.colors.border,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          keyboardShouldPersistTaps="handled"
        >
          {chips.map((chip, index) => (
            <View
              key={`${chip.value}-${index}`}
              style={[
                styles.chip,
                {
                  backgroundColor: chip.isValid
                    ? (chip.isContact ? theme.colors.success + '20' : theme.colors.primary + '20')
                    : theme.colors.error + '20',
                  borderColor: chip.isValid
                    ? (chip.isContact ? theme.colors.success : theme.colors.primary)
                    : theme.colors.error,
                },
              ]}
            >
              {chip.isContact && (
                <Icon
                  name="user"
                  size="xs"
                  color={theme.colors.success}
                />
              )}
              <Text
                style={[
                  styles.chipText,
                  { color: chip.isValid ? (chip.isContact ? theme.colors.success : theme.colors.primary) : theme.colors.error },
                ]}
                numberOfLines={1}
              >
                {chip.label}
              </Text>
              {!disabled && (
                <TouchableOpacity
                  onPress={() => removeChip(index)}
                  hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
                >
                  <Icon
                    name="x"
                    size="xs"
                    color={chip.isValid ? (chip.isContact ? theme.colors.success : theme.colors.primary) : theme.colors.error}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                minWidth: chips.length > 0 ? 100 : 200,
              },
            ]}
            value={inputValue}
            onChangeText={handleInputChange}
            onSubmitEditing={handleInputSubmit}
            onFocus={() => setIsFocused(true)}
            onBlur={handleInputBlur}
            placeholder={chips.length === 0 ? placeholder : ''}
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            editable={!disabled}
          />
        </ScrollView>
      </TouchableOpacity>

      {/* Suggestions Dropdown */}
      {showSuggestions && (isFocused || emailOptions.length > 0) && (
        <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {isSearching && emailOptions.length === 0 ? (
            <View style={styles.suggestionsLoading}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.suggestionsLoadingText, { color: theme.colors.textMuted }]}>
                Searching contacts...
              </Text>
            </View>
          ) : emailOptions.length > 0 ? (
            <FlatList
              data={emailOptions}
              keyExtractor={(item) => `${item.contactId}-${item.email}`}
              renderItem={renderSuggestion}
              keyboardShouldPersistTaps="handled"
              style={styles.suggestionsList}
            />
          ) : inputValue.length >= 2 ? (
            <View style={styles.suggestionsEmpty}>
              <Text style={[styles.suggestionsEmptyText, { color: theme.colors.textMuted }]}>
                No contacts found
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 1,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  container: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    minHeight: 44,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  chipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexGrow: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: SPACING.xs,
    maxWidth: 150,
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    maxHeight: 200,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  suggestionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  suggestionEmail: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  suggestionsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  suggestionsLoadingText: {
    fontSize: FONT_SIZE.sm,
  },
  suggestionsEmpty: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  suggestionsEmptyText: {
    fontSize: FONT_SIZE.sm,
  },
});
