import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 select-none", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-dark">
        <TrendingUp className="h-4 w-4 text-navy" strokeWidth={2.5} />
      </span>
      <span className="text-lg font-bold tracking-tight text-text-primary">
        Creston <span className="text-gold">Markets</span>
      </span>
    </Link>
  );
}
