"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import { getReferralLink } from "@/lib/utils";

export default function ReferralLinkCard({ referralCode }: { referralCode: string }) {
  const [copied, setCopied] = useState(false);
  const link = getReferralLink(referralCode);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Referral link copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Creston Markets", url: link });
      } catch {
        // user cancelled share — no action needed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="glass-card-gold p-6">
      <h2 className="text-sm font-semibold text-text-primary">Your Referral Link</h2>
      <p className="mt-1 text-xs text-text-muted">Share this link to invite new investors.</p>

      <div className="mt-4 flex flex-col items-start gap-6 sm:flex-row">
        <div className="rounded-xl bg-white p-3">
          <QRCodeSVG value={link} size={112} />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <span className="min-w-0 flex-1 truncate text-sm text-text-primary/90">{link}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCopy} className="btn-secondary flex-1 !py-2 text-sm">
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy Link"}
            </button>
            <button onClick={handleShare} className="btn-primary flex-1 !py-2 text-sm">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
