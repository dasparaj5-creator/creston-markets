import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Handles the redirect Supabase sends the browser to after a successful
 * OAuth login (Google, etc.).
 *
 * IMPORTANT: this does NOT reuse the shared createClient() from
 * lib/supabase/server.ts. That helper wraps every cookie write in a
 * try/catch that silently swallows errors, with a comment explaining
 * it's designed for Server Components (where cookies() genuinely can't
 * be mutated, and middleware is expected to handle the actual refresh).
 * A Route Handler is different -- cookies().set() is fully supported and
 * SHOULD succeed here, but reusing the Server-Component-oriented client
 * meant any real failure during exchangeCodeForSession()'s cookie writes
 * was being silently caught and discarded, which is almost certainly why
 * Google auth appeared to complete but no real session was ever
 * established. Building the client inline here, with an explicit
 * response object that cookies are attached to directly, is the
 * documented-correct pattern for a Route Handler specifically.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", requestUrl.origin));
  }

  const cookieStore = cookies();
  const response = NextResponse.redirect(new URL("/dashboard", requestUrl.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set on BOTH the request-scoped cookie store and the actual
          // response object -- the response is what the browser
          // receives, so this is the write that actually matters for
          // the session to persist after this redirect.
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
  }

  // Now that a real session exists, check whether this user needs to
  // complete their profile (Google sign-ups don't provide
  // phone/country/risk acknowledgment, which this platform requires)
  // before reaching the dashboard.
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
      const profileRedirect = NextResponse.redirect(new URL("/dashboard/complete-profile", requestUrl.origin));
      // Copy the session cookies already set on `response` onto this
      // new redirect response too, since we're returning a different
      // NextResponse object than the one the cookie callbacks wrote to.
      response.cookies.getAll().forEach((cookie) => profileRedirect.cookies.set(cookie));
      return profileRedirect;
    }
  }

  return response;
}
