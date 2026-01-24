/**
 * Lambda function to trigger background email sync
 *
 * This Lambda is triggered by an EventBridge scheduled rule (cron)
 * and calls the backend's internal API to trigger the sync cycle.
 */

import type { ScheduledEvent, Context } from 'aws-lambda';

// Environment variables set by the infrastructure
const BACKEND_URL = process.env.BACKEND_URL || '';
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN || '';

interface SyncResult {
  success: boolean;
  checked: number;
  syncsStarted: number;
  errors: string[];
}

/**
 * Lambda handler - called by EventBridge on schedule
 */
export async function handler(
  event: ScheduledEvent,
  context: Context
): Promise<{ statusCode: number; body: string }> {
  console.log('Sync trigger Lambda invoked', {
    eventTime: event.time,
    requestId: context.awsRequestId,
  });

  // Validate configuration
  if (!BACKEND_URL) {
    console.error('BACKEND_URL environment variable is not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Lambda not configured: missing BACKEND_URL' }),
    };
  }

  if (!INTERNAL_API_TOKEN) {
    console.error('INTERNAL_API_TOKEN environment variable is not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Lambda not configured: missing INTERNAL_API_TOKEN' }),
    };
  }

  try {
    // Call the backend's internal sync trigger endpoint
    const response = await fetch(`${BACKEND_URL}/api/internal/trigger-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_API_TOKEN,
      },
    });

    const result: SyncResult = await response.json();

    if (!response.ok) {
      console.error('Backend returned error', {
        status: response.status,
        result,
      });
      return {
        statusCode: response.status,
        body: JSON.stringify(result),
      };
    }

    console.log('Sync trigger successful', {
      checked: result.checked,
      syncsStarted: result.syncsStarted,
      errors: result.errors?.length || 0,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Sync cycle triggered successfully',
        ...result,
      }),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to trigger sync', { error: errorMessage });

    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to trigger sync: ${errorMessage}` }),
    };
  }
}
