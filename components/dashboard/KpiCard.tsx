import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  trendPositive,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-gold">
          <Icon className="h-4 w-4" />
        </span>
        {trend && (
          <span className={cn("text-xs font-medium", trendPositive ? "text-success" : "text-danger")}>
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{label}</p>
    </div>
  );
}
