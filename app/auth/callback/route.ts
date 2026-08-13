import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the redirect Supabase sends the browser to after a successful
 * OAuth login (Google, etc.). This route was missing entirely, which is
 * why Google sign-in appeared to "work" (Google's own auth screen
 * completed fine) but the user landed back on the site with no actual
 * session -- Supabase's OAuth flow hands back a one-time `code` in the
 * URL, and something has to explicitly exchange that code for a real
 * session cookie via exchangeCodeForSession(). Without this route, nothing
 * ever did that exchange, so `redirectTo: '/dashboard'` just sent the
 * browser to a page with no valid session, which likely bounced to the
 * homepage via the auth guard.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // After exchanging the code, check whether this user needs to complete
  // their profile (Google sign-ups don't provide phone/country/risk
  // acknowledgment, which this platform requires) before reaching the
  // dashboard -- mirrors the same completion gate the rest of the app
  // already enforces via middleware for other entry points.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("terms_accepted_at")
      .eq("id", user.id)
      .single();

    if (profile && !profile.terms_accepted_at) {
      return NextResponse.redirect(new URL("/dashboard/complete-profile", requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}
