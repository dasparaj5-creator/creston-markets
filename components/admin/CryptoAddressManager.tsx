"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type { CryptoDepositAddress, CryptoNetwork } from "@/types";

const NETWORKS: CryptoNetwork[] = ["ERC20", "TRC20", "BEP20"];

export default function CryptoAddressManager({
  addresses,
  adminId,
}: {
  addresses: CryptoDepositAddress[];
  adminId: string;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<CryptoNetwork, string>>(() => {
    const initial = {} as Record<CryptoNetwork, string>;
    NETWORKS.forEach((n) => {
      initial[n] = addresses.find((a) => a.network === n)?.wallet_address ?? "";
    });
    return initial;
  });
  const [saving, setSaving] = useState<CryptoNetwork | null>(null);

  const handleSave = async (network: CryptoNetwork) => {
    const address = drafts[network].trim();
    if (!address) {
      toast.error("Enter a wallet address first.");
      return;
    }

    setSaving(network);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("crypto_deposit_addresses")
        .upsert(
          { network, wallet_address: address, is_active: true, updated_by: adminId, updated_at: new Date().toISOString() },
          { onConflict: "network" }
        );
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "crypto_address.updated",
        target_type: "crypto_deposit_addresses",
        after_value: { network, wallet_address: address },
      });

      logger.info("Crypto deposit address updated", { network, adminId });
      toast.success(`${network} address saved.`);
      router.refresh();
    } catch (err) {
      logger.error("Crypto address save failed", { err });
      toast.error("Something went wrong.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="glass-card space-y-6 p-6">
      <h2 className="text-sm font-semibold text-text-primary">USDT Deposit Addresses</h2>
      <p className="text-xs text-text-muted">
        These addresses are shown to clients on the Deposit page. QR codes update automatically.
      </p>

      {NETWORKS.map((network) => (
        <div key={network} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center">
          <div className="shrink-0 rounded-lg bg-white p-2">
            <QRCodeSVG value={drafts[network] || "no-address-set"} size={72} />
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-text-muted">USDT ({network}) Address</label>
            <input
              value={drafts[network]}
              onChange={(e) => setDrafts({ ...drafts, [network]: e.target.value })}
              placeholder={`Enter ${network} wallet address`}
              className="input-field text-sm"
            />
          </div>
          <button
            onClick={() => handleSave(network)}
            disabled={saving === network}
            className="btn-secondary shrink-0 text-xs"
          >
            <Save className="h-3.5 w-3.5" /> {saving === network ? "Saving..." : "Save"}
          </button>
        </div>
      ))}
    </div>
  );
}
