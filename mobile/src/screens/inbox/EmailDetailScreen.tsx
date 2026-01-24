/**
 * Email Detail Screen
 * Displays email content with HTML support and actions
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon } from '../../components/ui';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';
import { DateTime } from 'luxon';
import { wrapEmailHtml } from '../../../../common/src/emailHtmlStyles';

const GET_EMAIL_QUERY = gql`
  query GetEmail($input: GetEmailInput!) {
    getEmail(input: $input) {
      id
      emailAccountId
      messageId
      folder
      fromAddress
      fromName
      toAddresses
      ccAddresses
      subject
      textBody
      htmlBody
      receivedAt
      isRead
      isStarred
      hasAttachments
      attachmentCount
      tags {
        id
        name
        color
      }
      attachments {
        id
        filename
        mimeType
        size
      }
    }
  }
`;

interface Email {
  id: string;
  fromAddress: string;
  fromName?: string | null;
  toAddresses: string[];
  ccAddresses?: string[] | null;
  subject: string;
  textBody?: string | null;
  htmlBody?: string | null;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachmentCount: number;
  tags: Array<{ id: string; name: string; color: string }>;
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }>;
}

interface EmailDetailScreenProps {
  onReply: (replyTo: {
    emailId: string;
    toAddress: string;
    subject: string;
    htmlBody?: string;
  }) => void;
  onAddContact: (email: string, name?: string) => void;
}

export function EmailDetailScreen({
  onReply,
  onAddContact,
}: EmailDetailScreenProps) {
  const theme = useTheme();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { emailId } = route.params as { emailId: string };

  const [email, setEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webViewHeight, setWebViewHeight] = useState(300);

  useEffect(() => {
    loadEmail();
  }, [emailId]);

  const loadEmail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, errors } = await apolloClient.query({
        query: GET_EMAIL_QUERY,
        variables: { input: { id: emailId } },
        fetchPolicy: 'network-only',
      });

      if (errors?.length) {
        setError(errors[0].message);
        return;
      }

      if (data?.getEmail) {
        setEmail(data.getEmail);
      } else {
        setError('Email not found');
      }
    } catch (err: any) {
      console.error('Error loading email:', err);
      setError(err.message || 'Failed to load email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = useCallback(() => {
    if (!email) return;
    onReply({
      emailId: email.id,
      toAddress: email.fromAddress,
      subject: email.subject,
      htmlBody: email.htmlBody ?? undefined,
    });
  }, [email, onReply]);

  const handleAddSenderToContacts = useCallback(() => {
    if (!email) return;
    onAddContact(email.fromAddress, email.fromName ?? undefined);
  }, [email, onAddContact]);

  const formatDate = (dateString: string) => {
    const date = DateTime.fromISO(dateString);
    return date.toFormat("EEE, MMM d, yyyy 'at' h:mm a");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Generate HTML content for WebView using shared styles
  const getHtmlContent = () => {
    if (!email) return '';

    const isDark = theme.colors.background === '#121212';
    const content =
      email.htmlBody ||
      `<pre style="white-space: pre-wrap; font-family: inherit;">${email.textBody || ''}</pre>`;

    const html = wrapEmailHtml(content, {
      isDarkMode: isDark,
      backgroundColor: theme.colors.background,
      textColor: theme.colors.text,
      linkColor: theme.colors.primary,
      borderColor: theme.colors.border,
      mutedColor: theme.colors.textMuted,
    });

    // Add height reporting script
    return html.replace(
      '</body>',
      `<script>
        window.onload = function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'height',
            height: document.body.scrollHeight
          }));
        };
      </script></body>`,
    );
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height') {
        setWebViewHeight(Math.min(data.height + 20, 2000));
      }
    } catch (e) {}
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
          Loading email...
        </Text>
      </View>
    );
  }

  if (error || !email) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Icon name="alert-circle" size="xl" color={theme.colors.error} />
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
          Error
        </Text>
        <Text style={[styles.errorText, { color: theme.colors.textMuted }]}>
          {error || 'Email not found'}
        </Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={loadEmail}
        >
          <Text
            style={[
              styles.retryButtonText,
              { color: theme.colors.textInverse },
            ]}
          >
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Subject */}
        <Text style={[styles.subject, { color: theme.colors.text }]}>
          {email.subject || '(No Subject)'}
        </Text>

        {/* Tags */}
        {email.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {email.tags.map((tag) => (
              <View
                key={tag.id}
                style={[styles.tag, { backgroundColor: tag.color + '20' }]}
              >
                <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                <Text style={[styles.tagText, { color: tag.color }]}>
                  {tag.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Sender Info */}
        <TouchableOpacity
          style={[styles.senderCard, { backgroundColor: theme.colors.surface }]}
          onPress={handleAddSenderToContacts}
        >
          <View
            style={[
              styles.senderAvatar,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text
              style={[
                styles.senderAvatarText,
                { color: theme.colors.textInverse },
              ]}
            >
              {(email.fromName || email.fromAddress)[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.senderInfo}>
            <Text style={[styles.senderName, { color: theme.colors.text }]}>
              {email.fromName || email.fromAddress.split('@')[0]}
            </Text>
            <Text
              style={[styles.senderEmail, { color: theme.colors.textMuted }]}
            >
              {email.fromAddress}
            </Text>
            <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
              {formatDate(email.receivedAt)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleAddSenderToContacts}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="user-plus" size="md" color={theme.colors.primary} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Recipients */}
        <View
          style={[
            styles.recipientsCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            style={[styles.recipientLabel, { color: theme.colors.textMuted }]}
          >
            To:
          </Text>
          <Text
            style={[styles.recipientText, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {email.toAddresses.join(', ')}
          </Text>
          {email.ccAddresses && email.ccAddresses.length > 0 && (
            <>
              <Text
                style={[
                  styles.recipientLabel,
                  { color: theme.colors.textMuted, marginTop: SPACING.xs },
                ]}
              >
                Cc:
              </Text>
              <Text
                style={[styles.recipientText, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {email.ccAddresses.join(', ')}
              </Text>
            </>
          )}
        </View>

        {/* Attachments */}
        {email.hasAttachments &&
          email.attachments &&
          email.attachments.length > 0 && (
            <View
              style={[
                styles.attachmentsCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Text
                style={[styles.attachmentsTitle, { color: theme.colors.text }]}
              >
                <Icon
                  name="paperclip"
                  size="sm"
                  color={theme.colors.textMuted}
                />{' '}
                {email.attachmentCount} Attachment
                {email.attachmentCount !== 1 ? 's' : ''}
              </Text>
              {email.attachments.map((attachment) => (
                <View
                  key={attachment.id}
                  style={[
                    styles.attachmentItem,
                    { borderColor: theme.colors.border },
                  ]}
                >
                  <Icon
                    name="file-text"
                    size="md"
                    color={theme.colors.textMuted}
                  />
                  <View style={styles.attachmentInfo}>
                    <Text
                      style={[
                        styles.attachmentName,
                        { color: theme.colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {attachment.filename}
                    </Text>
                    <Text
                      style={[
                        styles.attachmentSize,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      {formatFileSize(attachment.size)}
                    </Text>
                  </View>
                  <Icon
                    name="download"
                    size="md"
                    color={theme.colors.primary}
                  />
                </View>
              ))}
            </View>
          )}

        {/* Email Body */}
        <View
          style={[
            styles.bodyContainer,
            { backgroundColor: theme.colors.surface, minHeight: 300 },
          ]}
        >
          <WebView
            source={{ html: getHtmlContent() }}
            style={{
              height: Math.max(webViewHeight, 300),
              width: width - SPACING.md * 2 - 2,
            }}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            onMessage={handleWebViewMessage}
            originWhitelist={['*']}
            javaScriptEnabled
            showsVerticalScrollIndicator={true}
          />
        </View>
      </ScrollView>

      {/* Action Bar */}
      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, SPACING.sm),
          },
        ]}
      >
        <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
          <Icon name="reply" size="md" color={theme.colors.primary} />
          <Text
            style={[styles.actionButtonText, { color: theme.colors.primary }]}
          >
            Reply
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="reply-all" size="md" color={theme.colors.text} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
            Reply All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="forward" size="md" color={theme.colors.text} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
            Forward
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="trash-2" size="md" color={theme.colors.error} />
          <Text
            style={[styles.actionButtonText, { color: theme.colors.error }]}
          >
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  retryButtonText: {
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
  },
  subject: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
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
  senderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  senderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderAvatarText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  senderEmail: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  dateText: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  recipientsCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  recipientLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  recipientText: {
    fontSize: FONT_SIZE.sm,
  },
  attachmentsCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  attachmentsTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: FONT_SIZE.sm,
  },
  attachmentSize: {
    fontSize: FONT_SIZE.xs,
  },
  bodyContainer: {
    padding: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  actionButtonText: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
});
