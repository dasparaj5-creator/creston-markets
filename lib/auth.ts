import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types";

/**
 * Fetches the authenticated user's profile row. Redirects to /login if not
 * authenticated (defense in depth alongside middleware).
 */
export async function requireUser(): Promise<UserProfile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();

  if (!profile) redirect("/login");

  return profile as UserProfile;
}

/**
 * Fetches the authenticated admin's profile row. Redirects to /admin/login
 * if not authenticated or not an admin. Middleware also enforces this, but
 * we re-check here since server actions/components can be reached directly.
 */
export async function requireAdmin(): Promise<UserProfile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();

  if (!profile || profile.role !== "admin") redirect("/admin/login");

  return profile as UserProfile;
}
