"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type { ReferralConfig } from "@/lib/referral";

const schema = z.object({
  bonusAmount: z.coerce.number().positive("Enter a valid amount"),
  maturityDays: z.coerce.number().int().positive("Enter valid days"),
});
type FormValues = z.infer<typeof schema>;

export default function ReferralConfigEditor({ config, adminId }: { config: ReferralConfig; adminId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { bonusAmount: config.bonus_amount, maturityDays: config.maturity_days },
  });

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("referral_config").insert({
        bonus_amount: values.bonusAmount,
        bonus_currency: config.bonus_currency,
        maturity_days: values.maturityDays,
        updated_by: adminId,
      });
      if (error) throw error;

      logger.info("Referral config updated", { adminId, ...values });
      toast.success("Referral config updated.");
      router.refresh();
    } catch (err) {
      logger.error("Referral config update failed", { err });
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-4 p-6">
      <h2 className="text-sm font-semibold text-text-primary">Referral Config</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Flat Bonus Amount (USD)</label>
          <input {...register("bonusAmount")} type="number" step="0.01" className="input-field" />
          {errors.bonusAmount && <p className="mt-1 text-xs text-danger">{errors.bonusAmount.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Maturity Days</label>
          <input {...register("maturityDays")} type="number" className="input-field" />
          {errors.maturityDays && <p className="mt-1 text-xs text-danger">{errors.maturityDays.message}</p>}
        </div>
      </div>
      <button type="submit" disabled={saving} className="btn-primary">
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Config"}
      </button>
    </form>
  );
}
