"use client";

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { createClient } from '../../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import ResumePreviewModal from "../../../components/ResumePreviewModal";
import ResumeUploader from "../../../components/ResumeUploader";
import { updatePreferredProvider, saveApiKey, deleteApiKey } from './actions';
import * as xlsx from 'xlsx';
import { getApplications } from '../../../lib/local/applications';
import { ClearLocalDataButton } from '../../../components/ClearLocalDataButton';
import { Alert } from '../../../components/ui/Alert';
import { messageTone } from '../../../lib/utils/message-tone';
import { Field } from '../../../components/ui/Field';
import { Button } from '../../../components/ui/Button';
import {
  SettingsSection,
  SettingsGroup,
  SettingsRow,
  SettingsFooter,
  SettingsSaveButton,
} from '../../../components/settings/SettingsLayout';

import { Application, Resume, Profile, AIModel, ApiKey } from '../../../lib/types';
import { resolveTryFirst, BYOK_PROVIDERS, PROVIDER_DISPLAY_NAMES, getProviderFromModel } from '../../../lib/ai/providers';

export default function SettingsClient({ 
  initialProfile, 
  applications,
  resumes: initialResumes,
  apiKeys: initialApiKeys,
  userEmail 
}: { 
  initialProfile: Profile; 
  applications: Application[];
  resumes: Resume[];
  apiKeys?: ApiKey[];
  userEmail: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // AI Providers State
  const [preferredProvider, setPreferredProvider] = useState<string | null>(resolveTryFirst(initialProfile.preferred_provider, (initialApiKeys ?? []).map(k => k.provider)));
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys || []);
  const [newKeyProvider, setNewKeyProvider] = useState('google');
  const [newApiKeyValue, setNewApiKeyValue] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState({ text: '', type: '' });
  const [providerMessage, setProviderMessage] = useState({ text: '', type: '' });
  const [deleteKeyMessage, setDeleteKeyMessage] = useState({ text: '', type: '' });

  // Handlers for AI Providers
  const handleUpdatePreferredProvider = async (provider: string) => {
    const previous = preferredProvider;
    setPreferredProvider(provider);
    setProviderMessage({ text: '', type: '' });
    const result = await updatePreferredProvider(provider);
    if (result?.error) {
      setPreferredProvider(previous);
      setProviderMessage({ text: result.error, type: 'error' });
    } else {
      setProviderMessage({ text: 'Preferred provider updated!', type: 'success' });
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        setAiModels(data.data);
        setPreferredModel(data.preferredModel);
      }
      router.refresh();
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiKeyValue.trim()) {
      setKeyMessage({ text: 'API key cannot be empty.', type: 'error' });
      return;
    }
    setIsSavingKey(true);
    setKeyMessage({ text: '', type: '' });
    
    const result = await saveApiKey(newKeyProvider, newApiKeyValue);
    if (result.error) {
      setKeyMessage({ text: result.error, type: 'error' });
    } else {
      setKeyMessage({ text: 'API key saved successfully!', type: 'success' });
      setNewApiKeyValue('');
      // Optimistically update the list
      const existingKeyIndex = apiKeys.findIndex(k => k.provider === newKeyProvider);
      const newKeyEntry = { provider: newKeyProvider, created_at: new Date().toISOString() };
      let newApiKeysList;
      if (existingKeyIndex >= 0) {
        const newKeys = [...apiKeys];
        newKeys[existingKeyIndex] = newKeyEntry;
        newApiKeysList = newKeys;
      } else {
        newApiKeysList = [...apiKeys, newKeyEntry];
      }
      setApiKeys(newApiKeysList);
      
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        setAiModels(data.data);
        setPreferredModel(data.preferredModel);
      }
      
      setPreferredProvider(resolveTryFirst(preferredProvider, newApiKeysList.map(k => k.provider)));
      router.refresh();
    }
    setIsSavingKey(false);
  };

  const handleDeleteApiKey = async (provider: string) => {
    setDeleteKeyMessage({ text: '', type: '' });
    const isLastKey = apiKeys.length === 1;
    let confirmMsg = `Are you sure you want to delete your ${PROVIDER_DISPLAY_NAMES[provider] || provider} API key?`;
    if (isLastKey) {
      confirmMsg += "\n\nYou will return to the shared AI pool; its lifetime free uses may already be used up.";
    }
    if (!window.confirm(confirmMsg)) return;
    
    const result = await deleteApiKey(provider);
    if (result.error) {
      setDeleteKeyMessage({ text: result.error, type: 'error' });
    } else {
      const newApiKeysList = apiKeys.filter(k => k.provider !== provider);
      setApiKeys(newApiKeysList);
      
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        setAiModels(data.data);
        setPreferredModel(data.preferredModel);
      }
      
      setPreferredProvider(resolveTryFirst(preferredProvider, newApiKeysList.map(k => k.provider)));
      router.refresh();
    }
  };

  // AI Models State
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [preferredModel, setPreferredModel] = useState<string>("");
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  useEffect(() => {
    const handlePageShow = async (event: PageTransitionEvent) => {
      if (event.persisted) {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          window.location.href = '/login?message=Session+expired.+Please+log+in+again.';
        }
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [supabase.auth]);

  useEffect(() => {
    setMounted(true);
    const fetchModels = async () => {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          setAiModels(data.data);
          setPreferredModel(data.preferredModel);
        }
      } catch (err) {
        console.error("Failed to fetch models", err);
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, []);

  // Profile Form
  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // Reminders Preferences
  const [reminderTimezone, setReminderTimezone] = useState(initialProfile.reminder_timezone || "");
  // DB might return "09:00:00", we should trim it to "09:00" for type="time"
  const [reminderSendTime, setReminderSendTime] = useState((initialProfile.reminder_send_time || "09:00").substring(0, 5));
  const [isSavingReminders, setIsSavingReminders] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const isSavingRemindersRef = useRef(false);

  const handleSaveReminders = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingRemindersRef.current) return;
    isSavingRemindersRef.current = true;
    setIsSavingReminders(true);
    setReminderMessage("");

    try {
      if (reminderTimezone) {
        new Intl.DateTimeFormat(undefined, { timeZone: reminderTimezone });
      }
    } catch (e) {
      setReminderMessage(`Error: Invalid timezone string "${reminderTimezone}".`);
      isSavingRemindersRef.current = false;
      setIsSavingReminders(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          reminder_timezone: reminderTimezone,
          reminder_send_time: reminderSendTime
        })
        .eq('id', initialProfile.id);

      if (error) {
        setReminderMessage(`Error: ${error.message}`);
      } else {
        setReminderMessage("Reminder preferences saved!");
        router.refresh();
      }
    } finally {
      isSavingRemindersRef.current = false;
      setIsSavingReminders(false);
    }
  };

  // Goals Preferences
  const [dailyGoal, setDailyGoal] = useState<number>(initialProfile.daily_goal ?? 5);
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState<boolean>(initialProfile.daily_summary_enabled ?? false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [goalMessage, setGoalMessage] = useState("");
  const isSavingGoalRef = useRef(false);

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingGoalRef.current) return;
    
    let targetGoal = dailyGoal;
    if (targetGoal < 1) targetGoal = 1;
    if (targetGoal > 50) targetGoal = 50;
    setDailyGoal(targetGoal);

    isSavingGoalRef.current = true;
    setIsSavingGoal(true);
    setGoalMessage("");

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          daily_goal: targetGoal,
          daily_summary_enabled: dailySummaryEnabled
        })
        .eq('id', initialProfile.id);

      if (error) {
        setGoalMessage(`Error: ${error.message}`);
      } else {
        setGoalMessage("Daily goal saved!");
        router.refresh();
      }
    } finally {
      isSavingGoalRef.current = false;
      setIsSavingGoal(false);
    }
  };

  // Resumes state
  const [resumes, setResumes] = useState(initialResumes);
  const [previewResumeId, setPreviewResumeId] = useState<string | null>(null);

  // Deletion Form
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [hasLocalData, setHasLocalData] = useState(false);

  useEffect(() => {
    getApplications().then((apps) => {
      setHasLocalData(apps && apps.length > 0);
    }).catch(err => {
      console.error("Failed to check local data:", err);
    });
  }, []);

  const isSavingProfileRef = useRef(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProfileRef.current) return;
    isSavingProfileRef.current = true;
    setIsSavingProfile(true);
    setProfileMessage("");

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', initialProfile.id);

      if (error) {
        setProfileMessage(`Error: ${error.message}`);
      } else {
        setProfileMessage("Profile updated successfully!");
        router.refresh();
      }
    } finally {
      isSavingProfileRef.current = false;
      setIsSavingProfile(false);
    }
  };

  const handleModelChange = async (modelName: string) => {
    setPreferredModel(modelName);
    
    // Update local state optimistic
    setAiModels(prev => prev.map(m => ({ ...m, is_preferred: m.name === modelName })));

    try {
       await supabase.from('profiles').update({ preferred_model: modelName, preferred_provider: getProviderFromModel(modelName) }).eq('id', initialProfile.id);
    } catch (e) {
       console.error("Failed to save preferred model", e);
    }
  };

  const handleExportData = (format: 'csv' | 'json' | 'xlsx') => {
    if (!applications || applications.length === 0) {
      alert("No applications to export.");
      return;
    }

    const fieldAllowlist = [
      'company_name',
      'role',
      'status',
      'date_applied',
      'location',
      'salary_range',
      'currency',
      'job_link',
      'source',
      'recruiter_name',
      'contact_info',
      'next_action',
      'next_action_date',
      'priority',
      'role_fit',
      'culture_fit',
      'interview_stage',
      'interview_notes',
      'rejection_reason',
      'notes',
      'tech_stack',
      'resume_version',
      'cover_letter_sent',
      'created_at',
      'updated_at'
    ];

    const processedData = applications.map(app => {
      const processed: Record<string, unknown> = {};
      
      fieldAllowlist.forEach(field => {
        let val = app[field as keyof Application];
        
        if (field === 'tech_stack' && Array.isArray(val)) {
          val = val.join(', ');
        }
        
        processed[field] = val !== null && val !== undefined ? val : "";
      });

      type AppWithStages = Application & { interview_stages?: { stage_name: string; stage_date: string }[] };
      const stages = (app as AppWithStages).interview_stages || [];
      if (stages.length > 0) {
        const sortedStages = [...stages].sort((a, b) => {
          const dateA = a.stage_date ? new Date(a.stage_date).getTime() : 0;
          const dateB = b.stage_date ? new Date(b.stage_date).getTime() : 0;
          return dateA - dateB;
        });
        
        const stagesString = sortedStages.map(s => {
          const dateStr = s.stage_date ? new Date(s.stage_date).toLocaleDateString() : 'No date';
          return `${s.stage_name} (${dateStr})`;
        }).join(' | ');
        
        processed['all_interview_stages'] = stagesString;
      } else {
        processed['all_interview_stages'] = "";
      }

      if (format === 'json') {
        processed['raw_jd'] = app.raw_jd || "";
      }

      return processed;
    });

    let blob: Blob;
    const filename = `applications_export.${format}`;

    if (format === 'csv') {
      const headers = Object.keys(processedData[0]);
      const csvContent = [
        headers.join(','),
        ...processedData.map(row => 
          headers.map(header => {
            const val = row[header];
            return `"${String(val).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');
      blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
    } else if (format === 'json') {
      blob = new Blob([JSON.stringify(processedData, null, 2)], { type: 'application/json' });
      
    } else if (format === 'xlsx') {
      const worksheet = xlsx.utils.json_to_sheet(processedData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Applications");
      
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    } else {
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadSuccess = (newResume: Resume, wasSetAsCurrent: boolean) => {
    router.refresh();
    if (wasSetAsCurrent) {
       setResumes(prev => prev.map(r => ({ ...r, is_current: false })).concat(newResume).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } else {
       setResumes(prev => [newResume, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setResumes(prev => prev.filter(r => r.id !== id));
      router.refresh();
    } catch (err: unknown) {
      alert("Failed to delete resume: " + (err as Error).message);
    }
  }

  const handleSetCurrentResume = async (id: string) => {
    try {
      const res = await fetch(`/api/resumes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_current: true })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setResumes(prev => prev.map(r => ({ ...r, is_current: r.id === id })));
      router.refresh();
    } catch (err: unknown) {
      alert("Failed to update current resume: " + (err as Error).message);
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteEmail !== userEmail) return;
    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }
      
      await supabase.auth.signOut();
      router.push('/login?message=Your+account+has+been+deleted.');
    } catch (err: unknown) {
      setDeleteError((err as Error).message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel 1: Account */}
      <SettingsSection
        id="account"
        eyebrow="01 / ACCOUNT"
        title="Account"
        description="Your name and how the app looks."
      >
        <SettingsGroup title="Profile">
          <form onSubmit={handleSaveProfile}>
            <SettingsRow
              htmlFor="account-email"
              label="Email"
              hint="Used to sign in."
            >
              <div className="max-w-[400px]">
                <Field
                  variant="input"
                  id="account-email"
                  type="email"
                  value={userEmail}
                  readOnly
                  className="bg-row-hover text-muted-ink"
                />
              </div>
            </SettingsRow>
            <SettingsRow htmlFor="account-name" label="Full name">
              <div className="max-w-[400px]">
                <Field
                  variant="input"
                  id="account-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </SettingsRow>
            <SettingsFooter
              status={profileMessage}
              isError={messageTone(profileMessage) === 'error'}
            >
              <SettingsSaveButton
                type="submit"
                disabled={isSavingProfile || fullName === initialProfile.full_name}
              >
                {isSavingProfile ? "Saving..." : "Save profile"}
              </SettingsSaveButton>
            </SettingsFooter>
          </form>
        </SettingsGroup>
        <SettingsGroup title="Appearance">
          <SettingsRow label="Theme" hint="Applies immediately.">
            <div role="group" aria-label="Theme" className="flex max-w-[400px] min-h-[44px]">
              {mounted &&
                ['light', 'dark', 'system'].map((t, idx) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={theme === t}
                    onClick={() => setTheme(t)}
                    className={`flex-1 min-h-[44px] px-4 border border-field-border font-medium capitalize focus-ink ${
                      idx === 0 ? 'rounded-l-ledger' : idx === 2 ? 'rounded-r-ledger' : ''
                    } ${idx > 0 ? '-ml-px' : ''} ${
                      theme === t
                        ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]'
                        : 'bg-card text-ink hover:bg-row-hover'
                    }`}
                  >
                    {t}
                  </button>
                ))}
            </div>
          </SettingsRow>
        </SettingsGroup>
      </SettingsSection>

      {/* Panel 2: Reminders and goals */}
      <SettingsSection
        id="reminders"
        eyebrow="02 / REMINDERS"
        title="Reminders and goals"
        description="When we email you, and your daily target."
      >
        <SettingsGroup title="Reminder time">
          <form onSubmit={handleSaveReminders}>
            <SettingsRow
              htmlFor="reminder-timezone"
              label="Timezone"
              hint="Reminders follow your local clock."
            >
              <div className="flex flex-wrap gap-2 max-w-[400px]">
                <div className="flex-1 min-w-[160px]">
                  <Field
                    variant="input"
                    id="reminder-timezone"
                    type="text"
                    value={reminderTimezone}
                    onChange={(e) => setReminderTimezone(e.target.value)}
                  />
                </div>
                <Button
                  variant="secondary"
                  type="button"
                  className="px-4 shrink-0 whitespace-nowrap"
                  onClick={() => setReminderTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)}
                >
                  Auto-detect
                </Button>
              </div>
            </SettingsRow>
            <SettingsRow htmlFor="reminder-send-time" label="Send time">
              <div className="max-w-[140px]">
                <Field
                  variant="input"
                  id="reminder-send-time"
                  type="time"
                  value={reminderSendTime}
                  onChange={(e) => setReminderSendTime(e.target.value)}
                />
              </div>
            </SettingsRow>
            <SettingsFooter
              status={reminderMessage}
              isError={messageTone(reminderMessage) === 'error'}
            >
              <SettingsSaveButton
                type="submit"
                disabled={
                  isSavingReminders ||
                  (reminderTimezone === initialProfile.reminder_timezone &&
                    reminderSendTime ===
                      (initialProfile.reminder_send_time || "09:00").substring(0, 5))
                }
              >
                {isSavingReminders ? "Saving..." : "Save preferences"}
              </SettingsSaveButton>
            </SettingsFooter>
          </form>
        </SettingsGroup>
        <SettingsGroup title="Daily goal">
          <form onSubmit={handleSaveGoal}>
            <SettingsRow
              htmlFor="daily-goal"
              label="Applications per day"
              hint="Between 1 and 50."
            >
              <div className="max-w-[110px]">
                <Field
                  variant="input"
                  id="daily-goal"
                  type="number"
                  min="1"
                  max="50"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value) || 1)}
                />
              </div>
            </SettingsRow>
            <SettingsRow
              label="Daily summary"
              hint="Streak and goal email around 8:00 PM."
            >
              <div className="max-w-[400px]">
                <Field
                  variant="toggle"
                  id="daily-summary-toggle"
                  label="Send daily summary"
                  checked={dailySummaryEnabled}
                  onChange={(e) => setDailySummaryEnabled(e.target.checked)}
                />
              </div>
            </SettingsRow>
            <SettingsFooter
              status={goalMessage}
              isError={messageTone(goalMessage) === 'error'}
            >
              <SettingsSaveButton
                type="submit"
                disabled={
                  isSavingGoal ||
                  (dailyGoal === (initialProfile.daily_goal ?? 5) &&
                    dailySummaryEnabled === (initialProfile.daily_summary_enabled ?? false))
                }
              >
                {isSavingGoal ? "Saving..." : "Save goal"}
              </SettingsSaveButton>
            </SettingsFooter>
          </form>
        </SettingsGroup>
      </SettingsSection>

      {/* Panel 3: AI and keys */}
      <SettingsSection
        id="ai"
        eyebrow="03 / AI & KEYS"
        title="AI and keys"
        description="Which provider and model run extraction and matching."
      >
        {((apiKeys.length === 0 && typeof initialProfile.free_ai_uses_remaining === 'number') ||
          apiKeys.length >= 2) && (
          <SettingsGroup title="Provider">
            {apiKeys.length === 0 && typeof initialProfile.free_ai_uses_remaining === 'number' && (
              <SettingsRow
                label="Free AI uses"
                hint="Shown when no API key is saved."
              >
                <span className="font-medium text-ink tabular-nums">
                  {initialProfile.free_ai_uses_remaining} of 5 remaining
                </span>
              </SettingsRow>
            )}
            {apiKeys.length >= 2 && (
              <SettingsRow
                htmlFor="active-provider"
                label="Active provider"
                hint="Default for extraction and matching."
              >
                <div className="max-w-[280px]">
                  <Field
                    variant="select"
                    id="active-provider"
                    value={preferredProvider || ''}
                    onChange={(e) => handleUpdatePreferredProvider(e.target.value)}
                  >
                    {apiKeys.map((k) => (
                      <option key={k.provider} value={k.provider}>
                        {PROVIDER_DISPLAY_NAMES[k.provider] || k.provider}
                      </option>
                    ))}
                  </Field>
                </div>
                {providerMessage.text && (
                  <p
                    role="status"
                    className={`mt-2 text-sm ${providerMessage.type === 'error' ? 'text-red-700 dark:text-red-400' : 'text-ink'}`}
                  >
                    {providerMessage.text}
                  </p>
                )}
              </SettingsRow>
            )}
          </SettingsGroup>
        )}

        <SettingsGroup title="API keys">
          <SettingsRow
            label="Saved keys"
            hint="Securely provide your own API keys to bypass global usage limits."
          >
            {apiKeys.length === 0 ? (
              <p className="text-sm text-muted-ink">
                No custom API keys saved. Using global fallback.
              </p>
            ) : (
              <div>
                {apiKeys.map((key) => (
                  <div
                    key={key.provider}
                    className="mt-2 first:mt-0 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3 border border-hairline rounded-ledger"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-ink break-words">
                        {PROVIDER_DISPLAY_NAMES[key.provider] || key.provider}
                      </p>
                      <p className="text-sm text-muted-ink">
                        Added: {new Date(key.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteApiKey(key.provider)}
                      className="min-h-[44px] sm:min-h-[36px] px-3 rounded-ledger border border-red-700 dark:border-red-500 bg-transparent text-sm font-medium text-red-700 dark:text-red-400 hover:bg-row-hover focus-ink"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
            {deleteKeyMessage.text && (
              <p
                role="status"
                className={`mt-2 text-sm ${deleteKeyMessage.type === 'error' ? 'text-red-700 dark:text-red-400' : 'text-ink'}`}
              >
                {deleteKeyMessage.text}
              </p>
            )}
          </SettingsRow>

          <form onSubmit={handleSaveApiKey}>
            <SettingsRow
              htmlFor="new-key-value"
              label="Add or update a key"
              hint={
                <>
                  Don&apos;t have an API key? Get one for free at{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-ink"
                  >
                    Google AI Studio
                  </a>{' '}
                  or{' '}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-ink"
                  >
                    Groq Console
                  </a>
                  .
                </>
              }
            >
              <div className="flex flex-wrap gap-2 max-w-[560px]">
                <div className="w-full sm:w-[190px]">
                  <Field
                    variant="select"
                    id="new-key-provider"
                    aria-label="Provider"
                    value={newKeyProvider}
                    onChange={(e) => setNewKeyProvider(e.target.value)}
                  >
                    {BYOK_PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {PROVIDER_DISPLAY_NAMES[p] || p}
                      </option>
                    ))}
                  </Field>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Field
                    variant="input"
                    id="new-key-value"
                    type="password"
                    placeholder="Enter your API key"
                    value={newApiKeyValue}
                    onChange={(e) => setNewApiKeyValue(e.target.value)}
                  />
                </div>
              </div>
            </SettingsRow>
            <SettingsFooter
              status={keyMessage.text}
              isError={keyMessage.type === 'error'}
            >
              <SettingsSaveButton
                type="submit"
                disabled={isSavingKey || !newApiKeyValue.trim()}
              >
                {isSavingKey ? "Saving..." : "Save API key"}
              </SettingsSaveButton>
            </SettingsFooter>
          </form>
        </SettingsGroup>

        <SettingsGroup title="Model">
          {apiKeys.length > 0 && (
            <Alert className="mb-3">
              BYOK Active &mdash; your own quota, not shared limits
            </Alert>
          )}
          <SettingsRow
            label="Preferred model"
            hint="Saves as soon as you pick one. If it is exhausted, the next available model is used."
          >
            {isLoadingModels ? (
              <p className="text-sm text-muted-ink">Loading models...</p>
            ) : (
              <div role="radiogroup" aria-label="Preferred model">
                {aiModels.map((model) => {
              const isBlocked = apiKeys.length === 0 && model.blocked_until && new Date(model.blocked_until) > new Date();
              const isExhausted = apiKeys.length === 0 && model.request_count >= model.dailyLimit;
              const unavailable = isBlocked || isExhausted;
              const isPreferred = model.name === preferredModel;
              
              let statusText = `${model.request_count} / ${model.dailyLimit} used today`;
              if (isBlocked && model.blocked_until) {
                const blockDate = new Date(model.blocked_until);
                const tomorrow = new Date(); 
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                if (blockDate > tomorrow) {
                  statusText = 'Model Unavailable (Deprecated)';
                } else {
                  statusText = `Blocked until ${blockDate.toLocaleTimeString()}`;
                }
              } else if (isExhausted) {
                statusText = `Daily limit reached`;
              }
              
              // Find active model: the first one in priority order (preferred first, then default order) that is not unavailable
              const orderedModels = [
                ...aiModels.filter(m => m.name === preferredModel),
                ...aiModels.filter(m => m.name !== preferredModel)
              ];
              const activeModel = orderedModels.find(m => {
                const mb = apiKeys.length === 0 && m.blocked_until && new Date(m.blocked_until) > new Date();
                const me = apiKeys.length === 0 && m.request_count >= m.dailyLimit;
                return !mb && !me;
              });
              
              const isCurrentlyActiveFallback = unavailable && isPreferred && activeModel;

                  return (
                    <label
                      htmlFor={`model-${model.name}`}
                      key={model.name}
                      className={`grid grid-cols-[20px_minmax(0,1fr)] gap-3 p-3 mt-2 first:mt-0 border rounded-ledger cursor-pointer focus-within:ring-2 focus-within:ring-[var(--ink)] ${
                        isPreferred
                          ? 'border-ink bg-[color-mix(in_srgb,var(--ink)_10%,transparent)]'
                          : 'border-hairline bg-card hover:bg-row-hover'
                      } ${unavailable ? 'border-dashed' : ''}`}
                    >
                      <input
                        type="radio"
                        id={`model-${model.name}`}
                        name="ai_model"
                        checked={isPreferred}
                        onChange={() => handleModelChange(model.name)}
                        className="mt-1 w-5 h-5 accent-ink"
                      />
                      <span className="block min-w-0">
                        <span className="flex items-start justify-between gap-2">
                          <span className="font-medium text-ink break-words">{model.name}</span>
                          {isPreferred && (
                            <span className="inline-flex items-center h-[22px] px-2 rounded-ledger border border-ink bg-[var(--ink)] text-[var(--paper)] font-label text-[11px] uppercase tracking-wider whitespace-nowrap">
                              Preferred
                            </span>
                          )}
                          {unavailable && (
                            <span className="inline-flex items-center h-[22px] px-2 rounded-ledger border border-red-700 dark:border-red-500 text-red-700 dark:text-red-400 font-label text-[11px] uppercase tracking-wider whitespace-nowrap">
                              Unavailable
                            </span>
                          )}
                        </span>
                        <span className="block text-sm text-muted-ink mt-0.5">{model.description}</span>
                        {apiKeys.length === 0 && (
                          <>
                            <span className="block mt-2 h-1.5 max-w-[280px] bg-[color-mix(in_srgb,var(--ink)_10%,transparent)]">
                              <span
                                className={`block h-full ${unavailable ? 'bg-red-700 dark:bg-red-500' : 'bg-[var(--ink)]'}`}
                                style={{ width: `${Math.min(100, (model.request_count / model.dailyLimit) * 100)}%` }}
                              />
                            </span>
                            <span className={`block mt-1 text-sm ${unavailable ? 'text-red-700 dark:text-red-400' : 'text-muted-ink'}`}>
                              {statusText}
                            </span>
                          </>
                        )}
                        {isCurrentlyActiveFallback && (
                          <span className="block mt-2 text-sm text-ink border border-field-border rounded-ledger px-3 py-2">
                            Currently unavailable. Falling back to <strong>{activeModel.name}</strong>.
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </SettingsRow>
        </SettingsGroup>
      </SettingsSection>


      {/* Resumes Section */}
      <SettingsSection id="resumes" eyebrow="04 / RESUMES" title="Resumes" description="Upload versions and choose the default for fit analysis.">
        <SettingsGroup title="Upload">
          <ResumeUploader onSuccess={handleUploadSuccess} layout="rows" />
        </SettingsGroup>
        <SettingsGroup title="Saved resumes">
          {resumes.length === 0 ? (
            <p className="text-sm text-muted-ink">No resumes uploaded yet.</p>
          ) : (
            resumes.map(r => (
              <div key={r.id} className="mt-2 first:mt-0 grid grid-cols-1 gap-3 p-3 border border-hairline rounded-ledger sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <button type="button" onClick={() => setPreviewResumeId(r.id)} className="font-medium link-ink text-left break-words">
                    {r.version_label}
                  </button>
                  <p className="text-sm text-muted-ink">
                    Uploaded: {new Date(r.created_at).toLocaleDateString()}
                    {r.extracted_text === null && <span className="ml-2 text-red-700 dark:text-red-400">(Text extraction failed)</span>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {r.is_current && (
                    <span className="inline-flex items-center h-[22px] px-2 rounded-ledger border border-ink text-ink font-label text-[11px] uppercase tracking-wider whitespace-nowrap">
                      Current
                    </span>
                  )}
                  {!r.is_current && (
                    <button
                      type="button"
                      onClick={() => handleSetCurrentResume(r.id)}
                      className="min-h-[44px] sm:min-h-[36px] px-3 rounded-ledger border border-field-border bg-card text-sm font-medium text-ink hover:bg-row-hover focus-ink"
                    >
                      Set as current
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteResume(r.id)}
                    className="min-h-[44px] sm:min-h-[36px] px-3 rounded-ledger border border-red-700 dark:border-red-500 bg-transparent text-sm font-medium text-red-700 dark:text-red-400 hover:bg-row-hover focus-ink"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </SettingsGroup>
      </SettingsSection>

      {/* Data Export */}
      <SettingsSection id="data" eyebrow="05 / DATA" title="Data export" description="Download a complete copy of all your tracked applications.">
        <div className="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-3">
          <div className="flex flex-col justify-between gap-3 p-4 border border-hairline rounded-ledger">
            <div>
              <h3 className="font-medium text-ink">CSV</h3>
              <p className="text-sm text-muted-ink mt-0.5">Opens in any spreadsheet. Excludes job descriptions.</p>
            </div>
            <Button variant="secondary" type="button" className="w-full px-4" onClick={() => handleExportData('csv')}>
              Download CSV
            </Button>
          </div>
          <div className="flex flex-col justify-between gap-3 p-4 border border-hairline rounded-ledger">
            <div>
              <h3 className="font-medium text-ink">JSON</h3>
              <p className="text-sm text-muted-ink mt-0.5">Full record, including job descriptions.</p>
            </div>
            <Button variant="secondary" type="button" className="w-full px-4" onClick={() => handleExportData('json')}>
              Download JSON
            </Button>
          </div>
          <div className="flex flex-col justify-between gap-3 p-4 border border-hairline rounded-ledger">
            <div>
              <h3 className="font-medium text-ink">XLSX</h3>
              <p className="text-sm text-muted-ink mt-0.5">Excel workbook. Excludes job descriptions.</p>
            </div>
            <Button variant="secondary" type="button" className="w-full px-4" onClick={() => handleExportData('xlsx')}>
              Download XLSX
            </Button>
          </div>
        </div>
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection id="danger" eyebrow="06 / DANGER ZONE" title="Danger zone" description="Permanent actions. These cannot be undone.">
        {deleteStep === 0 && (
          <div className={`grid grid-cols-1 gap-3 mt-4 ${hasLocalData ? 'sm:grid-cols-2' : 'max-w-[480px]'}`}>
            <div className="flex flex-col justify-between gap-3 p-4 border border-red-700 dark:border-red-500 rounded-ledger">
              <div>
                <h3 className="font-medium text-ink">Delete account</h3>
                <p className="text-sm text-muted-ink mt-0.5">Permanently delete your account and all associated applications. This action cannot be undone.</p>
              </div>
              <button type="button" onClick={() => setDeleteStep(1)} className="inline-flex w-full items-center justify-center px-4 min-h-[44px] rounded-ledger border border-red-700 dark:border-red-500 bg-transparent text-sm font-medium text-red-700 dark:text-red-400 hover:bg-row-hover focus-ink">
                Delete account
              </button>
            </div>
            {hasLocalData && (
              <div className="flex flex-col justify-between gap-3 p-4 border border-hairline rounded-ledger">
                <div>
                  <h3 className="font-medium text-ink">Clear local data</h3>
                  <p className="text-sm text-muted-ink mt-0.5">Removes Local Mode applications stored in this browser. Your account data is not affected.</p>
                </div>
                <ClearLocalDataButton />
              </div>
            )}
          </div>
        )}
        {deleteStep === 1 && (
          <div role="group" aria-label="Confirm account deletion" className="mt-4 p-4 border border-red-700 dark:border-red-500 rounded-ledger">
            <p className="font-medium text-ink">Are you sure you want to delete your account? This cannot be undone.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" type="button" className="px-4" autoFocus onClick={() => setDeleteStep(0)}>
                Cancel
              </Button>
              <button type="button" onClick={() => setDeleteStep(2)} className="min-h-[44px] px-4 rounded-ledger bg-red-700 dark:bg-red-800 text-white font-medium hover:opacity-90 transition-opacity focus-ink">
                Continue
              </button>
            </div>
          </div>
        )}
        {deleteStep === 2 && (
          <div role="group" aria-label="Confirm account deletion" className="mt-4 p-4 border border-red-700 dark:border-red-500 rounded-ledger">
            <label htmlFor="delete-confirm-email" className="block text-sm font-medium text-ink mb-2">
              Type <span className="font-bold select-all break-all">{userEmail}</span> to confirm
            </label>
            <div className="max-w-[400px]">
              <Field variant="input" id="delete-confirm-email" type="email" autoFocus value={deleteEmail} onChange={(e) => setDeleteEmail(e.target.value)} />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" type="button" className="px-4" onClick={() => { setDeleteStep(0); setDeleteEmail(""); setDeleteError(""); }}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteEmail !== userEmail}
                className="min-h-[44px] px-4 sm:min-w-[176px] rounded-ledger bg-red-700 dark:bg-red-800 text-white font-medium hover:opacity-90 transition-opacity focus-ink disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete account"}
              </button>
            </div>
            {deleteError && <p role="status" className="mt-2 text-sm text-red-700 dark:text-red-400">{deleteError}</p>}
          </div>
        )}
      </SettingsSection>
      <ResumePreviewModal resumeId={previewResumeId} onClose={() => setPreviewResumeId(null)} />
    </div>
  );
}
