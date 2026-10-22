import React from "react";
import styles from "./landing.module.css";

export function OriginStory() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24 border-t border-[var(--landing-hairline)]">
      <div className="max-w-3xl">
        {/* Eyebrow */}
        <span
          className={`text-xs uppercase tracking-widest text-[var(--landing-muted)] font-medium block mb-3 ${styles.monoLabel}`}
        >
          03 / FROM THE BUILDER
        </span>

        {/* Headline */}
        <h2
          className={`text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[var(--landing-ink)] mb-8 ${styles.serifHeadline}`}
        >
          Why I built Uppend
        </h2>

        {/* Verbatim Story Paragraphs */}
        <div className="space-y-6 text-base sm:text-lg text-[var(--landing-muted)] leading-relaxed">
          <p>
            I built Uppend after tracking 100+ job applications in a messy spreadsheet. It was exhausting to manually copy-paste details, remember when to follow up, and tailor my resume to every role.
          </p>
          <p>
            Uppend solves this by letting AI do the heavy lifting—extracting job details and assessing your fit instantly, so you can focus on what matters: landing the job.
          </p>
        </div>
      </div>
    </section>
  );
}
