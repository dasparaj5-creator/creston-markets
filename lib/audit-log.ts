/**
 * Writes one row to admin_audit_log, automatically capturing the
 * browser's user-agent (device/OS/browser can be parsed from this) at
 * the moment the action happens.
 *
 * IP ADDRESS -- IMPORTANT LIMITATION: this does NOT attempt to capture
 * IP via a Postgres trigger using inet_client_addr(), which was the
 * first approach considered here. That would only return the IP of
 * Supabase's own connection pooler (Supavisor/PgBouncer), not the real
 * end user's IP -- the app never makes a direct per-request database
 * connection from the browser, it goes through PostgREST/the pooler.
 * A trigger-based approach would silently record a useless, constant
 * value that LOOKS like real IP tracking but isn't.
 *
 * The correct way to capture a real client IP is server-side, reading
 * the `x-forwarded-for` header Vercel sets on every request -- this
 * requires going through a Next.js API route rather than inserting
 * directly from the browser. That's what /api/audit-log does; this
 * function calls it instead of writing to Supabase directly.
 */
export async function logAdminAction(params: {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  beforeValue?: unknown;
  afterValue?: unknown;
}) {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;

  try {
    await fetch("/api/audit-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminId: params.adminId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId ?? null,
        beforeValue: params.beforeValue ?? null,
        afterValue: params.afterValue ?? null,
        userAgent,
      }),
    });
  } catch {
    // Audit logging failures should never block the actual admin action
    // that triggered them -- this is a best-effort background write, not
    // something a save/approve/delete flow should fail because of.
  }
}
