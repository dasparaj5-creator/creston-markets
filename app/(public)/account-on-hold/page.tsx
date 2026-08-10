import Link from "next/link";
import { ShieldOff } from "lucide-react";
import Logo from "@/components/shared/Logo";

export default function AccountOnHoldPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <Logo className="justify-center" />
        <div className="glass-card mt-8 p-8">
          <ShieldOff className="mx-auto h-8 w-8 text-danger" />
          <h1 className="mt-4 text-xl font-bold text-text-primary">Account On Hold</h1>
          <p className="mt-3 text-sm text-text-muted">
            Your account has been temporarily placed on hold by our team. If you believe this is
            a mistake, please contact support at{" "}
            <a href="mailto:support@crestonmarkets.com" className="text-gold hover:underline">
              support@crestonmarkets.com
            </a>
            .
          </p>
          <Link href="/" className="btn-secondary mt-6 inline-flex">
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
