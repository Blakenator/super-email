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
import { useTheme } from '../../theme';
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
              <Text style={{ color: theme.colors.textInverse, fontSize: 12 }}>✓</Text>
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
              <Text style={styles.attachmentIcon}>📎</Text>
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
        <Text style={[styles.star, { opacity: email.isStarred ? 1 : 0.3 }]}>
          {email.isStarred ? '⭐' : '☆'}
        </Text>
      </TouchableOpacity>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  checkbox: {
    marginRight: 12,
    paddingTop: 4,
  },
  checkboxInner: {
    width: 22,
    height: 22,
    borderRadius: 4,
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
    marginBottom: 4,
  },
  sender: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attachmentIcon: {
    fontSize: 12,
  },
  date: {
    fontSize: 12,
  },
  subject: {
    fontSize: 14,
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  starButton: {
    padding: 4,
    marginLeft: 8,
  },
  star: {
    fontSize: 20,
  },
});
