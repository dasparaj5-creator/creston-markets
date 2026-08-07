"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type { UserProfile } from "@/types";

export default function AdminTopbar({ profile }: { profile: UserProfile }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    logger.info("Admin logged out", { userId: profile.id });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-navy/80 px-4 backdrop-blur-glass sm:px-6">
      <p className="text-sm text-text-muted">
        Signed in as <span className="text-text-primary font-medium">{profile.email}</span>
      </p>
      <button onClick={handleLogout} className="btn-secondary !py-1.5 !px-3 text-xs">
        <LogOut className="h-3.5 w-3.5" /> Log Out
      </button>
    </header>
  );
}
