import { redirect } from 'next/navigation';
import { getCachedUser } from '@/lib/services/auth-cache';
import { AmbassadorDashboard } from '@/components/ambassador/ambassador-dashboard';
import { getAmbassadorDashboardAction } from '@/lib/actions/ambassador.actions';

export const dynamic = 'force-dynamic';

export default async function AmbassadorDashboardPage() {
  const { user } = await getCachedUser();

  if (!user) {
    redirect('/login');
  }

  // Get full dashboard data using the action (optimized)
  const dashboardResult = await getAmbassadorDashboardAction();

  return (
    <div className="h-full w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <AmbassadorDashboard 
          initialAmbassador={dashboardResult.success && dashboardResult.data ? dashboardResult.data.ambassador : null}
          initialDashboardData={dashboardResult.success && dashboardResult.data ? dashboardResult.data : null}
        />
      </div>
    </div>
  );
}

