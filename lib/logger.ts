/**
 * Creston Markets — Global logger
 * Logs to console always; also persists to the error_logs table when a
 * Supabase client is available (server-side routes, auth actions, referral
 * bonus calculations, reconciliation updates).
 */
export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  page?: string;
  timestamp: string;
}

const MAX_BUFFER = 20;
const buffer: LogEntry[] = [];

function pushToBuffer(entry: LogEntry) {
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.shift();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cm:log", { detail: entry }));
  }
}

export function getRecentLogs(): LogEntry[] {
  return [...buffer];
}

function consoleLog(entry: LogEntry) {
  const prefix = `[${entry.timestamp}] [${entry.level}]`;
  const style =
    entry.level === "ERROR"
      ? "color: #EF4444; font-weight: bold"
      : entry.level === "WARN"
      ? "color: #D4AF37; font-weight: bold"
      : entry.level === "DEBUG"
      ? "color: #00D4FF"
      : "color: #10B981";

  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log(`%c${prefix} ${entry.message}`, style, entry.context ?? "");
  } else {
    // eslint-disable-next-line no-console
    console.log(`${prefix} ${entry.message}`, entry.context ?? "");
  }
}

async function persist(entry: LogEntry) {
  // Server-only persistence lives in lib/logger-server.ts so this shared
  // file never references next/headers, even indirectly — otherwise
  // Next.js's bundler traces it into client code and fails the build.
  if (typeof window !== "undefined") return;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>, userId?: string, page?: string) {
  const entry: LogEntry = {
    level,
    message,
    context,
    userId,
    page,
    timestamp: new Date().toISOString(),
  };
  pushToBuffer(entry);
  consoleLog(entry);
  void persist(entry);
  return entry;
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>, userId?: string, page?: string) =>
    log("INFO", message, context, userId, page),
  warn: (message: string, context?: Record<string, unknown>, userId?: string, page?: string) =>
    log("WARN", message, context, userId, page),
  error: (message: string, context?: Record<string, unknown>, userId?: string, page?: string) =>
    log("ERROR", message, context, userId, page),
  debug: (message: string, context?: Record<string, unknown>, userId?: string, page?: string) =>
    log("DEBUG", message, context, userId, page),
};
