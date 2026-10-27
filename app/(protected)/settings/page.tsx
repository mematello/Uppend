import { createClient } from '../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  // Fetch applications for CSV export
  const { data: applications, error: appError } = await supabase
    .from('applications')
    .select('*, interview_stages(*)')
    .eq('user_id', user.id);

  if (appError) {
    console.error("Error fetching applications:", appError);
  }

  // Fetch resumes
  const { data: resumes, error: resumesError } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (resumesError) {
    console.error("Error fetching resumes:", resumesError);
  }

  // Fetch safe API Keys metadata (explicitly excluding encrypted_key, iv, auth_tag)
  const { data: apiKeys, error: keysError } = await supabase
    .from('user_api_keys')
    .select('provider, created_at')
    .eq('user_id', user.id);

  if (keysError) {
    console.error("Error fetching API keys metadata:", keysError);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
      <Link
        href="/dashboard"
        className="btn-secondary rounded-ledger min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 mb-4"
        aria-label="Back"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      </Link>

      <PageHeader eyebrow="04 / SETTINGS" title="Settings" />

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 items-start">
        <nav aria-label="Settings sections" className="hidden lg:block lg:sticky lg:top-6">
          <a
            href="#account"
            className="font-label text-xs uppercase tracking-wider flex items-center min-h-[40px] px-3 border-l-2 border-hairline text-ink hover:bg-row-hover hover:border-ink focus-ink"
          >
            01 / Account
          </a>
          <a
            href="#reminders"
            className="font-label text-xs uppercase tracking-wider flex items-center min-h-[40px] px-3 border-l-2 border-hairline text-ink hover:bg-row-hover hover:border-ink focus-ink"
          >
            02 / Reminders
          </a>
          <a
            href="#ai"
            className="font-label text-xs uppercase tracking-wider flex items-center min-h-[40px] px-3 border-l-2 border-hairline text-ink hover:bg-row-hover hover:border-ink focus-ink"
          >
            03 / AI &amp; keys
          </a>
          <a
            href="#resumes"
            className="font-label text-xs uppercase tracking-wider flex items-center min-h-[40px] px-3 border-l-2 border-hairline text-ink hover:bg-row-hover hover:border-ink focus-ink"
          >
            04 / Resumes
          </a>
          <a
            href="#data"
            className="font-label text-xs uppercase tracking-wider flex items-center min-h-[40px] px-3 border-l-2 border-hairline text-ink hover:bg-row-hover hover:border-ink focus-ink"
          >
            05 / Data
          </a>
          <a
            href="#danger"
            className="font-label text-xs uppercase tracking-wider flex items-center min-h-[40px] px-3 border-l-2 border-hairline text-ink hover:bg-row-hover hover:border-ink focus-ink"
          >
            06 / Danger zone
          </a>
        </nav>

        <div className="min-w-0">
          <SettingsClient
            initialProfile={profile}
            applications={applications || []}
            resumes={resumes || []}
            apiKeys={apiKeys || []}
            userEmail={user.email || ""}
          />
        </div>
      </div>
    </div>
  );
}
