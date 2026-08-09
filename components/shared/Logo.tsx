import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center select-none", className)}>
      <Image
        src="/logo/creston-logo.png"
        alt="Creston Markets"
        width={220}
        height={131}
        priority
        className="h-9 w-auto sm:h-10"
      />
    </Link>
  );
}
