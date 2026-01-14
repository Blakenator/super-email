import { useEffect, useCallback, useRef } from 'react';
import { gql } from '@apollo/client/core';
import { useSubscription } from '@apollo/client/react';
import { useEmailStore, type MailboxUpdate, type CachedEmail } from '../stores/emailStore';
import { useAuth } from '../contexts/AuthContext';

// Notification detail level key in localStorage
const NOTIFICATION_DETAIL_KEY = 'notification_detail_level';
export type NotificationDetailLevel = 'minimal' | 'full';

export function getNotificationDetailLevel(): NotificationDetailLevel {
  try {
    const value = localStorage.getItem(NOTIFICATION_DETAIL_KEY);
    if (value === 'full' || value === 'minimal') return value;
  } catch (e) {
    // Ignore
  }
  return 'minimal'; // Default to minimal
}

export function setNotificationDetailLevel(level: NotificationDetailLevel) {
  try {
    localStorage.setItem(NOTIFICATION_DETAIL_KEY, level);
  } catch (e) {
    // Ignore
  }
}

// GraphQL subscription document
const MAILBOX_UPDATES_SUBSCRIPTION = gql`
  subscription MailboxUpdates {
    mailboxUpdates {
      type
      emailAccountId
      message
      emails {
        id
        messageId
        folder
        fromAddress
        fromName
        subject
        textBody
        receivedAt
        isRead
        isStarred
        emailAccountId
        toAddresses
        ccAddresses
        bccAddresses
        threadId
        threadCount
        tags {
          id
          name
          color
        }
      }
    }
  }
`;

export function useMailboxSubscription() {
  const { token, isAuthenticated } = useAuth();
  const store = useEmailStore;
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstConnectionRef = useRef(true);

  // Handle incoming subscription data
  const handleUpdate = useCallback(
    (update: MailboxUpdate) => {
      console.log('[Subscription] Received update:', update.type, update.message || '');
      store.getState().handleMailboxUpdate(update);

      // Show browser notification for new emails
      if (
        update.type === 'NEW_EMAILS' &&
        update.emails &&
        update.emails.length > 0
      ) {
        showNewEmailNotification(update.emails);
      }
    },
    [store],
  );

  // Use Apollo's subscription hook - only subscribe when authenticated
  const { data, loading, error } = useSubscription(MAILBOX_UPDATES_SUBSCRIPTION, {
    skip: !isAuthenticated || !token,
    shouldResubscribe: true, // Automatically resubscribe on connection loss
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.mailboxUpdates) {
        handleUpdate(subscriptionData.data.mailboxUpdates as MailboxUpdate);
      }
    },
    onComplete: () => {
      console.log('[Subscription] Completed - will attempt to reconnect');
      store.getState().setConnectionStatus('disconnected');
      store.getState().setSubscriptionActive(false);
    },
    onError: (err) => {
      console.error('[Subscription] Error:', err);
      store.getState().setSubscriptionError(err.message);
      store.getState().setConnectionStatus('error');
    },
  });

  // Update connection status based on subscription state
  useEffect(() => {
    if (!isAuthenticated || !token) {
      store.getState().setConnectionStatus('disconnected');
      store.getState().setSubscriptionActive(false);
      return;
    }

    if (loading) {
      store.getState().setConnectionStatus('connecting');
      if (isFirstConnectionRef.current) {
        console.log('[Subscription] Initial connection attempt...');
        isFirstConnectionRef.current = false;
      }
    } else if (error) {
      store.getState().setConnectionStatus('error');
      store.getState().setSubscriptionError(error.message);
    } else if (data) {
      store.getState().setConnectionStatus('connected');
      store.getState().setSubscriptionActive(true);
      store.getState().setSubscriptionError(null);
    }
  }, [isAuthenticated, token, loading, error, data, store]);

  // Handle tab close - attempt to clean up subscription
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('[Subscription] Tab closing, cleaning up...');
      store.getState().releaseTabLock();
      store.getState().setSubscriptionActive(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('[Subscription] Tab hidden');
      } else {
        console.log('[Subscription] Tab visible');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [store]);

  // Return current state for components that need it
  const connectionStatus = useEmailStore((state) => state.connectionStatus);
  const subscriptionError = useEmailStore((state) => state.subscriptionError);
  const isSubscriptionActive = useEmailStore(
    (state) => state.isSubscriptionActive,
  );

  return {
    isActive: isSubscriptionActive,
    connectionStatus,
    error: subscriptionError,
    loading,
  };
}

// Show browser notification for new emails
function showNewEmailNotification(emails: CachedEmail[]) {
  if (!('Notification' in window)) return;
  if (document.visibilityState === 'visible') return;
  if (Notification.permission !== 'granted') return;

  const detailLevel = getNotificationDetailLevel();
  const count = emails.length;

  if (detailLevel === 'full' && count === 1) {
    // Show full details for single email
    const email = emails[0];
    new Notification(`New Email from ${email.fromName || email.fromAddress}`, {
      body: email.subject || '(No Subject)',
      icon: '/icon-192x192.svg',
      tag: `new-email-${email.id}`,
    });
  } else {
    // Minimal notification
    new Notification('New Email', {
      body:
        count === 1 ? 'You have 1 new email' : `You have ${count} new emails`,
      icon: '/icon-192x192.svg',
      tag: 'new-email',
    });
  }
}
