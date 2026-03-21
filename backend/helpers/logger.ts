import { config } from '../config/env.js';
import {
  getActiveTraceContext,
  getRequestContext,
} from './request-context.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = LOG_LEVELS[config.logLevel as LogLevel] ?? LOG_LEVELS.info;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= currentLogLevel;
}

function safeStringify(data: unknown): string {
  try {
    return JSON.stringify(data);
  } catch {
    // Handle circular references or other stringify failures
    if (data instanceof Error) {
      return JSON.stringify({ message: data.message, stack: data.stack });
    }
    return String(data);
  }
}

function formatCorrelationContext(): string {
  const requestContext = getRequestContext();
  const traceContext = getActiveTraceContext();
  const parts: string[] = [];

  if (requestContext?.requestId) {
    parts.push(`requestId=${requestContext.requestId}`);
  }
  if (traceContext.traceId) {
    parts.push(`traceId=${traceContext.traceId}`);
  }
  if (traceContext.spanId) {
    parts.push(`spanId=${traceContext.spanId}`);
  }

  return parts.length > 0 ? ` [${parts.join(' ')}]` : '';
}

function formatMessage(level: LogLevel, context: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]${formatCorrelationContext()}`;
  
  if (data !== undefined) {
    return `${prefix} ${message} ${safeStringify(data)}`;
  }
  return `${prefix} ${message}`;
}

export const logger = {
  debug(context: string, message: string, data?: unknown): void {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', context, message, data));
    }
  },

  info(context: string, message: string, data?: unknown): void {
    if (shouldLog('info')) {
      console.log(formatMessage('info', context, message, data));
    }
  },

  warn(context: string, message: string, data?: unknown): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', context, message, data));
    }
  },

  error(context: string, message: string, data?: unknown): void {
    if (shouldLog('error')) {
      console.error(formatMessage('error', context, message, data));
    }
  },

  // Specialized logging for GraphQL requests
  request(operationName: string | undefined, variables?: unknown): void {
    if (shouldLog('debug')) {
      logger.debug('GraphQL', `→ ${operationName || 'anonymous'}`, variables);
    }
  },

  response(operationName: string | undefined, durationMs: number, error?: unknown): void {
    if (error) {
      logger.error('GraphQL', `← ${operationName || 'anonymous'} (${durationMs}ms)`, error);
    } else if (shouldLog('debug')) {
      logger.debug('GraphQL', `← ${operationName || 'anonymous'} (${durationMs}ms)`);
    }
  },
};
