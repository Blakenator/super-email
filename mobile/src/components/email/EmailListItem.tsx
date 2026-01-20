/**
 * Email List Item Component
 * Displays an email in a list with swipe actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useTheme, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon } from '../ui';
import type { Email } from '../../stores/emailStore';
import { DateTime } from 'luxon';

interface EmailListItemProps {
  email: Email;
  onPress: () => void;
  onStarPress: () => void;
  onSelectPress?: () => void;
  isSelected?: boolean;
  showCheckbox?: boolean;
}

export function EmailListItem({
  email,
  onPress,
  onStarPress,
  onSelectPress,
  isSelected = false,
  showCheckbox = false,
}: EmailListItemProps) {
  const theme = useTheme();
  
  const formatDate = (dateString: string) => {
    const date = DateTime.fromISO(dateString);
    const now = DateTime.now();
    
    if (date.hasSame(now, 'day')) {
      return date.toFormat('h:mm a');
    }
    if (date.hasSame(now.minus({ days: 1 }), 'day')) {
      return 'Yesterday';
    }
    if (date.hasSame(now, 'week')) {
      return date.toFormat('EEE');
    }
    if (date.hasSame(now, 'year')) {
      return date.toFormat('MMM d');
    }
    return date.toFormat('MM/dd/yy');
  };
  
  const getSenderDisplay = () => {
    if (email.fromName) {
      return email.fromName;
    }
    // Extract name from email address
    const parts = email.fromAddress.split('@');
    return parts[0];
  };
  
  const getPreview = () => {
    if (email.textBody) {
      return email.textBody.substring(0, 100).replace(/\n/g, ' ');
    }
    return '';
  };
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed
            ? theme.colors.backgroundSecondary
            : email.isRead
              ? theme.colors.background
              : theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      {showCheckbox && (
        <TouchableOpacity
          onPress={onSelectPress}
          style={styles.checkbox}
        >
          <View
            style={[
              styles.checkboxInner,
              {
                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                backgroundColor: isSelected ? theme.colors.primary : 'transparent',
              },
            ]}
          >
            {isSelected && (
              <Icon name="check" size="xs" color="#fff" />
            )}
          </View>
        </TouchableOpacity>
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[
              styles.sender,
              {
                color: theme.colors.text,
                fontWeight: email.isRead ? '400' : '600',
              },
            ]}
            numberOfLines={1}
          >
            {getSenderDisplay()}
          </Text>
          
          <View style={styles.headerRight}>
            {email.hasAttachments && (
              <Icon name="paperclip" size="xs" color={theme.colors.textMuted} />
            )}
            <Text style={[styles.date, { color: theme.colors.textMuted }]}>
              {formatDate(email.receivedAt)}
            </Text>
          </View>
        </View>
        
        <Text
          style={[
            styles.subject,
            {
              color: theme.colors.text,
              fontWeight: email.isRead ? '400' : '500',
            },
          ]}
          numberOfLines={1}
        >
          {email.subject || '(No Subject)'}
        </Text>
        
        <Text
          style={[styles.preview, { color: theme.colors.textMuted }]}
          numberOfLines={1}
        >
          {getPreview()}
        </Text>
        
        {email.tags.length > 0 && (
          <View style={styles.tags}>
            {email.tags.slice(0, 3).map((tag) => (
              <View
                key={tag.id}
                style={[styles.tag, { backgroundColor: tag.color + '20' }]}
              >
                <View
                  style={[styles.tagDot, { backgroundColor: tag.color }]}
                />
                <Text style={[styles.tagText, { color: tag.color }]}>
                  {tag.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
      
      <TouchableOpacity
        onPress={onStarPress}
        style={styles.starButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon
          name="star"
          size="md"
          color={email.isStarred ? theme.colors.starred : theme.colors.border}
        />
      </TouchableOpacity>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    marginRight: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  checkboxInner: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sender: {
    fontSize: FONT_SIZE.md,
    flex: 1,
    marginRight: SPACING.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  date: {
    fontSize: FONT_SIZE.xs,
  },
  subject: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.xs,
  },
  preview: {
    fontSize: FONT_SIZE.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  starButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
});
