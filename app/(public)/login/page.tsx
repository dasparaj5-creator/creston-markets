"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Mail, Lock, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import Logo from "@/components/shared/Logo";
import PasswordInput from "@/components/shared/PasswordInput";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        logger.warn("Failed login attempt", { email: values.email, reason: error.message });
        toast.error(error.message);
        return;
      }

      logger.info("User logged in", { email: values.email });
      toast.success("Welcome back.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      logger.error("Login error", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      logger.error("Google OAuth failed", { error });
      toast.error("Google sign-in failed.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-hero-mesh px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo className="justify-center" />
          <h1 className="mt-6 text-2xl font-bold text-text-primary">Welcome back</h1>
          <p className="mt-2 text-sm text-text-muted">Log in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-4 p-8">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input {...register("email")} type="email" placeholder="you@example.com" className="input-field pl-10" />
            </div>
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Password</label>
            <PasswordInput
              {...register("password")}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
            />
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-text-muted">
              <input {...register("remember")} type="checkbox" className="rounded border-white/20 bg-white/5" />
              Remember Me
            </label>
            <Link href="/forgot-password" className="text-gold hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            <LogIn className="h-4 w-4" />
            {loading ? "Logging in..." : "Log In"}
          </button>

          <div className="relative py-2 text-center text-xs text-text-muted">
            <span className="relative bg-slate-surface px-2">or</span>
            <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-white/10" />
          </div>

          <button type="button" onClick={handleGoogleLogin} className="btn-secondary w-full">
            Continue with Google
          </button>

          <p className="pt-2 text-center text-sm text-text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-gold hover:underline">
              Open Account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
