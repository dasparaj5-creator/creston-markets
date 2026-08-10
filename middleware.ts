import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protects /dashboard/* (any authenticated client) and /admin/* (role must
 * be 'admin', checked server-side against the users table — never trust a
 * client-supplied role claim).
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminPath = path.startsWith("/admin") && path !== "/admin/login";
  const isDashboardPath = path.startsWith("/dashboard");

  if ((isAdminPath || isDashboardPath) && !user) {
    const loginPath = isAdminPath ? "/admin/login" : "/login";
    const redirectUrl = new URL(loginPath, request.url);
    redirectUrl.searchParams.set("redirectedFrom", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAdminPath && user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Google OAuth sign-ups never see the mandatory risk/terms checkboxes
  // shown on the email registration form. Gate the rest of the dashboard
  // until they've completed /dashboard/complete-profile, which collects
  // phone/country and the same acknowledgments. Also enforce is_active
  // here: a deactivated ("on hold") account should be signed-out of the
  // dashboard immediately, not just hidden from admin's own view.
  const isCompleteProfilePath = path === "/dashboard/complete-profile";
  const isAccountHoldPath = path === "/account-on-hold";
  if (isDashboardPath && user && !isCompleteProfilePath) {
    const { data: profile } = await supabase
      .from("users")
      .select("terms_accepted_at, is_active")
      .eq("id", user.id)
      .single();

    if (profile && profile.is_active === false && !isAccountHoldPath) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/account-on-hold", request.url));
    }

    if (profile && !profile.terms_accepted_at) {
      return NextResponse.redirect(new URL("/dashboard/complete-profile", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
