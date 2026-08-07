"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Upload, FileCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type { KycStatus } from "@/types";

const statusBadge: Record<KycStatus, string> = {
  approved: "badge-success",
  pending: "badge-warning",
  rejected: "badge-danger",
};

export default function KycUpload({ userId, currentStatus }: { userId: string; currentStatus: KycStatus }) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${userId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage.from("kyc-documents").upload(path, file, {
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("users")
        .update({ kyc_document_url: path, kyc_status: "pending" })
        .eq("id", userId);
      if (updateError) throw updateError;

      logger.info("KYC document uploaded", { userId, path });
      toast.success("Document uploaded. Awaiting review.");
      setFileName(file.name);
    } catch (err) {
      logger.error("KYC upload failed", { err });
      toast.error("Upload failed. Please try again, or contact support.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">KYC Verification</h2>
        <span className={statusBadge[currentStatus]}>{currentStatus}</span>
      </div>
      <p className="text-xs text-text-muted">
        Upload a government-issued ID and a selfie to verify your identity.
      </p>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-8 text-center hover:border-gold/40">
        {fileName ? (
          <>
            <FileCheck className="h-6 w-6 text-success" />
            <span className="text-sm text-text-primary">{fileName}</span>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-text-muted" />
            <span className="text-sm text-text-muted">{uploading ? "Uploading..." : "Click to upload document"}</span>
          </>
        )}
        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
    </div>
  );
}
