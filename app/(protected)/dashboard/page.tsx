import { createClient } from '../../../lib/supabase/server';
import { getCachedApplications } from '../../../lib/cache/applications';
import { getCachedQuoteOfTheDay } from '../../../lib/cache/quotes';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import Link from 'next/link';
import LogoutButton from '../../../components/LogoutButton';
import { ThemeToggle } from '../../../components/ThemeToggle';
import { Settings, Plus } from 'lucide-react';
import { Application } from '../../../lib/types';
import Image from 'next/image';
import { PageHeader } from '../../../components/ui/PageHeader';
import MobileNavMenu from '../../../components/MobileNavMenu';

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
    <div className="max-w-6xl mx-auto p-4 md:p-8 text-ink">
      <nav aria-label="App" className="sticky top-0 z-30 -mx-4 -mt-4 px-4 pt-4 bg-paper sm:static sm:z-auto sm:mx-0 sm:mt-0 sm:px-0 sm:pt-0 sm:bg-transparent flex items-center justify-between pb-3 mb-6 border-b border-hairline">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 min-h-[44px] shrink-0"
          aria-label="Uppend Home"
        >
          <Image
            src="/images/uppend-logo.jpg"
            alt="Uppend Logo"
            width={28}
            height={28}
            className="rounded-sm object-contain"
            priority
          />
          <span className="text-lg font-semibold tracking-tight text-ink font-label">
            Uppend
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-1 sm:gap-2">
          <ThemeToggle label="Theme" />
          {user && (
            <Link
              href="/settings"
              className="font-label text-xs uppercase tracking-wider text-muted-ink hover:text-ink min-h-[44px] min-w-[44px] px-2 inline-flex items-center justify-center transition-colors focus-ink"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 sm:hidden" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          )}
          {user ? (
            <LogoutButton />
          ) : (
            <Link
              href="/login"
              className="font-label text-xs uppercase tracking-wider text-muted-ink hover:text-ink min-h-[44px] min-w-[44px] px-2 inline-flex items-center justify-center transition-colors focus-ink"
              title="Log in"
              aria-label="Log in"
            >
              Log in
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <Link
            href="/new"
            aria-label="New application"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center bg-accent text-on-accent border border-ink rounded-ledger transition-colors focus-ink"
          >
            <Plus className="w-5 h-5" strokeWidth={1.75} />
          </Link>
          <MobileNavMenu isLoggedIn={!!user} />
        </div>
      </nav>

      <PageHeader
        eyebrow="01 / DASHBOARD"
        title={`Welcome, ${firstName}!`}
        hideActionsOnMobile
        actions={
          <Link
            href="/new"
            className="px-4 py-2 min-h-[44px] flex items-center justify-center btn-primary rounded-ledger font-medium"
          >
            + New Application
          </Link>
        }
      />
      
      {/* Pass the loaded data down to the interactive client component */}
      <DashboardClient initialApplications={applications} isLocal={!user} timezone={user ? profile?.reminder_timezone : null} accountCreatedAt={user ? profile?.created_at : null} dailyGoal={user ? profile?.daily_goal : 5} quote={quote} />
    </div>
  );
}
