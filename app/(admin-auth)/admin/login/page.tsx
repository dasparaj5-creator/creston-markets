"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import Logo from "@/components/shared/Logo";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error || !data.user) {
        logger.warn("Failed admin login attempt", { email: values.email });
        toast.error(error?.message || "Login failed.");
        return;
      }

      const { data: profile } = await supabase.from("users").select("role").eq("id", data.user.id).single();

      if (profile?.role !== "admin") {
        logger.warn("Non-admin attempted admin login", { email: values.email });
        await supabase.auth.signOut();
        toast.error("This account does not have admin access.");
        return;
      }

      logger.info("Admin logged in", { email: values.email });
      toast.success("Welcome back.");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      logger.error("Admin login error", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-mesh px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo className="justify-center" />
          <div className="mt-6 flex items-center justify-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <h1 className="text-2xl font-bold text-text-primary">Admin Access</h1>
          </div>
          <p className="mt-2 text-sm text-text-muted">Restricted area. Authorized personnel only.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-4 p-8">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Admin Email</label>
            <input {...register("email")} type="email" className="input-field" />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Password</label>
            <input {...register("password")} type="password" className="input-field" />
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
