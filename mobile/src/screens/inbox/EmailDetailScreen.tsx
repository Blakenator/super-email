/**
 * Email Detail Screen
 * Displays email content with HTML support and actions
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Modal,
  Pressable,
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
import { useAuthStore } from '../../stores/authStore';

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
      threadId
      threadCount
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

const GET_EMAILS_BY_THREAD_QUERY = gql`
  query GetEmailsByThread($threadId: String!) {
    getEmailsByThread(threadId: $threadId) {
      id
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
      emailAccountId
      hasAttachments
      attachmentCount
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
  threadId?: string | null;
  threadCount?: number | null;
  tags: Array<{ id: string; name: string; color: string }>;
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }>;
}

interface ThreadEmail {
  id: string;
  messageId: string;
  folder: string;
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
  emailAccountId: string;
  hasAttachments: boolean;
  attachmentCount: number;
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
  onReplyAll: (replyTo: {
    emailId: string;
    toAddresses: string[];
    ccAddresses?: string[];
    subject: string;
    htmlBody?: string;
  }) => void;
  onForward: (forward: {
    emailId: string;
    subject: string;
    htmlBody?: string;
  }) => void;
  onArchive: (emailId: string) => void;
  onDelete: (emailId: string) => void;
  onAddContact: (email: string, name?: string) => void;
}

export function EmailDetailScreen({
  onReply,
  onReplyAll,
  onForward,
  onArchive,
  onDelete,
  onAddContact,
}: EmailDetailScreenProps) {
  const theme = useTheme();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { emailId } = route.params as { emailId: string };
  const { user } = useAuthStore();

  const [email, setEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webViewHeight, setWebViewHeight] = useState(300);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  // Image blocking state
  const [showImagesForThisEmail, setShowImagesForThisEmail] = useState(false);
  const blockExternalImages = user?.blockExternalImages ?? false;
  const shouldBlockImages = blockExternalImages && !showImagesForThisEmail;
  
  // Thread state
  const [threadEmails, setThreadEmails] = useState<ThreadEmail[]>([]);
  const [expandedThreadEmails, setExpandedThreadEmails] = useState<Set<string>>(new Set());
  const [threadWebViewHeights, setThreadWebViewHeights] = useState<Record<string, number>>({});
  const hasThread = threadEmails.length > 1;

  useEffect(() => {
    loadEmail();
    // Reset image blocking state when email changes
    setShowImagesForThisEmail(false);
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
        const emailData = data.getEmail;
        setEmail(emailData);
        
        // If email has a thread with multiple messages, fetch thread emails
        if (emailData.threadId && (emailData.threadCount ?? 1) > 1) {
          try {
            const { data: threadData } = await apolloClient.query({
              query: GET_EMAILS_BY_THREAD_QUERY,
              variables: { threadId: emailData.threadId },
              fetchPolicy: 'network-only',
            });
            
            if (threadData?.getEmailsByThread) {
              setThreadEmails(threadData.getEmailsByThread);
              // Auto-expand the current email
              setExpandedThreadEmails(new Set([emailId]));
            }
          } catch (threadErr) {
            console.error('Error loading thread emails:', threadErr);
            // Continue without thread - not a fatal error
          }
        } else {
          setThreadEmails([]);
          setExpandedThreadEmails(new Set());
        }
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

  const handleReplyAll = useCallback(() => {
    if (!email) return;
    
    // Get current user's email to filter it out
    const currentUserEmail = user?.email?.toLowerCase();
    
    // Reply All: To = original sender, CC = all other recipients (excluding ourselves)
    const allToRecipients = [email.fromAddress, ...email.toAddresses];
    const allCcRecipients = email.ccAddresses ?? [];
    
    // Filter out the current user's email from all recipients
    const filteredTo = allToRecipients.filter(
      addr => addr.toLowerCase() !== currentUserEmail
    );
    const filteredCc = allCcRecipients.filter(
      addr => addr.toLowerCase() !== currentUserEmail
    );
    
    onReplyAll({
      emailId: email.id,
      toAddresses: filteredTo.length > 0 ? filteredTo : [email.fromAddress],
      ccAddresses: filteredCc.length > 0 ? filteredCc : undefined,
      subject: email.subject,
      htmlBody: email.htmlBody ?? undefined,
    });
  }, [email, onReplyAll, user?.email]);

  const handleForward = useCallback(() => {
    if (!email) return;
    onForward({
      emailId: email.id,
      subject: email.subject,
      htmlBody: email.htmlBody ?? undefined,
    });
  }, [email, onForward]);

  const handleArchive = useCallback(() => {
    if (!email) return;
    onArchive(email.id);
  }, [email, onArchive]);

  const handleDelete = useCallback(() => {
    if (!email) return;
    Alert.alert(
      'Delete Email',
      'Are you sure you want to delete this email?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(email.id),
        },
      ]
    );
  }, [email, onDelete]);

  const handleToggleMenu = useCallback(() => {
    setShowMoreMenu(!showMoreMenu);
  }, [showMoreMenu]);

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

  // Helper function to block external images in HTML
  const blockExternalImagesInHtml = (htmlContent: string): string => {
    // Block img src (except data: URIs)
    let result = htmlContent.replace(
      /<img([^>]*)\ssrc=["'](?!data:)([^"']+)["']([^>]*)>/gi,
      '<img$1 data-blocked-src="$2" alt="[Image blocked]"$3>'
    );
    
    // Block background-image in inline styles
    result = result.replace(
      /background(-image)?\s*:\s*url\((?!["']?data:)([^)]+)\)/gi,
      ''
    );
    
    // Block video poster and src
    result = result.replace(
      /<video([^>]*)\s(src|poster)=["'](?!data:)([^"']+)["']([^>]*)>/gi,
      '<video$1 data-blocked-$2="$3"$4>'
    );
    
    return result;
  };

  // Toggle thread email expansion
  const toggleThreadEmail = useCallback((threadEmailId: string) => {
    setExpandedThreadEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadEmailId)) {
        newSet.delete(threadEmailId);
      } else {
        newSet.add(threadEmailId);
      }
      return newSet;
    });
  }, []);

  // Generate HTML content for WebView using shared styles
  const getHtmlContent = (emailData: Email | ThreadEmail, messageId?: string) => {
    if (!emailData) return '';

    const isDark = theme.colors.background === '#121212';
    let content =
      emailData.htmlBody ||
      `<pre style="white-space: pre-wrap; font-family: inherit;">${emailData.textBody || ''}</pre>`;

    // Block external images if setting is enabled
    if (shouldBlockImages) {
      content = blockExternalImagesInHtml(content);
    }

    const html = wrapEmailHtml(content, {
      isDarkMode: isDark,
      backgroundColor: theme.colors.background,
      textColor: theme.colors.text,
      linkColor: theme.colors.primary,
      borderColor: theme.colors.border,
      mutedColor: theme.colors.textMuted,
    });

    // Add height reporting script with message ID for thread emails
    const msgIdStr = messageId || 'main';
    return html.replace(
      '</body>',
      `<script>
        window.onload = function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'height',
            id: '${msgIdStr}',
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
        const height = Math.min(data.height + 20, 2000);
        if (data.id === 'main') {
          setWebViewHeight(height);
        } else if (data.id) {
          setThreadWebViewHeights(prev => ({ ...prev, [data.id]: height }));
        }
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
        {/* Subject with Thread Count */}
        <View style={styles.subjectRow}>
          <Text style={[styles.subject, { color: theme.colors.text }]}>
            {email.subject || '(No Subject)'}
          </Text>
          {(email.threadCount ?? 1) > 1 && (
            <View style={[styles.threadCountBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.threadCountText, { color: theme.colors.textInverse }]}>
                {email.threadCount}
              </Text>
            </View>
          )}
        </View>

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

        {/* Show blocked images button */}
        {shouldBlockImages && (
          <TouchableOpacity
            style={[styles.showImagesButton, { backgroundColor: theme.colors.warning + '20', borderColor: theme.colors.warning }]}
            onPress={() => setShowImagesForThisEmail(true)}
          >
            <Icon name="image" size="sm" color={theme.colors.warning} />
            <Text style={[styles.showImagesButtonText, { color: theme.colors.warning }]}>
              Show blocked images
            </Text>
          </TouchableOpacity>
        )}

        {/* Thread View or Single Email Body */}
        {hasThread ? (
          /* Thread View */
          <View style={styles.threadContainer}>
            <View style={[styles.threadHeader, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.threadTitle, { color: theme.colors.text }]}>
                {threadEmails.length} messages in this thread
              </Text>
            </View>
            {threadEmails.map((threadEmail) => {
              const isExpanded = expandedThreadEmails.has(threadEmail.id);
              const isCurrentEmail = threadEmail.id === emailId;
              const threadEmailHeight = threadWebViewHeights[threadEmail.id] || 300;

              return (
                <View
                  key={threadEmail.id}
                  style={[
                    styles.threadEmail,
                    { backgroundColor: theme.colors.surface },
                    isCurrentEmail && { borderLeftColor: theme.colors.primary, borderLeftWidth: 3 },
                  ]}
                >
                  {/* Thread Email Header */}
                  <TouchableOpacity
                    style={styles.threadEmailHeader}
                    onPress={() => toggleThreadEmail(threadEmail.id)}
                  >
                    <View style={[styles.threadAvatarSmall, { backgroundColor: theme.colors.secondary }]}>
                      <Text style={[styles.threadAvatarText, { color: theme.colors.textInverse }]}>
                        {(threadEmail.fromName || threadEmail.fromAddress)[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.threadEmailMeta}>
                      <View style={styles.threadEmailTop}>
                        <Text style={[styles.threadSenderName, { color: theme.colors.text }]} numberOfLines={1}>
                          {threadEmail.fromName || threadEmail.fromAddress.split('@')[0]}
                        </Text>
                        {isCurrentEmail && (
                          <View style={[styles.currentBadge, { backgroundColor: theme.colors.primary }]}>
                            <Text style={[styles.currentBadgeText, { color: theme.colors.textInverse }]}>Current</Text>
                          </View>
                        )}
                      </View>
                      {!isExpanded && (
                        <Text style={[styles.threadPreview, { color: theme.colors.textMuted }]} numberOfLines={1}>
                          {threadEmail.textBody?.substring(0, 80).replace(/\n/g, ' ') || '(No content)'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.threadEmailRight}>
                      <Text style={[styles.threadDate, { color: theme.colors.textMuted }]}>
                        {formatDate(threadEmail.receivedAt)}
                      </Text>
                      <Icon
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size="sm"
                        color={theme.colors.textMuted}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Thread Email Body (when expanded) */}
                  {isExpanded && (
                    <View style={styles.threadEmailBody}>
                      <Text style={[styles.threadRecipients, { color: theme.colors.textMuted }]}>
                        To: {threadEmail.toAddresses.join(', ')}
                      </Text>
                      <WebView
                        source={{ html: getHtmlContent(threadEmail, threadEmail.id) }}
                        style={{
                          height: Math.max(threadEmailHeight, 200),
                          width: width - SPACING.md * 2 - SPACING.sm * 2,
                        }}
                        scrollEnabled={false}
                        nestedScrollEnabled={false}
                        onMessage={handleWebViewMessage}
                        originWhitelist={['*']}
                        javaScriptEnabled
                        showsVerticalScrollIndicator={false}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          /* Single Email Body */
          <View
            style={[
              styles.bodyContainer,
              { backgroundColor: theme.colors.surface, minHeight: 300 },
            ]}
          >
            <WebView
              source={{ html: getHtmlContent(email, 'main') }}
              style={{
                height: Math.max(webViewHeight, 300),
                width: width - SPACING.md * 2 - 2,
              }}
              scrollEnabled={false}
              nestedScrollEnabled={false}
              onMessage={handleWebViewMessage}
              originWhitelist={['*']}
              javaScriptEnabled
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
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
        <TouchableOpacity style={styles.actionButton} onPress={handleReplyAll}>
          <Icon name="reply-all" size="md" color={theme.colors.text} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
            Reply All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleForward}>
          <Icon name="forward" size="md" color={theme.colors.text} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
            Forward
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleArchive}>
          <Icon name="archive" size="md" color={theme.colors.text} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
            Archive
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleToggleMenu}>
          <Icon name="more-vertical" size="md" color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* More Menu Modal - positioned above the action bar */}
      <Modal
        visible={showMoreMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowMoreMenu(false)}
        >
          <View 
            style={[
              styles.moreMenuModal, 
              { 
                backgroundColor: theme.colors.surface,
                // Position above the action bar
                position: 'absolute',
                bottom: Math.max(insets.bottom, SPACING.sm) + 60, // Action bar height + padding
                right: SPACING.md,
              }
            ]}
          >
            <TouchableOpacity
              style={[styles.moreMenuItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                setShowMoreMenu(false);
                handleDelete();
              }}
            >
              <Icon name="trash-2" size="md" color={theme.colors.error} />
              <Text style={[styles.moreMenuItemText, { color: theme.colors.error }]}>
                Delete Email
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  moreMenuModal: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  moreMenuItemText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  // Subject row with thread count
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  threadCountBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    minWidth: 24,
    alignItems: 'center',
  },
  threadCountText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  // Show images button
  showImagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  showImagesButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  // Thread container
  threadContainer: {
    gap: SPACING.sm,
  },
  threadHeader: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  threadTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  threadEmail: {
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  threadEmailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  threadAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadAvatarText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  threadEmailMeta: {
    flex: 1,
  },
  threadEmailTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  threadSenderName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  currentBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  currentBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  threadPreview: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  threadEmailRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  threadDate: {
    fontSize: FONT_SIZE.xs,
  },
  threadEmailBody: {
    padding: SPACING.sm,
    paddingTop: 0,
  },
  threadRecipients: {
    fontSize: FONT_SIZE.xs,
    marginBottom: SPACING.xs,
  },
});
