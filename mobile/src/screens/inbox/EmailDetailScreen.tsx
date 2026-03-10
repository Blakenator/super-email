/**
 * Email Detail Screen
 * Displays email content with HTML support and actions
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SectionList,
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
import { viewedEmailCache } from '../../services/emailCache';
import { refreshSession } from '../../services/supabase';
import { secureSet, STORAGE_KEYS } from '../../services/secureStorage';
import type { ViewedEmailData } from '../../services/emailCache';

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
      isUnsubscribed
      unsubscribeUrl
      unsubscribeEmail
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

const UNSUBSCRIBE_MUTATION = gql`
  mutation Unsubscribe($input: UnsubscribeInput!) {
    unsubscribe(input: $input) {
      id
      isUnsubscribed
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
  isUnsubscribed?: boolean;
  unsubscribeUrl?: string | null;
  unsubscribeEmail?: string | null;
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
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  
  // Image blocking state
  const [showImagesForThisEmail, setShowImagesForThisEmail] = useState(false);
  const blockExternalImages = user?.blockExternalImages ?? false;
  const shouldBlockImages = blockExternalImages && !showImagesForThisEmail;
  
  // Thread state
  const [threadEmails, setThreadEmails] = useState<ThreadEmail[]>([]);
  const [expandedThreadEmails, setExpandedThreadEmails] = useState<Set<string>>(new Set());
  const [threadWebViewHeights, setThreadWebViewHeights] = useState<Record<string, number>>({});
  const [threadActionMenuId, setThreadActionMenuId] = useState<string | null>(null);
  

  // Ref for scrolling
  const sectionListRef = useRef<SectionList>(null);
  const hasScrolledRef = useRef(false);

  // Gesture conflict resolution: disable parent scroll during pinch/horizontal gestures
  const [parentScrollEnabled, setParentScrollEnabled] = useState(true);
  const initialTouchRef = useRef<{ x: number; y: number; decided: boolean }>({ x: 0, y: 0, decided: false });

  // Build sections data for SectionList (thread view) - must be before conditional returns
  const threadSections = useMemo(() => {
    return threadEmails
      .filter((threadEmail) => threadEmail && threadEmail.id)
      .map((threadEmail) => ({
        threadEmail,
        data: [{ id: threadEmail.id }],
      }));
  }, [threadEmails]);

  // Find the section index for the current email
  const currentSectionIndex = useMemo(() => {
    return threadSections.findIndex(s => s.threadEmail.id === emailId);
  }, [threadSections, emailId]);

  // Determine if we're in thread view
  const hasThread = threadSections.length > 1;

  useEffect(() => {
    loadEmail();
    // Reset image blocking state when email changes
    setShowImagesForThisEmail(false);
    // Reset scroll tracking
    hasScrolledRef.current = false;
  }, [emailId]);

  // Estimated heights for getItemLayout
  const STICKY_HEADER_HEIGHT = 70;
  const DEFAULT_ITEM_HEIGHT = 100;
  const LIST_HEADER_HEIGHT = 150;
  const RECIPIENTS_HEIGHT = 30;

  // Flat index layout: index 0 = ListHeaderComponent, then 2 entries per
  // section (header + item) since there is no SectionSeparatorComponent.
  const getItemLayout = useCallback((data: any, index: number) => {
    if (index === 0) {
      return { length: LIST_HEADER_HEIGHT, offset: 0, index };
    }

    const adjustedIndex = index - 1;
    const sectionIndex = Math.floor(adjustedIndex / 2);
    const isHeader = adjustedIndex % 2 === 0;

    let offset = LIST_HEADER_HEIGHT;
    for (let i = 0; i < sectionIndex; i++) {
      const section = threadSections[i];
      const bodyHeight = section?.threadEmail?.id
        ? (threadWebViewHeights[section.threadEmail.id] || DEFAULT_ITEM_HEIGHT) + RECIPIENTS_HEIGHT
        : DEFAULT_ITEM_HEIGHT;
      offset += STICKY_HEADER_HEIGHT + bodyHeight;
    }

    if (isHeader) {
      return { length: STICKY_HEADER_HEIGHT, offset, index };
    }

    offset += STICKY_HEADER_HEIGHT;
    const section = threadSections[sectionIndex];
    const length = section?.threadEmail?.id
      ? (threadWebViewHeights[section.threadEmail.id] || DEFAULT_ITEM_HEIGHT) + RECIPIENTS_HEIGHT
      : DEFAULT_ITEM_HEIGHT;
    return { length, offset, index };
  }, [threadSections, threadWebViewHeights]);

  // Scroll to current email section when thread loads and heights are measured
  useEffect(() => {
    // Count how many heights we have for sections before target
    let measuredCount = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      const section = threadSections[i];
      if (section?.threadEmail?.id && threadWebViewHeights[section.threadEmail.id]) {
        measuredCount++;
      }
    }
    const hasEnoughHeights = measuredCount >= currentSectionIndex;
    
    if (
      currentSectionIndex > 0 && 
      !hasScrolledRef.current && 
      threadSections.length > 1 &&
      hasEnoughHeights
    ) {
      hasScrolledRef.current = true;
      
      // Small delay to ensure layout is stable
      setTimeout(() => {
        if (sectionListRef.current) {
          try {
            (sectionListRef.current as any).scrollToLocation({
              sectionIndex: currentSectionIndex,
              itemIndex: 0,
              animated: false,
              viewPosition: 0,
            });
          } catch {
            // Scroll failed, ignore
          }
        }
      }, 100);
    }
  }, [currentSectionIndex, threadSections, threadWebViewHeights]);


  const cacheEmailData = async (emailData: ViewedEmailData) => {
    try {
      await viewedEmailCache.set(emailData.id, emailData);
    } catch {
      // Non-critical — cache write failure shouldn't affect UX
    }
  };

  const cacheThreadEmails = async (threadEmailList: ThreadEmail[]) => {
    try {
      await Promise.all(
        threadEmailList.map(te =>
          viewedEmailCache.set(te.id, te as unknown as ViewedEmailData),
        ),
      );
    } catch {
      // Non-critical
    }
  };

  const loadEmail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Try cache first for instant display (stale-while-revalidate)
      const cached = await viewedEmailCache.get(emailId);
      if (cached) {
        setEmail(cached as unknown as Email);
        setIsLoading(false);
      }

      // 2. Fetch fresh data from network
      const { data, errors } = await apolloClient.query({
        query: GET_EMAIL_QUERY,
        variables: { input: { id: emailId } },
        fetchPolicy: 'network-only',
      });

      if (errors?.length) {
        if (!cached) setError(errors[0].message);
        return;
      }

      if (data?.getEmail) {
        const emailData = data.getEmail;
        setEmail(emailData);
        
        // Cache the viewed email
        cacheEmailData(emailData as ViewedEmailData);

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
              // Auto-expand all thread emails by default
              setExpandedThreadEmails(new Set(threadData.getEmailsByThread.map((e: ThreadEmail) => e.id)));
              
              // Cache all thread sibling emails
              cacheThreadEmails(threadData.getEmailsByThread);
            }
          } catch (threadErr) {
            console.error('Error loading thread emails:', threadErr);
          }
        } else {
          setThreadEmails([]);
          setExpandedThreadEmails(new Set());
        }
      } else if (!cached) {
        setError('Email not found');
      }
    } catch (err: any) {
      console.error('Error loading email:', err);
      const errMsg = err.message || '';
      const isAuthError =
        errMsg.includes('Not authenticated') ||
        errMsg.includes('jwt expired') ||
        errMsg.includes('UNAUTHENTICATED') ||
        errMsg.includes('Authentication required');

      if (isAuthError) {
        try {
          const session = await refreshSession();
          if (session?.access_token) {
            await secureSet(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
            const { data: retryData } = await apolloClient.query({
              query: GET_EMAIL_QUERY,
              variables: { input: { id: emailId } },
              fetchPolicy: 'network-only',
            });
            if (retryData?.getEmail) {
              setEmail(retryData.getEmail);
              cacheEmailData(retryData.getEmail as ViewedEmailData);
              return;
            }
          }
        } catch {
          // Fall through to error display
        }
      }

      if (!email) {
        setError(err.message || 'Failed to load email');
      }
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

  const handleUnsubscribe = useCallback(async () => {
    if (!email) return;
    setUnsubscribing(true);
    try {
      await apolloClient.mutate({
        mutation: UNSUBSCRIBE_MUTATION,
        variables: { input: { emailId: email.id } },
      });
      setEmail((prev) => prev ? { ...prev, isUnsubscribed: true } : prev);
      setShowUnsubscribeModal(false);
      Alert.alert('Success', 'Successfully unsubscribed!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to unsubscribe');
    } finally {
      setUnsubscribing(false);
    }
  }, [email]);

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

  // Helper function to check if an image tag represents a tracking pixel
  const isTrackingPixelTag = (imgTag: string): boolean => {
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    const widthMatch = imgTag.match(/width=["']?(\d+)["']?/i);
    const heightMatch = imgTag.match(/height=["']?(\d+)["']?/i);
    const styleMatch = imgTag.match(/style=["']([^"']+)["']/i);
    
    const src = srcMatch ? srcMatch[1] : '';
    const srcLower = src.toLowerCase();
    
    // Skip data URIs
    if (src.startsWith('data:')) {
      return false;
    }
    
    // Check for explicit small dimensions (< 5px)
    if (widthMatch && parseInt(widthMatch[1], 10) < 5) {
      return true;
    }
    if (heightMatch && parseInt(heightMatch[1], 10) < 5) {
      return true;
    }
    
    // Check inline styles
    if (styleMatch) {
      const style = styleMatch[1].toLowerCase();
      
      // Check for small dimensions in style
      const styleWidthMatch = style.match(/width\s*:\s*(\d+)\s*px/);
      const styleHeightMatch = style.match(/height\s*:\s*(\d+)\s*px/);
      if (styleWidthMatch && parseInt(styleWidthMatch[1], 10) < 5) {
        return true;
      }
      if (styleHeightMatch && parseInt(styleHeightMatch[1], 10) < 5) {
        return true;
      }
      
      // Check for invisible styles
      if (
        style.includes('display:none') ||
        style.includes('display: none') ||
        style.includes('visibility:hidden') ||
        style.includes('visibility: hidden') ||
        style.includes('opacity:0') ||
        style.includes('opacity: 0')
      ) {
        return true;
      }
    }
    
    // Check for common tracking pixel URL patterns
    if (
      srcLower.includes('/pixel') ||
      srcLower.includes('/track') ||
      srcLower.includes('/open') ||
      srcLower.includes('/beacon') ||
      srcLower.includes('1x1') ||
      srcLower.includes('spacer.gif') ||
      srcLower.includes('blank.gif') ||
      srcLower.includes('transparent.gif') ||
      srcLower.includes('/t.gif') ||
      srcLower.includes('/o.gif')
    ) {
      return true;
    }
    
    return false;
  };

  // Helper function to block tracking pixels (always applied)
  const blockTrackingPixels = (htmlContent: string): string => {
    // Find and block tracking pixel images
    return htmlContent.replace(
      /<img[^>]+>/gi,
      (match) => {
        if (isTrackingPixelTag(match)) {
          // Extract src for data attribute and hide the image
          const srcMatch = match.match(/src=["']([^"']+)["']/i);
          const src = srcMatch ? srcMatch[1] : '';
          return `<img data-tracking-blocked="${src}" style="display:none !important" />`;
        }
        return match;
      }
    );
  };

  // Helper function to block external images in HTML
  const blockExternalImagesInHtml = (htmlContent: string): string => {
    // Block img src (except data: URIs and already-hidden tracking pixels)
    let result = htmlContent.replace(
      /<img([^>]*)\ssrc=["'](?!data:)([^"']+)["']([^>]*)>/gi,
      (match, before, src, after) => {
        // Skip if already blocked as tracking pixel
        if (match.includes('data-tracking-blocked')) {
          return match;
        }
        return `<img${before} data-blocked-src="${src}" alt="[Image blocked]"${after}>`;
      }
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

  // Touch handlers to prevent parent ScrollView from interfering with
  // horizontal scroll and pinch-to-zoom gestures inside the WebView.
  const handleBodyTouchStart = useCallback((e: any) => {
    const touches = e.nativeEvent.touches;
    if (touches && touches.length >= 2) {
      initialTouchRef.current.decided = true;
      setParentScrollEnabled(false);
    } else if (touches && touches.length === 1) {
      initialTouchRef.current = { x: touches[0].pageX, y: touches[0].pageY, decided: false };
    }
  }, []);

  const handleBodyTouchMove = useCallback((e: any) => {
    const touches = e.nativeEvent.touches;
    if (!touches) return;
    if (touches.length >= 2 && !initialTouchRef.current.decided) {
      initialTouchRef.current.decided = true;
      setParentScrollEnabled(false);
      return;
    }
    if (touches.length === 1 && !initialTouchRef.current.decided) {
      const dx = Math.abs(touches[0].pageX - initialTouchRef.current.x);
      const dy = Math.abs(touches[0].pageY - initialTouchRef.current.y);
      if (dx > 8 || dy > 8) {
        initialTouchRef.current.decided = true;
        if (dx > dy) {
          setParentScrollEnabled(false);
        }
      }
    }
  }, []);

  const handleBodyTouchEnd = useCallback((e: any) => {
    const touches = e.nativeEvent.touches;
    if (!touches || touches.length === 0) {
      setParentScrollEnabled(true);
      initialTouchRef.current = { x: 0, y: 0, decided: false };
    }
  }, []);

  // Generate HTML content for WebView using shared styles.
  // scrollEnabled={false} on the WebView eliminates dead scroll zones.
  // Horizontal scrolling and pinch-to-zoom are handled in JavaScript/CSS.
  const getHtmlContent = (emailData: Email | ThreadEmail, messageId?: string) => {
    if (!emailData) return '';

    const isDark = theme.colors.background === '#121212';
    let content =
      emailData.htmlBody ||
      `<pre style="white-space: pre-wrap; font-family: inherit;">${emailData.textBody || ''}</pre>`;

    // Always block tracking pixels (invisible/tiny images)
    content = blockTrackingPixels(content);

    // Block external images if setting is enabled
    if (shouldBlockImages) {
      content = blockExternalImagesInHtml(content);
    }

    // Wrap in a scrollable container so horizontal scroll and zoom
    // work even with the native scroll view disabled.
    const wrappedContent =
      '<div id="email-wrapper"><div id="email-content">' +
      content +
      '</div></div>';

    const html = wrapEmailHtml(wrappedContent, {
      isDarkMode: isDark,
      backgroundColor: theme.colors.background,
      textColor: theme.colors.text,
      linkColor: theme.colors.primary,
      borderColor: theme.colors.border,
      mutedColor: theme.colors.textMuted,
    });

    const msgIdStr = messageId || 'main';
    return html.replace(
      '</body>',
      `<style>
        #email-wrapper {
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
          width: 100%;
        }
        #email-content {
          min-width: 100%;
        }
      </style>
      <script>
        var _zoomScale = 1;

        function reportHeight() {
          var wrapper = document.getElementById('email-wrapper');
          var rect = wrapper ? wrapper.getBoundingClientRect() : null;
          var height = rect ? Math.ceil(rect.height) : document.body.scrollHeight;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'height',
            id: '${msgIdStr}',
            height: Math.max(height, 50)
          }));
        }

        (function() {
          var content = document.getElementById('email-content');
          if (!content) return;
          var startDist = 0;
          var startScale = 1;
          var pinching = false;

          function dist(t) {
            return Math.hypot(
              t[0].clientX - t[1].clientX,
              t[0].clientY - t[1].clientY
            );
          }

          document.addEventListener('touchstart', function(e) {
            if (e.touches.length === 2) {
              pinching = true;
              startDist = dist(e.touches);
              startScale = _zoomScale;
              window.ReactNativeWebView.postMessage(JSON.stringify({type: 'scrollLock', locked: true}));
            }
          }, { passive: true });

          document.addEventListener('touchmove', function(e) {
            if (pinching && e.touches.length === 2) {
              e.preventDefault();
              _zoomScale = Math.max(0.1, Math.min(10, startScale * dist(e.touches) / startDist));
              content.style.zoom = _zoomScale;
            }
          }, { passive: false });

          document.addEventListener('touchend', function(e) {
            if (pinching && e.touches.length < 2) {
              pinching = false;
              window.ReactNativeWebView.postMessage(JSON.stringify({type: 'scrollLock', locked: false}));
              setTimeout(reportHeight, 150);
            }
          }, { passive: true });
        })();

        // Detect horizontal scroll intent and request parent scroll lock
        (function() {
          var wrapper = document.getElementById('email-wrapper');
          if (!wrapper) return;
          var startX = 0, startY = 0, decided = false, locked = false;

          wrapper.addEventListener('touchstart', function(e) {
            if (e.touches.length === 1) {
              startX = e.touches[0].clientX;
              startY = e.touches[0].clientY;
              decided = false;
            }
          }, { passive: true });

          wrapper.addEventListener('touchmove', function(e) {
            if (e.touches.length === 1 && !decided) {
              var dx = Math.abs(e.touches[0].clientX - startX);
              var dy = Math.abs(e.touches[0].clientY - startY);
              if (dx > 8 || dy > 8) {
                decided = true;
                if (dx > dy && wrapper.scrollWidth > wrapper.clientWidth) {
                  locked = true;
                  window.ReactNativeWebView.postMessage(JSON.stringify({type: 'scrollLock', locked: true}));
                }
              }
            }
          }, { passive: true });

          document.addEventListener('touchend', function(e) {
            if (e.touches.length === 0 && locked) {
              locked = false;
              decided = false;
              window.ReactNativeWebView.postMessage(JSON.stringify({type: 'scrollLock', locked: false}));
            }
          }, { passive: true });
        })();

        // Report height once on load
        var hasReported = false;
        function reportOnce() {
          if (!hasReported) {
            hasReported = true;
            setTimeout(reportHeight, 100);
          }
        }

        window.onload = reportOnce;

        if (document.readyState === 'complete') {
          reportOnce();
        }
      </script></body>`,
    );
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'scrollLock') {
        setParentScrollEnabled(!data.locked);
      }
      if (data.type === 'height') {
        const height = Math.max(data.height, 50);
        if (data.id === 'main') {
          setWebViewHeight(height);
        } else if (data.id) {
          setThreadWebViewHeights(prev => {
            const currentHeight = prev[data.id];
            if (currentHeight === undefined || Math.abs(currentHeight - height) > 50) {
              return { ...prev, [data.id]: height };
            }
            return prev;
          });
        }
      }
    } catch (e) {}
  };

  // Handle thread email actions
  const handleThreadReply = useCallback((threadEmail: ThreadEmail) => {
    onReply({
      emailId: threadEmail.id,
      toAddress: threadEmail.fromAddress,
      subject: threadEmail.subject,
      htmlBody: threadEmail.htmlBody ?? undefined,
    });
  }, [onReply]);

  const handleThreadReplyAll = useCallback((threadEmail: ThreadEmail) => {
    const currentUserEmail = user?.email?.toLowerCase();
    const allToRecipients = [threadEmail.fromAddress, ...threadEmail.toAddresses];
    const allCcRecipients = threadEmail.ccAddresses ?? [];
    
    const filteredTo = allToRecipients.filter(
      addr => addr.toLowerCase() !== currentUserEmail
    );
    const filteredCc = allCcRecipients.filter(
      addr => addr.toLowerCase() !== currentUserEmail
    );
    
    onReplyAll({
      emailId: threadEmail.id,
      toAddresses: filteredTo.length > 0 ? filteredTo : [threadEmail.fromAddress],
      ccAddresses: filteredCc.length > 0 ? filteredCc : undefined,
      subject: threadEmail.subject,
      htmlBody: threadEmail.htmlBody ?? undefined,
    });
  }, [onReplyAll, user?.email]);

  const handleThreadForward = useCallback((threadEmail: ThreadEmail) => {
    onForward({
      emailId: threadEmail.id,
      subject: threadEmail.subject,
      htmlBody: threadEmail.htmlBody ?? undefined,
    });
  }, [onForward]);

  const handleThreadArchive = useCallback((threadEmail: ThreadEmail) => {
    onArchive(threadEmail.id);
  }, [onArchive]);

  const handleThreadDelete = useCallback((threadEmail: ThreadEmail) => {
    Alert.alert(
      'Delete Email',
      'Are you sure you want to delete this email?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(threadEmail.id),
        },
      ]
    );
  }, [onDelete]);

  // Format short date for thread action bar
  const formatShortDate = (dateString: string) => {
    const date = DateTime.fromISO(dateString);
    const now = DateTime.now();
    
    if (date.hasSame(now, 'day')) {
      return date.toFormat('h:mm a');
    }
    if (date.hasSame(now, 'year')) {
      return date.toFormat('MMM d');
    }
    return date.toFormat('MM/dd/yy');
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

  // Render the header content (shared between single email and thread views)
  const renderHeaderContent = () => (
    <View style={styles.headerContent}>
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

      {/* Unsubscribed banner */}
      {email?.isUnsubscribed && (
        <View style={[styles.unsubscribedBanner, { backgroundColor: theme.colors.success + '20' }]}>
          <Icon name="check-circle" size="sm" color={theme.colors.success} />
          <Text style={[styles.unsubscribedBannerText, { color: theme.colors.success }]}>
            You have unsubscribed from this mailing list.
          </Text>
        </View>
      )}

      {/* Thread count header */}
      {hasThread && (
        <View style={[styles.threadHeader, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.threadTitle, { color: theme.colors.text }]}>
            {threadEmails.length} messages in this thread
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {hasThread ? (
        /* Thread View - Using SectionList for sticky headers */
        <SectionList
          ref={sectionListRef as any}
          sections={threadSections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={true}
          style={styles.scrollView}
          contentContainerStyle={styles.sectionListContent}
          showsVerticalScrollIndicator={true}
          scrollEnabled={parentScrollEnabled}
          // Disable virtualization to ensure all sections are rendered for scroll
          initialNumToRender={50}
          maxToRenderPerBatch={50}
          windowSize={100}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              try {
                const sectionIdx = Math.max(0, Math.floor((info.index - 1) / 2));
                (sectionListRef.current as any)?.scrollToLocation({
                  sectionIndex: sectionIdx,
                  itemIndex: 0,
                  animated: false,
                  viewPosition: 0,
                });
              } catch (e) {}
            }, 300);
          }}
          renderSectionHeader={({ section }) => {
            const threadEmail = section.threadEmail;
            const isExpanded = expandedThreadEmails.has(threadEmail.id);
            const isCurrentEmail = threadEmail.id === emailId;

            return (
              <View
                style={[
                  styles.threadStickyBar,
                  { 
                    backgroundColor: theme.colors.surface,
                    borderBottomColor: theme.colors.border,
                  },
                  isCurrentEmail && styles.threadStickyBarCurrent,
                  isCurrentEmail && { borderLeftColor: theme.colors.primary },
                ]}
              >
                <TouchableOpacity
                  style={styles.threadStickyHeader}
                  onPress={() => toggleThreadEmail(threadEmail.id)}
                >
                  <View style={[styles.threadAvatarSmall, { backgroundColor: isCurrentEmail ? theme.colors.primary : theme.colors.secondary }]}>
                    <Text style={[styles.threadAvatarText, { color: theme.colors.textInverse }]}>
                      {(threadEmail.fromName || threadEmail.fromAddress)[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.threadStickyMeta}>
                    <View style={styles.threadStickyTop}>
                      <Text style={[styles.threadSenderName, { color: theme.colors.text }]} numberOfLines={1}>
                        {threadEmail.fromName || threadEmail.fromAddress.split('@')[0]}
                      </Text>
                      <Text style={[styles.threadStickyDate, { color: theme.colors.textMuted }]}>
                        {formatShortDate(threadEmail.receivedAt)}
                      </Text>
                    </View>
                    <Text style={[styles.threadStickySubject, { color: theme.colors.textMuted }]} numberOfLines={1}>
                      {threadEmail.subject || '(No Subject)'}
                    </Text>
                  </View>
                  <Icon
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size="md"
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
                
                <View style={styles.threadActionRow}>
                  {isCurrentEmail && (
                    <View style={[styles.currentBadge, { backgroundColor: theme.colors.primary }]}>
                      <Text style={[styles.currentBadgeText, { color: theme.colors.textInverse }]}>Current</Text>
                    </View>
                  )}
                  <View style={styles.threadActionSpacer} />
                  <TouchableOpacity 
                    style={styles.threadActionBtn} 
                    onPress={() => handleThreadReply(threadEmail)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="reply" size="md" color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.threadActionBtn} 
                    onPress={() => handleThreadReplyAll(threadEmail)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="reply-all" size="md" color={theme.colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.threadActionBtn} 
                    onPress={() => handleThreadForward(threadEmail)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="forward" size="md" color={theme.colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.threadActionBtn} 
                    onPress={() => handleThreadArchive(threadEmail)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="archive" size="md" color={theme.colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.threadActionBtn} 
                    onPress={() => setThreadActionMenuId(threadEmail.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="more-vertical" size="md" color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          renderItem={({ section }) => {
            const threadEmail = section.threadEmail;
            const isExpanded = expandedThreadEmails.has(threadEmail.id);
            const threadEmailHeight = threadWebViewHeights[threadEmail.id] || 200;

            return (
              <View 
                style={[
                  styles.threadEmailBody, 
                  { backgroundColor: theme.colors.background },
                  !isExpanded && styles.collapsedBody,
                ]}
                onTouchStart={handleBodyTouchStart}
                onTouchMove={handleBodyTouchMove}
                onTouchEnd={handleBodyTouchEnd}
              >
                {isExpanded && (
                  <Text style={[styles.threadRecipients, { color: theme.colors.textMuted }]}>
                    To: {threadEmail.toAddresses.join(', ')}
                    {threadEmail.ccAddresses && threadEmail.ccAddresses.length > 0 && (
                      `  •  Cc: ${threadEmail.ccAddresses.join(', ')}`
                    )}
                  </Text>
                )}
                <WebView
                  source={{ html: getHtmlContent(threadEmail, threadEmail.id) }}
                  style={{
                    height: isExpanded ? threadEmailHeight : 1,
                    width: width - SPACING.md * 2,
                    backgroundColor: 'transparent',
                    opacity: isExpanded ? 1 : 0,
                  }}
                  scrollEnabled={false}
                  onMessage={handleWebViewMessage}
                  originWhitelist={['*']}
                  javaScriptEnabled
                />
              </View>
            );
          }}
          ListHeaderComponent={renderHeaderContent}
        />
      ) : (
        /* Single Email View - ScrollView for full-page vertical scroll */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          scrollEnabled={parentScrollEnabled}
        >
          {renderHeaderContent()}

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
            onTouchStart={handleBodyTouchStart}
            onTouchMove={handleBodyTouchMove}
            onTouchEnd={handleBodyTouchEnd}
          >
            <WebView
              source={{ html: getHtmlContent(email, 'main') }}
              style={{
                height: Math.max(webViewHeight, 300),
                width: width - SPACING.md * 2,
              }}
              scrollEnabled={false}
              onMessage={handleWebViewMessage}
              originWhitelist={['*']}
              javaScriptEnabled
            />
          </View>
        </ScrollView>
      )}

      {/* Action Bar - Only show for single email view (not thread view) */}
      {!hasThread && (
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
      )}

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
            {(email?.unsubscribeUrl || email?.unsubscribeEmail) && !email?.isUnsubscribed && (
              <TouchableOpacity
                style={[styles.moreMenuItem, { borderBottomColor: theme.colors.border }]}
                onPress={() => {
                  setShowMoreMenu(false);
                  setShowUnsubscribeModal(true);
                }}
              >
                <Icon name="bell-off" size="md" color={theme.colors.warning} />
                <Text style={[styles.moreMenuItemText, { color: theme.colors.warning }]}>
                  Unsubscribe
                </Text>
              </TouchableOpacity>
            )}
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

      {/* Thread Email Action Menu Modal */}
      <Modal
        visible={threadActionMenuId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setThreadActionMenuId(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setThreadActionMenuId(null)}
        >
          <View 
            style={[
              styles.moreMenuModal, 
              { 
                backgroundColor: theme.colors.surface,
                position: 'absolute',
                top: 120, // Position below the sticky header area
                right: SPACING.md,
                zIndex: 1000,
              }
            ]}
          >
            <TouchableOpacity
              style={[styles.moreMenuItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                const emailToDelete = threadEmails.find(e => e.id === threadActionMenuId);
                setThreadActionMenuId(null);
                if (emailToDelete) {
                  handleThreadDelete(emailToDelete);
                }
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

      {/* Unsubscribe Modal */}
      <Modal
        visible={showUnsubscribeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnsubscribeModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowUnsubscribeModal(false)}
        >
          <View
            style={[
              styles.unsubscribeModal,
              { backgroundColor: theme.colors.surface },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.unsubscribeTitle, { color: theme.colors.text }]}>
              Unsubscribe
            </Text>
            <Text style={[styles.unsubscribeDescription, { color: theme.colors.textMuted }]}>
              Choose how you want to unsubscribe from this mailing list.
            </Text>

            {email?.unsubscribeUrl && (
              <View style={[styles.unsubscribeOption, { backgroundColor: theme.colors.success + '15', borderColor: theme.colors.success + '40' }]}>
                <Text style={[styles.unsubscribeOptionTitle, { color: theme.colors.text }]}>
                  One-Click Unsubscribe
                </Text>
                <Text style={[styles.unsubscribeOptionDesc, { color: theme.colors.textMuted }]}>
                  Sends an automatic unsubscribe request to the sender.
                </Text>
                <Text style={[styles.unsubscribeOptionUrl, { color: theme.colors.textMuted }]} numberOfLines={2}>
                  {email.unsubscribeUrl}
                </Text>
                <TouchableOpacity
                  style={[styles.unsubscribeOptionBtn, { backgroundColor: theme.colors.success }]}
                  onPress={handleUnsubscribe}
                  disabled={unsubscribing}
                >
                  {unsubscribing ? (
                    <ActivityIndicator size="small" color={theme.colors.textInverse} />
                  ) : (
                    <Text style={[styles.unsubscribeOptionBtnText, { color: theme.colors.textInverse }]}>
                      Unsubscribe via URL
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {email?.unsubscribeEmail && (
              <View style={[styles.unsubscribeOption, { backgroundColor: theme.colors.warning + '15', borderColor: theme.colors.warning + '40' }]}>
                <Text style={[styles.unsubscribeOptionTitle, { color: theme.colors.text }]}>
                  {email.unsubscribeUrl ? 'Alternative: ' : ''}Email-Based Unsubscribe
                </Text>
                <Text style={[styles.unsubscribeOptionDesc, { color: theme.colors.textMuted }]}>
                  Sends an unsubscribe email from your configured send profile to:
                </Text>
                <Text style={[styles.unsubscribeOptionUrl, { color: theme.colors.textMuted }]}>
                  {email.unsubscribeEmail}
                </Text>
                <TouchableOpacity
                  style={[styles.unsubscribeOptionBtn, { backgroundColor: theme.colors.warning }]}
                  onPress={handleUnsubscribe}
                  disabled={unsubscribing}
                >
                  {unsubscribing ? (
                    <ActivityIndicator size="small" color={theme.colors.textInverse} />
                  ) : (
                    <Text style={[styles.unsubscribeOptionBtnText, { color: theme.colors.textInverse }]}>
                      Unsubscribe via Email
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.unsubscribeCloseBtn, { borderColor: theme.colors.border }]}
              onPress={() => setShowUnsubscribeModal(false)}
            >
              <Text style={[styles.unsubscribeCloseBtnText, { color: theme.colors.text }]}>
                Close
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
  sectionListContent: {
    paddingBottom: SPACING.xl,
  },
  headerContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
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
    gap: 0,
  },
  threadHeader: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  threadTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  threadEmailContainer: {
    marginBottom: 0,
  },
  // Sticky action bar for each thread email
  threadStickyBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    // Shadow for sticky effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  threadStickyBarCurrent: {
    borderLeftWidth: 3,
  },
  threadStickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  threadStickyMeta: {
    flex: 1,
  },
  threadStickyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  threadStickySubject: {
    fontSize: FONT_SIZE.xs,
    marginTop: 1,
  },
  threadStickyDate: {
    fontSize: FONT_SIZE.xs,
  },
  threadActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.xs,
  },
  threadActionSpacer: {
    flex: 1,
  },
  threadActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
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
  threadSenderName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    flex: 1,
  },
  currentBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginLeft: 'auto',
  },
  currentBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  threadEmailBody: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  collapsedBody: {
    height: 1,
    overflow: 'hidden',
    paddingTop: 0,
    paddingBottom: 0,
  },
  threadRecipients: {
    fontSize: FONT_SIZE.xs,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  threadSeparator: {
    height: SPACING.md,
  },
  unsubscribedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  unsubscribedBannerText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  unsubscribeModal: {
    margin: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    maxWidth: 400,
    alignSelf: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  unsubscribeTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  unsubscribeDescription: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.md,
  },
  unsubscribeOption: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  unsubscribeOptionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  unsubscribeOptionDesc: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  unsubscribeOptionUrl: {
    fontSize: FONT_SIZE.xs,
    fontFamily: 'monospace',
    marginBottom: SPACING.sm,
  },
  unsubscribeOptionBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  unsubscribeOptionBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  unsubscribeCloseBtn: {
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  unsubscribeCloseBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
});
