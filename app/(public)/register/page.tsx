"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import Logo from "@/components/shared/Logo";
import RiskBanner from "@/components/shared/RiskBanner";
import CountrySelect from "@/components/shared/CountrySelect";
import PhoneInput from "@/components/shared/PhoneInput";
import { findCountryByCode } from "@/lib/countries";

const schema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    phoneNational: z.string().min(1, "Phone number is required"),
    phoneValid: z.boolean().refine((v) => v === true, { message: "Enter a valid phone number" }),
    countryCode: z.string().min(2, "Country is required"),
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
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { phoneValid: false } });

  const countryCode = watch("countryCode");

  useEffect(() => {
    if (refFromUrl) setValue("referralCode", refFromUrl);
  }, [refFromUrl, setValue]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const country = findCountryByCode(values.countryCode);
      const fullPhoneNumber = `${country?.dialCode ?? ""}${values.phoneNational}`;

      // Resolve referrer id from the referral code BEFORE signUp, since
      // RLS on the users table requires an authenticated session for
      // reads/writes, and Supabase's email-confirmation flow means no
      // session exists yet immediately after signUp() returns -- so this
      // lookup must happen first, using only the public referral_code
      // column via the pre-auth-safe select the RLS policy allows.
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

      // Pass all profile data as auth metadata rather than writing to the
      // users table directly afterward. This matters because Supabase's
      // email-confirmation flow means there is NO active session
      // immediately after signUp() resolves -- a follow-up write to the
      // users table would be blocked by RLS until the user actually
      // clicks the confirmation link. Passing it as metadata lets the
      // handle_new_auth_user() database trigger create a fully-populated
      // profile row atomically, with no race condition and no dependency
      // on session timing.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            phone: fullPhoneNumber,
            country: country?.name ?? values.countryCode,
            referred_by: referredBy,
            terms_accepted_at: new Date().toISOString(),
          },
        },
      });

      if (authError || !authData.user) {
        logger.error("Registration failed at auth step", { error: authError });
        toast.error(authError?.message || "Registration failed.");
        return;
      }

      logger.info("New user registered", { email: values.email, referredBy });

      if (!authData.session) {
        // Email confirmation is required -- there's no active session yet,
        // so we can't redirect to the dashboard. Tell the user clearly.
        toast.success("Account created. Please check your email to confirm before logging in.");
        router.push("/login");
        return;
      }

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
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Full Name</label>
            <input {...register("fullName")} placeholder="Jane Doe" className="input-field" />
            {errors.fullName && <p className="mt-1 text-xs text-danger">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Email</label>
            <input {...register("email")} type="email" placeholder="you@example.com" className="input-field" />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Country</label>
            <Controller
              name="countryCode"
              control={control}
              render={({ field }) => (
                <CountrySelect value={field.value ?? ""} onChange={field.onChange} />
              )}
            />
            {errors.countryCode && <p className="mt-1 text-xs text-danger">{errors.countryCode.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Phone</label>
            <Controller
              name="phoneNational"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  countryCode={countryCode}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onValidityChange={(valid) => setValue("phoneValid", valid, { shouldValidate: true })}
                />
              )}
            />
            {errors.phoneNational && <p className="mt-1 text-xs text-danger">{errors.phoneNational.message}</p>}
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
