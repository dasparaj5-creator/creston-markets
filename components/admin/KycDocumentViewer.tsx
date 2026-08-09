"use client";

import { useState } from "react";
import { FileText, ImageIcon, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type { KycDocument, KycDocumentType } from "@/types";

const DOCUMENT_TYPE_LABELS: Record<KycDocumentType, string> = {
  personal_id: "Personal ID",
  aadhar_card: "Aadhar Card",
  license: "Driving License",
  passport: "Passport",
  pan_card: "PAN Card",
  voter_id: "Voter ID",
  bank_statement: "Bank Statement",
};

export default function KycDocumentViewer({ documents }: { documents: KycDocument[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const grouped = documents.reduce<Record<string, KycDocument[]>>((acc, doc) => {
    acc[doc.document_type] = acc[doc.document_type] ?? [];
    acc[doc.document_type].push(doc);
    return acc;
  }, {});

  const handleView = async (doc: KycDocument) => {
    setLoadingId(doc.id);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("kyc-documents")
        .createSignedUrl(doc.file_path, 300);

      if (error || !data?.signedUrl) throw error;

      window.open(data.signedUrl, "_blank");
      logger.info("Admin viewed KYC document", { documentId: doc.id, type: doc.document_type });
    } catch (err) {
      logger.error("Failed to generate signed URL for KYC document", { err });
    } finally {
      setLoadingId(null);
    }
  };

  if (documents.length === 0) {
    return <p className="text-sm text-text-muted">No documents uploaded yet.</p>;
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([type, docs]) => (
        <div key={type} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <p className="mb-3 text-sm font-medium text-text-primary">
            {DOCUMENT_TYPE_LABELS[type as KycDocumentType]}
          </p>
          <div className="flex flex-wrap gap-3">
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleView(doc)}
                disabled={loadingId === doc.id}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-text-primary/90 hover:border-gold/40 hover:text-gold"
              >
                {doc.file_path.toLowerCase().endsWith(".pdf") ? (
                  <FileText className="h-3.5 w-3.5" />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5" />
                )}
                {doc.side === "front" ? "Front" : "Back"}
                <ExternalLink className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
