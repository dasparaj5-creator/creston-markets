import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side endpoint for admin_audit_log writes -- exists specifically
 * so the real client IP can be captured correctly. Vercel sets the
 * `x-forwarded-for` header on every incoming request with the actual
 * end-user's IP (this is the standard way to get a real client IP behind
 * any reverse proxy/CDN, which Vercel's edge network is); a database
 * trigger using inet_client_addr() would only see Supabase's own
 * connection-pooler IP, not this, which is why this goes through an API
 * route instead of a direct client-side insert.
 *
 * This route also re-verifies the caller is a real, authenticated admin
 * server-side before writing -- it never trusts adminId as sent by the
 * client alone, since that's just a UI-supplied value.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json();
  const { action, targetType, targetId, beforeValue, afterValue, userAgent } = body;

  if (!action || !targetType) {
    return NextResponse.json({ error: "action and targetType are required" }, { status: 400 });
  }

  // x-forwarded-for can contain a comma-separated list if the request
  // passed through multiple proxies -- the first entry is the original
  // client's IP, which is the one that matters here.
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

  const { error } = await supabase.from("admin_audit_log").insert({
    admin_id: user.id, // server-verified, not the client-supplied adminId
    action,
    target_type: targetType,
    target_id: targetId ?? null,
    before_value: beforeValue ?? null,
    after_value: afterValue ?? null,
    user_agent: userAgent ?? null,
    ip_address: ipAddress,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
