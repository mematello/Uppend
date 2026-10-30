"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import ResumeUploader from '../../../components/ResumeUploader';
import OnboardingBackdrop from '../../../components/onboarding/OnboardingBackdrop';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [detectedTz, setDetectedTz] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    try {
      setDetectedTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch (e) {
      setDetectedTz("UTC");
    }
  }, []);

  const isSavingRef = useRef(false);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (isSavingRef.current) return;
    
    isSavingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ id: user.id, full_name: name.trim() });

      if (insertError) {
        setError(insertError.message);
      } else {
        setStep(2);
      }
    } finally {
      isSavingRef.current = false;
      setLoading(false);
    }
  };

  const handleTimeSubmit = async (e: React.FormEvent, skip = false) => {
    if (e) e.preventDefault();
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const timeToSave = skip ? "09:00" : reminderTime;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          reminder_timezone: detectedTz, 
          reminder_send_time: timeToSave 
        })
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
      } else {
        setStep(3);
      }
    } finally {
      isSavingRef.current = false;
      setLoading(false);
    }
  };

  const STEPS = ['Name', 'Reminder time', 'Resume'];

  return (
    <div className="relative min-h-dvh flex items-center justify-center p-4 sm:p-6 bg-paper">
      <OnboardingBackdrop />

      {/* Card */}
      <main
        aria-labelledby="onboarding-heading"
        className="relative z-10 w-full max-w-[760px] bg-card border border-hairline rounded-ledger overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">

          {/* Rail — desktop */}
          <div className="hidden md:flex flex-col border-r border-hairline p-5">
            <p className="font-label text-xs uppercase tracking-widest text-muted-ink mb-4">Onboarding</p>
            <ul className="space-y-0">
              {STEPS.map((label, i) => {
                const stepNum = i + 1;
                const isActive = step === stepNum;
                const isDone = step > stepNum;
                return (
                  <li
                    key={label}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-ledger border text-xs font-label uppercase tracking-wider ${
                      isActive
                        ? 'bg-[color-mix(in_srgb,var(--ink)_10%,transparent)] border-ink text-ink'
                        : isDone
                        ? 'border-transparent text-muted-ink'
                        : 'border-transparent text-muted-ink'
                    }`}
                  >
                    <span
                      className={`min-w-[22px] text-center border rounded-ledger text-xs leading-5 ${
                        isActive ? 'border-ink' : 'border-hairline'
                      }`}
                    >
                      {stepNum}
                    </span>
                    {label}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Mobile progress bar */}
          <div className="md:hidden flex items-center gap-3 px-5 pt-5 pb-3 border-b border-hairline">
            <p className="font-label text-xs uppercase tracking-widest text-muted-ink shrink-0">
              Step {step} of 3
            </p>
            <div className="flex gap-1.5 flex-1" aria-hidden="true">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-ink' : 'bg-hairline'}`}
                />
              ))}
            </div>
          </div>

          {/* Main content column */}
          <div className="flex flex-col min-h-[380px] md:min-h-[420px] p-5">
            <h1
              id="onboarding-heading"
              className="font-display text-2xl font-normal text-ink mb-1"
            >
              Welcome to Uppend!
            </h1>
            <p className="text-sm text-muted-ink mb-5">
              {step === 1 && "Let\u2019s get your profile set up."}
              {step === 2 && "When would you like to receive follow-up reminders?"}
              {step === 3 && "Upload an initial resume for AI matching (Optional)"}
            </p>

            {/* Step 1 — Name */}
            {step === 1 && (
              <form onSubmit={handleNameSubmit} className="flex flex-col flex-1">
                <div className="flex-1">
                  <div className="mb-4 max-w-[420px]">
                    <label htmlFor="ob-name" className="block text-sm font-medium text-ink mb-1">
                      What&apos;s your name?
                    </label>
                    <input
                      id="ob-name"
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full min-w-0 max-w-full rounded-ledger border border-field-border bg-card text-base text-ink placeholder:text-muted-ink focus-ink px-3 py-2"
                    />
                  </div>
                </div>
                <p
                  role="status"
                  className={`text-sm min-h-5 mb-2 ${error ? 'text-red-700 dark:text-red-400' : ''}`}
                >
                  {error}
                </p>
                <div className="flex justify-end gap-3 border-t border-hairline pt-3.5 mt-auto">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary rounded-ledger min-h-[44px] sm:min-w-[176px] px-4 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Continue"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2 — Reminder time */}
            {step === 2 && (
              <form onSubmit={(e) => handleTimeSubmit(e, false)} className="flex flex-col flex-1">
                <div className="flex-1">
                  <div className="mb-4 max-w-[420px]">
                    <label htmlFor="ob-time" className="block text-sm font-medium text-ink mb-1">
                      Reminder Time
                    </label>
                    <input
                      id="ob-time"
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      required
                      className="w-full min-w-0 max-w-full rounded-ledger border border-field-border bg-card text-base text-ink focus-ink px-3 py-2"
                    />
                    {detectedTz && (
                      <p className="text-xs text-muted-ink mt-2">
                        We&apos;ve detected your timezone as <strong className="text-ink">{detectedTz}</strong>.
                      </p>
                    )}
                  </div>
                </div>
                <p
                  role="status"
                  className={`text-sm min-h-5 mb-2 ${error ? 'text-red-700 dark:text-red-400' : ''}`}
                >
                  {error}
                </p>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-hairline pt-3.5 mt-auto">
                  <button
                    type="button"
                    onClick={(e) => handleTimeSubmit(e as unknown as React.FormEvent, true)}
                    disabled={loading}
                    className="btn-secondary rounded-ledger min-h-[44px] px-4 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Skip for now
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary rounded-ledger min-h-[44px] sm:min-w-[176px] px-4 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Continue"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3 — Resume */}
            {step === 3 && (
              <div className="flex flex-col flex-1">
                <div className="flex-1">
                  <ResumeUploader
                    forceIsCurrent={true}
                    onSuccess={() => router.push('/dashboard')}
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-hairline pt-3.5 mt-auto">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="btn-secondary rounded-ledger min-h-[44px] sm:min-w-[176px] px-4 text-sm font-medium"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
