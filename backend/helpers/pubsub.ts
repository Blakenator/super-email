import { PubSub } from 'graphql-subscriptions';
import type { MailboxUpdateEvent } from './imap-idle.js';

/**
 * Shared PubSub instance for GraphQL subscriptions
 * Used to broadcast events to all subscribed clients
 */
export const pubSub = new PubSub();

export const MAILBOX_UPDATES = 'MAILBOX_UPDATES';

/**
 * Publish a mailbox update event to all subscribers for a given user
 */
export function publishMailboxUpdate(
  userId: string,
  event: MailboxUpdateEvent,
) {
  // Publish to user-specific topic
  pubSub.publish(`${MAILBOX_UPDATES}:${userId}`, event);
}
