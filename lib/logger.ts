// Structured logging utility
// In production, consider integrating with a logging service (Sentry, LogRocket, etc.)

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  requestId?: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatLogEntry(entry: LogEntry): string {
  const { timestamp, level, message, ...rest } = entry;
  const base = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  const hasData = Object.keys(rest).length > 0;
  if (!hasData) return base;
  return `${base} ${JSON.stringify(rest, null, process.env.NODE_ENV === 'production' ? 0 : 2)}`;
}

function log(level: LogLevel, message: string, data?: unknown, context?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: formatTimestamp(),
    level,
    message,
    ...context,
  };

  if (data !== undefined) {
    entry.data = data;
  }

  const formatted = formatLogEntry(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'debug':
      console.debug(formatted);
      break;
  }
}

// Public API
export const logger = {
  error: (message: string, data?: unknown, context?: Record<string, unknown>) =>
    log('error', message, data, context),
  warn: (message: string, data?: unknown, context?: Record<string, unknown>) =>
    log('warn', message, data, context),
  info: (message: string, data?: unknown, context?: Record<string, unknown>) =>
    log('info', message, data, context),
  debug: (message: string, data?: unknown, context?: Record<string, unknown>) =>
    log('debug', message, data, context),
};

// Request-scoped logger (for API routes)
export function createRequestLogger(requestId?: string) {
  const context = requestId ? { requestId } : {};
  return {
    error: (message: string, data?: unknown) => logger.error(message, data, context),
    warn: (message: string, data?: unknown) => logger.warn(message, data, context),
    info: (message: string, data?: unknown) => logger.info(message, data, context),
    debug: (message: string, data?: unknown) => logger.debug(message, data, context),
  };
}