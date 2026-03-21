import { AsyncLocalStorage } from 'node:async_hooks';
import { trace } from '@opentelemetry/api';

export interface RequestContextStore {
  requestId?: string;
  method?: string;
  path?: string;
  graphqlOperationName?: string;
  graphqlOperationType?: string;
}

const requestContextStorage = new AsyncLocalStorage<RequestContextStore>();

export function runWithRequestContext<T>(
  context: RequestContextStore,
  callback: () => T,
): T {
  return requestContextStorage.run(context, callback);
}

export function getRequestContext(): RequestContextStore | undefined {
  return requestContextStorage.getStore();
}

export function updateRequestContext(
  context: Partial<RequestContextStore>,
): void {
  const currentContext = requestContextStorage.getStore();
  if (!currentContext) {
    return;
  }

  Object.assign(currentContext, context);
}

export function getActiveTraceContext(): {
  traceId?: string;
  spanId?: string;
} {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) {
    return {};
  }

  const spanContext = activeSpan.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}
