"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  // Local, optimistically-updated copy so removing a document reflects
  // immediately without waiting on a full server round-trip.
  const [documents, setDocuments] = useState<KycDocument[]>(existingDocuments);

  const existingTypes = Array.from(new Set(documents.map((d) => d.document_type)));
  const [slotTypes, setSlotTypes] = useState<(KycDocumentType | "")[]>([
    existingTypes[0] ?? "",
    existingTypes[1] ?? "",
  ]);
  const [uploading, setUploading] = useState<string | null>(null); // key: `${slotIndex}-${side}`
  const [removing, setRemoving] = useState<string | null>(null); // document id

  const docsByType = (type: KycDocumentType) => documents.filter((d) => d.document_type === type);

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
      const priorDoc = documents.find((d) => d.document_type === docType && d.side === side);
      if (priorDoc) {
        await supabase.storage.from("kyc-documents").remove([priorDoc.file_path]);
        await supabase.from("kyc_documents").delete().eq("id", priorDoc.id);
      }

      const { data: inserted, error: insertError } = await supabase
        .from("kyc_documents")
        .insert({ user_id: userId, document_type: docType, side, file_path: path })
        .select()
        .single();
      if (insertError) throw insertError;

      await supabase.from("users").update({ kyc_status: "pending" }).eq("id", userId);

      setDocuments((prev) => [...prev.filter((d) => d.id !== priorDoc?.id), inserted]);
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

  const handleRemove = async (doc: KycDocument) => {
    setRemoving(doc.id);
    try {
      const supabase = createClient();
      const { error: storageError } = await supabase.storage.from("kyc-documents").remove([doc.file_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from("kyc_documents").delete().eq("id", doc.id);
      if (dbError) throw dbError;

      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      logger.info("KYC document removed", { userId, documentId: doc.id });
      toast.success("Document removed. You can upload a replacement.");
      router.refresh();
    } catch (err) {
      logger.error("KYC document removal failed", { err });
      toast.error("Could not remove document. Please try again.");
    } finally {
      setRemoving(null);
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
                    <div key={side} className="relative">
                      <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 px-3 py-6 text-center hover:border-gold/40">
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
                          disabled={uploading === key || !!doc}
                        />
                      </label>
                      {doc && (
                        <button
                          type="button"
                          onClick={() => handleRemove(doc)}
                          disabled={removing === doc.id}
                          title="Remove and re-upload"
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-slate-surface text-text-muted hover:border-danger/40 hover:text-danger"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
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
