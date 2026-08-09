import { requireUser } from "@/lib/auth";
import { DashboardSidebar, DashboardBottomNav } from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import RiskBanner from "@/components/shared/RiskBanner";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser();

  return (
    <div className="min-h-screen bg-navy">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardTopbar profile={profile} />
        <main className="px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <RiskBanner variant="full" dismissible storageKey="cm_dashboard_risk_dismissed" />
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
      <DashboardBottomNav />
    </div>
  );
}
