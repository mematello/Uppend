import React from "react";
import Link from "next/link";
import styles from "./landing.module.css";

export function PrivacyNotice() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24 border-t border-[var(--landing-hairline)]">
      {/* Eyebrow & Headline */}
      <div className="mb-12 sm:mb-16">
        <span
          className={`text-xs uppercase tracking-widest text-[var(--landing-muted)] font-medium block mb-3 ${styles.monoLabel}`}
        >
          02 / PRIVACY
        </span>
        <h2
          className={`text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[var(--landing-ink)] ${styles.serifHeadline}`}
        >
          What stays on your device, and what doesn&apos;t.
        </h2>
      </div>

      {/* Two Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
        {/* Card A: Tracking-only */}
        <div className={`p-6 sm:p-8 rounded-sm border border-[var(--landing-hairline)] bg-[var(--landing-card)] flex flex-col justify-between ${styles.ledgerCard}`}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full border border-[var(--landing-ink)] opacity-60 inline-block" />
              <h3 className={`text-sm tracking-wider uppercase text-[var(--landing-ink)] font-semibold ${styles.monoLabel}`}>
                Tracking-only mode (no account)
              </h3>
            </div>
            <p className="text-sm sm:text-base text-[var(--landing-muted)] leading-relaxed">
              Your applications are saved in this browser, on this device.
            </p>
          </div>
          <div className="mt-8 pt-4 border-t border-[var(--landing-hairline)]">
            <span className={`text-xs text-[var(--landing-muted)] uppercase tracking-wider ${styles.monoLabel}`}>
              storage: indexeddb / browser local
            </span>
          </div>
        </div>

        {/* Card B: With an account */}
        <div className={`p-6 sm:p-8 rounded-sm border border-[var(--landing-hairline)] bg-[var(--landing-card)] flex flex-col justify-between ${styles.ledgerCard}`}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[var(--landing-accent)] border border-[var(--landing-ink)] inline-block" />
              <h3 className={`text-sm tracking-wider uppercase text-[var(--landing-ink)] font-semibold ${styles.monoLabel}`}>
                With an account
              </h3>
            </div>
            <p className="text-sm sm:text-base text-[var(--landing-muted)] leading-relaxed">
              Your applications and resumes are stored in our database (Supabase). When you run AI extraction or fit analysis, the job description, and for fit analysis your resume text, is sent to an AI provider (Google Gemini or Groq). On the shared free Gemini tier, Google may use that content to improve its products and have it reviewed by people, so don&apos;t paste anything you wouldn&apos;t want seen. You can also add your own API key in Settings.
            </p>
          </div>
          <div className="mt-8 pt-4 border-t border-[var(--landing-hairline)]">
            <span className={`text-xs text-[var(--landing-muted)] uppercase tracking-wider ${styles.monoLabel}`}>
              storage: postgres (supabase) + ai providers
            </span>
          </div>
        </div>
      </div>

      {/* Link to Privacy Policy */}
      <div>
        <Link
          href="/privacy"
          className={`inline-flex items-center gap-1.5 text-xs tracking-wider uppercase text-[var(--landing-muted)] hover:text-[var(--landing-ink)] transition-colors underline underline-offset-4 ${styles.monoLabel}`}
        >
          Read the full Privacy Policy →
        </Link>
      </div>
    </section>
  );
}
