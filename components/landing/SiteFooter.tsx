import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./landing.module.css";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[var(--landing-hairline)] bg-[var(--landing-paper)]">
      {/* Top Closing CTA Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24 text-center border-b border-[var(--landing-hairline)]">
        <h2
          className={`text-3xl sm:text-4xl lg:text-5xl font-normal text-[var(--landing-ink)] tracking-tight mb-8 ${styles.serifHeadline}`}
        >
          Ready to land your next role?
        </h2>
        <div>
          <Link
            href="/signup"
            className={`inline-flex items-center justify-center px-6 py-3 min-h-[44px] text-sm font-medium tracking-wide uppercase rounded-sm bg-[var(--landing-ink)] text-[var(--landing-paper)] hover:bg-[var(--landing-accent)] hover:text-[#121212] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)] shadow-sm ${styles.monoLabel}`}
          >
            Create a free account
          </Link>
        </div>
      </section>

      {/* Main Footer Navigation & Builder Grid */}
      {/* Mobile: pb-52 (208px) leaves >= 60px spare clearance above the fixed ~148px cookie consent banner */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 pt-12 pb-52 sm:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-[var(--landing-hairline)]">
          {/* Builder & Origin Column */}
          <div className="md:col-span-5 flex flex-col justify-start">
            <span
              className={`text-xs uppercase tracking-widest text-[var(--landing-muted)] font-semibold mb-3 ${styles.monoLabel}`}
            >
              04 // COLOPHON
            </span>
            <p className="text-base text-[var(--landing-ink)] font-medium leading-relaxed mb-1">
              Built by Marcus Oliver.
            </p>
            <p className="text-sm text-[var(--landing-muted)] leading-relaxed">
              Uppend started as a fix for my own job search.
            </p>
          </div>

          {/* Links Column */}
          <div className="md:col-span-4 flex flex-col justify-start">
            <span
              className={`text-xs uppercase tracking-widest text-[var(--landing-muted)] font-semibold mb-3 ${styles.monoLabel}`}
            >
              LINKS
            </span>
            <ul className={`space-y-1 text-sm ${styles.monoLabel}`}>
              <li>
                <a
                  href="https://github.com/mematello"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] inline-flex items-center gap-1 text-[var(--landing-ink)] hover:text-[var(--landing-muted)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--landing-accent)]"
                >
                  <span>GitHub @mematello</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/mematello/Uppend"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] inline-flex items-center gap-1 text-[var(--landing-ink)] hover:text-[var(--landing-muted)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--landing-accent)]"
                >
                  <span>Uppend repository</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href="https://marcusoliver.is-a.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] inline-flex items-center gap-1 text-[var(--landing-ink)] hover:text-[var(--landing-muted)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--landing-accent)]"
                >
                  <span>Portfolio marcusoliver.is-a.dev</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href="mailto:marcusoliver.dev@gmail.com"
                  className="min-h-[44px] inline-flex items-center gap-1 text-[var(--landing-ink)] hover:text-[var(--landing-muted)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--landing-accent)]"
                >
                  <span>marcusoliver.dev@gmail.com</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>

          {/* Feedback & Bug Reports */}
          <div className="md:col-span-3 flex flex-col justify-start">
            <span
              className={`text-xs uppercase tracking-widest text-[var(--landing-muted)] font-semibold mb-3 ${styles.monoLabel}`}
            >
              FEEDBACK
            </span>
            <p className="text-sm text-[var(--landing-muted)] leading-relaxed mb-4">
              Feedback or a bug? Open a{" "}
              <a
                href="https://github.com/mematello/Uppend/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--landing-ink)] underline underline-offset-4 hover:opacity-80 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--landing-accent)]"
              >
                GitHub issue
              </a>{" "}
              or{" "}
              <a
                href="mailto:marcusoliver.dev@gmail.com?subject=Uppend%20feedback"
                className="text-[var(--landing-ink)] underline underline-offset-4 hover:opacity-80 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--landing-accent)]"
              >
                email me
              </a>
              .
            </p>
          </div>
        </div>

        {/* Legal & Copyright Row */}
        <div className={`pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[var(--landing-muted)] ${styles.monoLabel}`}>
          <div className="flex flex-wrap items-center gap-6">
            <span>&copy; {currentYear} Uppend</span>
            <span>MIT licensed</span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="min-h-[44px] inline-flex items-center text-[var(--landing-muted)] hover:text-[var(--landing-ink)] underline underline-offset-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--landing-accent)]"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="min-h-[44px] inline-flex items-center text-[var(--landing-muted)] hover:text-[var(--landing-ink)] underline underline-offset-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--landing-accent)]"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
