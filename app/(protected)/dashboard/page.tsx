import { createClient } from '../../../lib/supabase/server';
import { getCachedApplications } from '../../../lib/cache/applications';
import { getCachedQuoteOfTheDay } from '../../../lib/cache/quotes';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import Link from 'next/link';
import LogoutButton from '../../../components/LogoutButton';
import { ThemeToggle } from '../../../components/ThemeToggle';
import { Settings } from 'lucide-react';
import { Application } from '../../../lib/types';
import { PageHeader } from '../../../components/ui/PageHeader';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let firstName = 'Guest';
  let applications: Application[] = [];
  let profile = null;

  const quote = getCachedQuoteOfTheDay();

  if (user) {
    try {
      const [profileResult, applicationsResult] = await Promise.all([
        supabase.from('profiles').select('full_name, reminder_timezone, created_at, daily_goal').eq('id', user.id).single(),
        getCachedApplications(user.id),
      ]);
      profile = profileResult.data;
      applications = applicationsResult;
    } catch (error) {
      console.error("Error fetching applications:", error);
      return <div className="p-8 text-red-500 dark:text-red-400">Failed to load applications.</div>;
    }

    if (!profile) {
      redirect('/onboarding');
    }

    firstName = profile.full_name.split(' ')[0];
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 text-gray-900 dark:text-zinc-100">
      <PageHeader
        eyebrow="01 / DASHBOARD"
        title={`Welcome, ${firstName}!`}
        actions={
          <>
            <ThemeToggle />
            {user && (
              <Link
                href="/settings"
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center btn-secondary rounded-ledger text-muted-ink hover:text-ink transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}
            {user ? (
              <LogoutButton />
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 min-h-[44px] flex items-center justify-center btn-secondary rounded-ledger font-medium"
              >
                Log in
              </Link>
            )}
            <Link
              href="/new"
              className="px-4 py-2 min-h-[44px] flex items-center justify-center btn-primary rounded-ledger font-medium"
            >
              + New Application
            </Link>
          </>
        }
      />
      
      {/* Pass the loaded data down to the interactive client component */}
      <DashboardClient initialApplications={applications} isLocal={!user} timezone={user ? profile?.reminder_timezone : null} accountCreatedAt={user ? profile?.created_at : null} dailyGoal={user ? profile?.daily_goal : 5} quote={quote} />
    </div>
  );
}
