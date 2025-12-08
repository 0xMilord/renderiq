import { redirect } from 'next/navigation';
import { getCachedUser } from '@/lib/services/auth-cache';
import { AmbassadorApplicationForm } from '@/components/ambassador/application-form';
import { AmbassadorDAL } from '@/lib/dal/ambassador';
import { AmbassadorFeatures } from '@/components/ambassador/ambassador-features';

export const dynamic = 'force-dynamic';

export default async function AmbassadorPage() {
  const { user } = await getCachedUser();

  // If user is logged in, check if they're already an ambassador
  if (user) {
    const ambassadorData = await AmbassadorDAL.getAmbassadorByUserId(user.id);
    // If they're already an ambassador, redirect to dashboard
    if (ambassadorData?.ambassador) {
      redirect('/dashboard/ambassador');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Become a Renderiq Ambassador
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our ambassador program and earn 25% commission on every subscription you refer. 
            Help architects and designers discover Renderiq while building your income.
          </p>
        </div>

        {/* Main Content: 3/4 Form, 1/4 Features */}
        <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Application Form - 3/4 width */}
          <div className="lg:col-span-3">
            <div className="bg-card border rounded-lg p-6 md:p-8">
              {user ? (
                <>
                  <h2 className="text-2xl font-semibold mb-2">Apply Now</h2>
                  <p className="text-muted-foreground mb-6">
                    Fill out the form below to apply for our ambassador program.
                  </p>
                  <AmbassadorApplicationForm />
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold mb-2">Apply Now</h2>
                  <p className="text-muted-foreground mb-6">
                    Please sign in to your account to apply for the ambassador program.
                  </p>
                  <div className="text-center py-8">
                    <a
                      href="/signup"
                      className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Sign Up to Apply
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Features Sidebar - 1/4 width */}
          <div className="lg:col-span-1">
            <AmbassadorFeatures />
          </div>
        </div>
      </div>
    </div>
  );
}

