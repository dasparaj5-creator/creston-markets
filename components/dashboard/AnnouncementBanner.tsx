import { Megaphone } from "lucide-react";
import type { Announcement } from "@/types";

export default function AnnouncementBanner({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) return null;

  return (
    <div className="space-y-2">
      {announcements.map((a) => (
        <div key={a.id} className="glass-card flex items-start gap-3 border-electric/20 p-4">
          <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
          <div>
            <p className="text-sm font-medium text-text-primary">{a.title}</p>
            <p className="mt-1 text-xs text-text-muted">{a.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
