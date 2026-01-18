/**
 * PubSub Unit Tests
 * 
 * Tests the pubsub helper functions.
 */

import { expect } from 'chai';
import { pubSub, MAILBOX_UPDATES, publishMailboxUpdate } from '../../helpers/pubsub.js';

describe('pubsub helpers', function () {
  describe('MAILBOX_UPDATES constant', () => {
    it('should be defined', () => {
      expect(MAILBOX_UPDATES).to.equal('MAILBOX_UPDATES');
    });
  });

  describe('pubSub instance', () => {
    it('should be a PubSub instance with subscribe method', () => {
      expect(pubSub).to.have.property('subscribe');
      expect(typeof pubSub.subscribe).to.equal('function');
    });

    it('should be a PubSub instance with publish method', () => {
      expect(pubSub).to.have.property('publish');
      expect(typeof pubSub.publish).to.equal('function');
    });
  });

  describe('publishMailboxUpdate', () => {
    it('should publish to user-specific topic', async () => {
      const userId = 'test-user-123';
      const event = {
        type: 'NEW_EMAIL' as const,
        emailAccountId: 'account-1',
        emailId: 'email-1',
        timestamp: new Date().toISOString(),
      };

      // Subscribe to the topic first
      let receivedEvent: any = null;
      const subscriptionId = await pubSub.subscribe(
        `${MAILBOX_UPDATES}:${userId}`,
        (payload: any) => {
          receivedEvent = payload;
        }
      );

      // Publish the event
      publishMailboxUpdate(userId, event as any);

      // Wait a bit for async publish
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify event was received
      expect(receivedEvent).to.not.be.null;
      expect(receivedEvent.type).to.equal('NEW_EMAIL');
      expect(receivedEvent.emailAccountId).to.equal('account-1');

      // Cleanup
      await pubSub.unsubscribe(subscriptionId);
    });

    it('should not send to other users', async () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';
      const event = {
        type: 'NEW_EMAIL' as const,
        emailAccountId: 'account-1',
        timestamp: new Date().toISOString(),
      };

      // Subscribe user2
      let user2ReceivedEvent = false;
      const subscriptionId = await pubSub.subscribe(
        `${MAILBOX_UPDATES}:${userId2}`,
        () => {
          user2ReceivedEvent = true;
        }
      );

      // Publish to user1
      publishMailboxUpdate(userId1, event as any);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      // user2 should not receive the event
      expect(user2ReceivedEvent).to.be.false;

      // Cleanup
      await pubSub.unsubscribe(subscriptionId);
    });
  });
});
