import { createHash } from 'node:crypto';
import {
  SpanStatusCode,
  trace,
  type Span,
  type SpanOptions,
} from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import config from '../config/env.js';
import { logger } from './logger.js';

type PyroscopeModule = {
  init: (options: {
    appName: string;
    serverAddress: string;
    basicAuthUser?: string;
    basicAuthPassword?: string;
    tags?: Record<string, string>;
    wall?: {
      collectCpuTime?: boolean;
    };
  }) => void;
  start: () => void;
  wrapWithLabels?: <T>(
    labels: Record<string, string>,
    callback: () => T,
  ) => T;
};

let sdk: NodeSDK | null = null;
let pyroscope: PyroscopeModule | null = null;
let initPromise: Promise<void> | null = null;

function parseHeaderString(headers: string): Record<string, string> {
  return headers
    .split(',')
    .map((header) => header.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, header) => {
      const separatorIndex = header.indexOf('=');
      if (separatorIndex === -1) {
        return acc;
      }

      const key = header.slice(0, separatorIndex).trim();
      const value = header.slice(separatorIndex + 1).trim();
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {});
}

export function getTracer() {
  return trace.getTracer(config.observability.serviceName);
}

export function setActiveSpanAttributes(
  attributes: Record<string, string | number | boolean | undefined>,
): void {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) {
    return;
  }

  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      activeSpan.setAttribute(key, value);
    }
  }
}

export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T> | T,
  options: SpanOptions = {},
): Promise<T> {
  const tracer = getTracer();

  return tracer.startActiveSpan(name, options, async (span) => {
    try {
      return await fn(span);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw err;
    } finally {
      span.end();
    }
  });
}

export async function withObservedSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T> | T,
  options: SpanOptions = {},
  profileLabels: Record<string, string> = {},
): Promise<T> {
  const run = () => withSpan(name, fn, options);
  if (!pyroscope?.wrapWithLabels || Object.keys(profileLabels).length === 0) {
    return run();
  }

  return pyroscope.wrapWithLabels(profileLabels, run);
}

export function hashIdentifier(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

export function bucketBodySize(size: number): string {
  if (size <= 0) {
    return 'empty';
  }
  if (size < 1_000) {
    return 'lt_1kb';
  }
  if (size < 10_000) {
    return '1kb_10kb';
  }
  if (size < 100_000) {
    return '10kb_100kb';
  }
  if (size < 1_000_000) {
    return '100kb_1mb';
  }
  return 'gte_1mb';
}

export async function initObservability(): Promise<void> {
  if (sdk || initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    if (!config.observability.enabled) {
      logger.info('Observability', 'Tracing is disabled');
      return;
    }

    if (!config.observability.otlpEndpoint) {
      logger.warn(
        'Observability',
        'Tracing enabled but OTLP endpoint is not configured; skipping SDK init',
      );
      return;
    }

    const traceExporter = new OTLPTraceExporter({
      url: config.observability.otlpEndpoint,
      headers: parseHeaderString(config.observability.otlpHeaders),
    });

    sdk = new NodeSDK({
      serviceName: config.observability.serviceName,
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
          '@opentelemetry/instrumentation-dns': {
            enabled: false,
          },
          '@opentelemetry/instrumentation-net': {
            enabled: false,
          },
        }),
      ],
    });

    await sdk.start();
    logger.info('Observability', 'OpenTelemetry SDK started', {
      endpoint: config.observability.otlpEndpoint,
      serviceName: config.observability.serviceName,
      environment: config.observability.environment,
    });

    if (
      config.observability.pyroscopeEnabled &&
      config.observability.pyroscopeServerAddress
    ) {
      try {
        const importedModule = await import('@pyroscope/nodejs');
        pyroscope = (importedModule.default ?? importedModule) as PyroscopeModule;
        pyroscope.init({
          appName: config.observability.serviceName,
          serverAddress: config.observability.pyroscopeServerAddress,
          basicAuthUser: config.observability.pyroscopeBasicAuthUser,
          basicAuthPassword: config.observability.pyroscopeBasicAuthPassword,
          tags: {
            environment: config.observability.environment,
            service_name: config.observability.serviceName,
            service_version: config.observability.serviceVersion,
          },
          wall: {
            collectCpuTime: true,
          },
        });
        pyroscope.start();
        logger.info('Observability', 'Pyroscope profiler started', {
          serverAddress: config.observability.pyroscopeServerAddress,
        });
      } catch (err) {
        logger.error('Observability', 'Failed to initialize Pyroscope', {
          error: err instanceof Error ? err.message : err,
        });
      }
    } else {
      logger.info(
        'Observability',
        'Pyroscope profiling is disabled or not configured',
      );
    }
  })();

  await initPromise;
}

export async function shutdownObservability(): Promise<void> {
  if (!sdk) {
    return;
  }

  try {
    await sdk.shutdown();
    logger.info('Observability', 'OpenTelemetry SDK shut down');
  } catch (err) {
    logger.error('Observability', 'Failed to shut down OpenTelemetry SDK', {
      error: err instanceof Error ? err.message : err,
    });
  } finally {
    sdk = null;
    initPromise = null;
  }
}
