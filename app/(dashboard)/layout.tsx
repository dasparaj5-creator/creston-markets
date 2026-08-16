import { requireUser } from "@/lib/auth";
import { DashboardSidebar, DashboardBottomNav } from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Note: the terms_accepted_at gate (redirecting incomplete Google OAuth
  // profiles to /dashboard/complete-profile) is enforced in middleware.ts,
  // not here -- middleware has reliable access to the request path, while
  // this Server Component layout does not without fragile header reads.
  const profile = await requireUser();

  return (
    <div className="min-h-screen bg-navy">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardTopbar profile={profile} />
        <main className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
      <DashboardBottomNav />
    </div>
  );
}
