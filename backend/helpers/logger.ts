/**
 * Simple logging utility with timestamps and context
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_COLORS = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m',
};

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: LogLevel, context: string, message: string, ...args: unknown[]): string {
  const color = LOG_COLORS[level];
  const reset = LOG_COLORS.reset;
  const levelStr = level.toUpperCase().padEnd(5);
  return `${color}[${formatTimestamp()}] [${levelStr}] [${context}]${reset} ${message}`;
}

export const logger = {
  debug(context: string, message: string, ...args: unknown[]) {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(formatMessage('debug', context, message), ...args);
    }
  },

  info(context: string, message: string, ...args: unknown[]) {
    console.info(formatMessage('info', context, message), ...args);
  },

  warn(context: string, message: string, ...args: unknown[]) {
    console.warn(formatMessage('warn', context, message), ...args);
  },

  error(context: string, message: string, ...args: unknown[]) {
    console.error(formatMessage('error', context, message), ...args);
  },

  /**
   * Log an incoming GraphQL request
   */
  request(operationName: string | undefined, variables?: unknown) {
    const varStr = variables ? ` vars=${JSON.stringify(variables).substring(0, 200)}` : '';
    this.info('GraphQL', `→ ${operationName || 'anonymous'}${varStr}`);
  },

  /**
   * Log a completed GraphQL request with timing
   */
  response(operationName: string | undefined, durationMs: number, error?: Error) {
    if (error) {
      this.error('GraphQL', `✗ ${operationName || 'anonymous'} failed in ${durationMs}ms: ${error.message}`);
    } else {
      this.info('GraphQL', `✓ ${operationName || 'anonymous'} completed in ${durationMs}ms`);
    }
  },
};
