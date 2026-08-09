import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import type { LogEntry } from "@/lib/logger";

/**
 * Persists a log entry to the error_logs table. Only ever call this from
 * genuinely server-side code (Server Components, Server Actions, Route
 * Handlers) — importing this file into anything that could end up in a
 * client bundle will break the build, since it transitively pulls in
 * next/headers via lib/supabase/server.ts.
 */
export async function persistLog(entry: LogEntry) {
  try {
    const supabase = createServiceClient();
    await supabase.from("error_logs").insert({
      level: entry.level,
      message: entry.message,
      context: entry.context ?? {},
      user_id: entry.userId ?? null,
      page: entry.page ?? null,
    });
  } catch {
    // Never let logging failures break the app.
  }
}
