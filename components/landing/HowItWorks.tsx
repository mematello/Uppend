import React from "react";
import styles from "./landing.module.css";
import { Beat2Panel, Beat3Panel, Beat4Panel } from "./DemoPanels";

export function HowItWorks() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24 border-t border-[var(--landing-hairline)]">
      {/* Section Header */}
      <div className="mb-14 sm:mb-20">
        <span
          className={`text-xs uppercase tracking-widest text-[var(--landing-muted)] font-medium block mb-3 ${styles.monoLabel}`}
        >
          01 / WORKFLOW
        </span>
        <h2
          className={`text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[var(--landing-ink)] ${styles.serifHeadline}`}
        >
          From posting to pipeline.
        </h2>
      </div>

      {/* Alternating Benefit Rows */}
      <div className="space-y-16 sm:space-y-24">
        {/* Row 1: Text Left, Mockup Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col justify-center order-1 lg:order-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-2xl sm:text-3xl font-bold text-[var(--landing-ink)] opacity-30 ${styles.monoLabel}`}>
                01
              </span>
              <span
                className={`text-[10px] tracking-wider px-2 py-0.5 rounded-sm bg-[var(--landing-accent)] text-[#121212] font-semibold uppercase ${styles.monoLabel}`}
              >
                FREE ACCOUNT · AI
              </span>
            </div>
            <h3
              className={`text-2xl sm:text-3xl font-normal text-[var(--landing-ink)] mb-3 ${styles.serifHeadline}`}
            >
              Less typing
            </h3>
            <p className="text-base text-[var(--landing-muted)] leading-relaxed max-w-lg">
              Paste once; company, role, stack, salary and location fill in; you review before saving.
            </p>
          </div>
          <div className="lg:col-span-6 order-2 lg:order-2">
            <div className="h-[220px] w-full rounded-sm overflow-hidden shadow-sm">
              <Beat2Panel isStatic={true} isRevealed={true} />
            </div>
          </div>
        </div>

        {/* Row 2: Mockup Left, Text Right (Alternating on Desktop, text first on mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col justify-center order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-2xl sm:text-3xl font-bold text-[var(--landing-ink)] opacity-30 ${styles.monoLabel}`}>
                02
              </span>
              <span
                className={`text-[10px] tracking-wider px-2 py-0.5 rounded-sm border border-[var(--landing-hairline)] text-[var(--landing-ink)] uppercase ${styles.monoLabel}`}
              >
                FREE ACCOUNT · NEEDS RESUME
              </span>
            </div>
            <h3
              className={`text-2xl sm:text-3xl font-normal text-[var(--landing-ink)] mb-3 ${styles.serifHeadline}`}
            >
              An honest fit check
            </h3>
            <p className="text-base text-[var(--landing-muted)] leading-relaxed max-w-lg">
              Compare a role to your resume; see strengths and gaps, not just a score.
            </p>
          </div>
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="h-[220px] w-full rounded-sm overflow-hidden shadow-sm">
              <Beat3Panel />
            </div>
          </div>
        </div>

        {/* Row 3: Text Left, Mockup Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col justify-center order-1 lg:order-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-2xl sm:text-3xl font-bold text-[var(--landing-ink)] opacity-30 ${styles.monoLabel}`}>
                03
              </span>
            </div>
            <h3
              className={`text-2xl sm:text-3xl font-normal text-[var(--landing-ink)] mb-3 ${styles.serifHeadline}`}
            >
              Fewer missed follow-ups
            </h3>
            <p className="text-base text-[var(--landing-muted)] leading-relaxed max-w-lg">
              Pipeline from Draft to Offer plus a next-action date. Tracking works without an account; email reminders need one.
            </p>
          </div>
          <div className="lg:col-span-6 order-2 lg:order-2">
            <div className="h-[220px] w-full rounded-sm overflow-hidden shadow-sm">
              <Beat4Panel isApplied={true} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
