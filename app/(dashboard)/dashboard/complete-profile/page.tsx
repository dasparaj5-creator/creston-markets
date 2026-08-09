"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import RiskBanner from "@/components/shared/RiskBanner";
import Link from "next/link";

const schema = z.object({
  phone: z.string().min(6, "Phone number is required"),
  country: z.string().min(2, "Country is required"),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Terms of Service and Privacy Policy" }),
  }),
  agreeRisk: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge the risk of trading" }),
  }),
});
type FormValues = z.infer<typeof schema>;

function CompleteProfileForm() {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Session expired. Please log in again.");
        router.push("/login");
        return;
      }

      // Pick up a referral code stashed before the Google redirect, if any.
      let referredBy: string | null = null;
      const pendingCode =
        typeof window !== "undefined" ? sessionStorage.getItem("cm_pending_referral_code") : null;
      if (pendingCode) {
        const { data: referrer } = await supabase
          .from("users")
          .select("id")
          .eq("referral_code", pendingCode)
          .maybeSingle();
        referredBy = referrer?.id ?? null;
        sessionStorage.removeItem("cm_pending_referral_code");
      }

      const { error } = await supabase
        .from("users")
        .update({
          phone: values.phone,
          country: values.country,
          terms_accepted_at: new Date().toISOString(),
          ...(referredBy ? { referred_by: referredBy } : {}),
        })
        .eq("id", user.id);

      if (error) throw error;

      logger.info("Profile completed after Google sign-up", { userId: user.id, referredBy });
      toast.success("Welcome to Creston Markets.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      logger.error("Complete profile failed", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">Complete Your Profile</h1>
        <p className="mt-2 text-sm text-text-muted">
          Just a few more details before you can access your dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-4 p-8">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Phone</label>
          <input {...register("phone")} placeholder="+1 555 000 0000" className="input-field" />
          {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Country</label>
          <input {...register("country")} placeholder="United States" className="input-field" />
          {errors.country && <p className="mt-1 text-xs text-danger">{errors.country.message}</p>}
        </div>

        <RiskBanner variant="compact" />

        <div className="space-y-3 pt-1">
          <label className="flex items-start gap-2 text-xs text-text-muted">
            <input {...register("agreeTerms")} type="checkbox" className="mt-0.5 rounded border-white/20 bg-white/5" />
            <span>
              I have read and agree to the{" "}
              <Link href="/terms" className="text-gold hover:underline" target="_blank">Terms of Service</Link> and{" "}
              <Link href="/privacy" className="text-gold hover:underline" target="_blank">Privacy Policy</Link>
            </span>
          </label>
          {errors.agreeTerms && <p className="text-xs text-danger">{errors.agreeTerms.message}</p>}

          <label className="flex items-start gap-2 text-xs text-text-muted">
            <input {...register("agreeRisk")} type="checkbox" className="mt-0.5 rounded border-white/20 bg-white/5" />
            <span>
              I understand that trading involves significant risk of loss and I may lose some or
              all of my invested capital
            </span>
          </label>
          {errors.agreeRisk && <p className="text-xs text-danger">{errors.agreeRisk.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          <UserCheck className="h-4 w-4" />
          {loading ? "Saving..." : "Continue to Dashboard"}
        </button>
      </form>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-[400px]" />}>
      <CompleteProfileForm />
    </Suspense>
  );
}
