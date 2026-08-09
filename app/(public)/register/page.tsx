"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import Logo from "@/components/shared/Logo";
import RiskBanner from "@/components/shared/RiskBanner";

const schema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(6, "Phone number is required"),
    country: z.string().min(2, "Country is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
    agreeTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the Terms of Service and Privacy Policy" }),
    }),
    agreeRisk: z.literal(true, {
      errorMap: () => ({ message: "You must acknowledge the risk of trading" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const refFromUrl = searchParams.get("ref") || "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (refFromUrl) setValue("referralCode", refFromUrl);
  }, [refFromUrl, setValue]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (authError || !authData.user) {
        logger.error("Registration failed at auth step", { error: authError });
        toast.error(authError?.message || "Registration failed.");
        return;
      }

      // Resolve referrer id from the referral code, if provided.
      let referredBy: string | null = null;
      if (values.referralCode) {
        const { data: referrer } = await supabase
          .from("users")
          .select("id")
          .eq("referral_code", values.referralCode)
          .maybeSingle();
        referredBy = referrer?.id ?? null;
        if (values.referralCode && !referredBy) {
          logger.warn("Referral code provided but not found", { code: values.referralCode });
        }
      }

      const { error: profileError } = await supabase.from("users").upsert({
        id: authData.user.id,
        email: values.email,
        full_name: values.fullName,
        phone: values.phone,
        country: values.country,
        referred_by: referredBy,
        role: "client",
        terms_accepted_at: new Date().toISOString(),
      });

      if (profileError) {
        logger.error("Registration failed at profile step", { error: profileError });
        toast.error("Account created but profile setup failed. Please contact support.");
        return;
      }

      logger.info("New user registered", { email: values.email, referredBy });
      toast.success("Account created. Welcome to Creston Markets.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      logger.error("Unexpected registration error", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const supabase = createClient();
    // Persist the referral code across the OAuth redirect round-trip via
    // sessionStorage, since query params don't survive Google's redirect.
    // The dashboard's first-load logic (or a dedicated callback route)
    // reads this once and links referred_by if not already set.
    if (refFromUrl) {
      sessionStorage.setItem("cm_pending_referral_code", refFromUrl);
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      logger.error("Google sign-up failed", { error });
      toast.error("Google sign-up failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-hero-mesh px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Logo className="justify-center" />
          <h1 className="mt-6 text-2xl font-bold text-text-primary">Open Your Account</h1>
          <p className="mt-2 text-sm text-text-muted">
            Register to start onboarding with Creston Markets.
          </p>
        </div>

        <div className="glass-card mb-4 space-y-4 p-8">
          <button type="button" onClick={handleGoogleSignup} className="btn-secondary w-full">
            Sign up with Google
          </button>
          <p className="text-center text-[11px] text-text-muted">
            You&apos;ll be asked to complete your profile (phone, country, and required
            acknowledgments) after signing up with Google.
          </p>
          <div className="relative py-1 text-center text-xs text-text-muted">
            <span className="relative bg-slate-surface px-2">or register with email</span>
            <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-white/10" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-4 p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Full Name</label>
              <input {...register("fullName")} placeholder="Jane Doe" className="input-field" />
              {errors.fullName && <p className="mt-1 text-xs text-danger">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Phone</label>
              <input {...register("phone")} placeholder="+1 555 000 0000" className="input-field" />
              {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Email</label>
            <input {...register("email")} type="email" placeholder="you@example.com" className="input-field" />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Country</label>
            <input {...register("country")} placeholder="United States" className="input-field" />
            {errors.country && <p className="mt-1 text-xs text-danger">{errors.country.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Password</label>
              <input {...register("password")} type="password" placeholder="••••••••" className="input-field" />
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Confirm Password</label>
              <input {...register("confirmPassword")} type="password" placeholder="••••••••" className="input-field" />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Referral Code (optional)</label>
            <input
              {...register("referralCode")}
              placeholder="e.g. 8f3a2c1d"
              readOnly={!!refFromUrl}
              className="input-field disabled:opacity-70"
            />
          </div>

          <RiskBanner variant="compact" />

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-2 text-xs text-text-muted">
              <input {...register("agreeTerms")} type="checkbox" className="mt-0.5 rounded border-white/20 bg-white/5" />
              <span>
                I have read and agree to the{" "}
                <Link href="/terms" className="text-gold hover:underline">Terms of Service</Link> and{" "}
                <Link href="/privacy" className="text-gold hover:underline">Privacy Policy</Link>
              </span>
            </label>
            {errors.agreeTerms && <p className="text-xs text-danger">{errors.agreeTerms.message}</p>}

            <label className="flex items-start gap-2 text-xs text-text-muted">
              <input {...register("agreeRisk")} type="checkbox" className="mt-0.5 rounded border-white/20 bg-white/5" />
              <span>
                I understand that trading involves significant risk of loss and I may lose some or all
                of my invested capital
              </span>
            </label>
            {errors.agreeRisk && <p className="text-xs text-danger">{errors.agreeRisk.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            <UserPlus className="h-4 w-4" />
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="pt-2 text-center text-sm text-text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-gold hover:underline">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)]" />}>
      <RegisterForm />
    </Suspense>
  );
}
