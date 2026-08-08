"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Upload, FileCheck, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type { KycStatus, KycDocument, KycDocumentType, KycDocumentSide } from "@/types";

const statusBadge: Record<KycStatus, string> = {
  approved: "badge-success",
  pending: "badge-warning",
  rejected: "badge-danger",
};

const DOCUMENT_TYPE_LABELS: Record<KycDocumentType, string> = {
  personal_id: "Personal ID",
  aadhar_card: "Aadhar Card",
  license: "Driving License",
  passport: "Passport",
  pan_card: "PAN Card",
  voter_id: "Voter ID",
  bank_statement: "Bank Statement",
};

const DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_LABELS) as KycDocumentType[];
const MAX_DOCUMENT_SLOTS = 2;

export default function KycUpload({
  userId,
  currentStatus,
  existingDocuments,
}: {
  userId: string;
  currentStatus: KycStatus;
  existingDocuments: KycDocument[];
}) {
  // Derive which document types already have at least one uploaded side,
  // to pre-populate the two "slots" the client is choosing between.
  const existingTypes = Array.from(new Set(existingDocuments.map((d) => d.document_type)));
  const [slotTypes, setSlotTypes] = useState<(KycDocumentType | "")[]>([
    existingTypes[0] ?? "",
    existingTypes[1] ?? "",
  ]);
  const [uploading, setUploading] = useState<string | null>(null); // key: `${slotIndex}-${side}`

  const docsByType = (type: KycDocumentType) => existingDocuments.filter((d) => d.document_type === type);

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slotIndex: number,
    side: KycDocumentSide
  ) => {
    const file = e.target.files?.[0];
    const docType = slotTypes[slotIndex];
    if (!file || !docType) return;

    const key = `${slotIndex}-${side}`;
    setUploading(key);
    try {
      const supabase = createClient();
      const path = `${userId}/${docType}-${side}-${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage.from("kyc-documents").upload(path, file, {
        upsert: false,
      });
      if (uploadError) throw uploadError;

      // Remove any prior upload for this exact (type, side) slot first, since
      // the unique index only allows one row per (user, type, side).
      await supabase
        .from("kyc_documents")
        .delete()
        .eq("user_id", userId)
        .eq("document_type", docType)
        .eq("side", side);

      const { error: insertError } = await supabase.from("kyc_documents").insert({
        user_id: userId,
        document_type: docType,
        side,
        file_path: path,
      });
      if (insertError) throw insertError;

      await supabase.from("users").update({ kyc_status: "pending" }).eq("id", userId);

      logger.info("KYC document uploaded", { userId, docType, side });
      toast.success(`${DOCUMENT_TYPE_LABELS[docType]} (${side}) uploaded.`);
    } catch (err) {
      logger.error("KYC upload failed", { err });
      toast.error("Upload failed. Please try again, or contact support.");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  return (
    <div className="glass-card space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">KYC Verification</h2>
        <span className={statusBadge[currentStatus]}>{currentStatus}</span>
      </div>
      <p className="text-xs text-text-muted">
        Choose 2 document types and upload the front and back of each (4 files total).
      </p>

      {slotTypes.map((selectedType, slotIndex) => {
        const takenByOtherSlot = slotTypes.filter((_, i) => i !== slotIndex);
        const availableOptions = DOCUMENT_TYPES.filter((t) => !takenByOtherSlot.includes(t));
        const frontDoc = selectedType ? docsByType(selectedType).find((d) => d.side === "front") : undefined;
        const backDoc = selectedType ? docsByType(selectedType).find((d) => d.side === "back") : undefined;

        return (
          <div key={slotIndex} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-text-muted">Document {slotIndex + 1}</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  const next = [...slotTypes];
                  next[slotIndex] = e.target.value as KycDocumentType | "";
                  setSlotTypes(next);
                }}
                className="input-field !w-auto !py-1.5 text-xs"
              >
                <option value="">Select document type…</option>
                {availableOptions.map((t) => (
                  <option key={t} value={t}>
                    {DOCUMENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            {selectedType && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(["front", "back"] as KycDocumentSide[]).map((side) => {
                  const doc = side === "front" ? frontDoc : backDoc;
                  const key = `${slotIndex}-${side}`;
                  return (
                    <label
                      key={side}
                      className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 px-3 py-6 text-center hover:border-gold/40"
                    >
                      {doc ? (
                        <>
                          <FileCheck className="h-5 w-5 text-success" />
                          <span className="text-xs text-text-primary">
                            {side === "front" ? "Front" : "Back"} uploaded
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-text-muted" />
                          <span className="text-xs text-text-muted">
                            {uploading === key ? "Uploading..." : `Upload ${side}`}
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFile(e, slotIndex, side)}
                        disabled={uploading === key}
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {slotTypes.filter(Boolean).length < MAX_DOCUMENT_SLOTS && (
        <button
          onClick={() => setSlotTypes([...slotTypes, ""])}
          className="btn-secondary w-full text-xs"
        >
          <Plus className="h-3.5 w-3.5" /> Add another document type
        </button>
      )}
    </div>
  );
}
