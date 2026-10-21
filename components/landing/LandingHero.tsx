import Link from "next/link";
import { FlowDemo } from "./FlowDemo";
import styles from "./landing.module.css";

export function LandingHero() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-14 pb-12 sm:pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Asymmetric desktop layout, stacked on mobile */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          {/* Eyebrow */}
          <div className="mb-3">
            <span
              className={`text-xs uppercase tracking-widest text-[var(--landing-muted)] font-medium ${styles.monoLabel}`}
            >
              JOB APPLICATION TRACKER
            </span>
          </div>

          {/* H1 */}
          <h1
            className={`text-4xl sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.08] mb-5 font-normal text-[var(--landing-ink)] ${styles.serifHeadline}`}
          >
            Less spreadsheet. More progress.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[var(--landing-muted)] leading-relaxed mb-8 max-w-lg">
            Paste a job description. Uppend pulls out the details, checks it against your resume, and keeps track of where every application stands.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
            <Link
              href="/signup"
              className={`min-h-[44px] px-6 py-3 bg-[var(--landing-ink)] text-[var(--landing-paper)] hover:bg-[var(--landing-accent)] hover:text-[#121212] rounded-sm text-xs font-semibold tracking-wider uppercase transition-colors border border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent)] whitespace-nowrap ${styles.monoLabel}`}
            >
              Create a free account
            </Link>

            <Link
              href="/dashboard"
              className={`min-h-[44px] py-2.5 px-2 flex items-center text-sm underline underline-offset-4 text-[var(--landing-muted)] hover:text-[var(--landing-ink)] transition-colors`}
            >
              or try tracking-only mode, no account
            </Link>
          </div>

          {/* Small line under CTAs */}
          <p className={`text-xs text-[var(--landing-muted)] tracking-wide ${styles.monoLabel}`}>
            5 free AI runs, then bring your own API key.
          </p>
        </div>

        {/* Right Column: Flow Demo */}
        <div className="lg:col-span-7 w-full flex items-center justify-center">
          <FlowDemo />
        </div>
      </div>
    </section>
  );
}
