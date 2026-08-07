import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import type { LogEntry } from "@/lib/logger";

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