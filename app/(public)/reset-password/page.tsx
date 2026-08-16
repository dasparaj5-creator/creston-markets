"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Lock, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import Logo from "@/components/shared/Logo";
import PasswordInput from "@/components/shared/PasswordInput";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

/**
 * The page that was entirely missing from this codebase -- the actual
 * "set your new password" step of the forgot-password flow.
 * ForgotPasswordPage already correctly requests a reset email via
 * supabase.auth.resetPasswordForEmail(), but its redirectTo pointed
 * straight at /login, a completely ordinary login page with no
 * awareness of the one-time recovery token Supabase attaches to that
 * link. Clicking the emailed link landed on /login as if nothing
 * special had happened, which (combined with /login's own redirect
 * behavior for an unauthenticated visit) is why it appeared to just
 * bounce to the homepage -- there was genuinely nowhere for the
 * recovery flow to actually complete.
 *
 * How this works: when Supabase redirects here after a recovery link
 * click, it doesn't pass the token as a normal query param -- it sets
 * up a temporary, restricted session client-side (detected via the
 * onAuthStateChange PASSWORD_RECOVERY event) that ONLY allows calling
 * updateUser() to set a new password, nothing else. This page listens
 * for that event and only shows the form once it fires, so a normal
 * visitor navigating here directly (without a valid recovery link)
 * sees a clear "invalid or expired link" message instead of a
 * password form that would silently fail.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "success">("checking");
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStatus("ready");
      }
    });

    // If the recovery event already fired before this listener attached
    // (a real timing possibility depending on how fast the page hydrates),
    // check directly for an existing session as a fallback.
    const checkExistingSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setStatus((current) => (current === "checking" ? "ready" : current));
      } else {
        // Give the onAuthStateChange listener a brief window to fire
        // before concluding the link is genuinely invalid/expired --
        // this event can take a moment to arrive after the redirect.
        setTimeout(() => {
          setStatus((current) => (current === "checking" ? "invalid" : current));
        }, 3000);
      }
    };
    checkExistingSession();

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) {
        logger.error("Password reset failed", { error });
        toast.error(error.message);
        return;
      }
      logger.info("Password reset completed successfully");
      setStatus("success");
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      logger.error("Unexpected error during password reset", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-hero-mesh px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo className="justify-center" />
          <h1 className="mt-6 text-2xl font-bold text-text-primary">Set a new password</h1>
        </div>

        <div className="glass-card p-8">
          {status === "checking" && (
            <p className="text-center text-sm text-text-muted">Verifying your reset link…</p>
          )}

          {status === "invalid" && (
            <div className="text-center">
              <p className="text-sm text-text-primary/90">
                This password reset link is invalid or has expired.
              </p>
              <a href="/forgot-password" className="mt-4 inline-block text-sm text-gold hover:underline">
                Request a new reset link
              </a>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <p className="text-sm text-text-primary/90">
                Your password has been updated. Redirecting you to log in…
              </p>
            </div>
          )}

          {status === "ready" && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">New Password</label>
                <PasswordInput
                  {...register("password")}
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4 w-4" />}
                />
                {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Confirm New Password</label>
                <PasswordInput
                  {...register("confirmPassword")}
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4 w-4" />}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>
                )}
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
