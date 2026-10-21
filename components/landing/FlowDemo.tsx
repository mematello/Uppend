"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./landing.module.css";
import {
  FULL_JD_TEXT,
  Beat1Panel,
  Beat2Panel,
  Beat3Panel,
  Beat4Panel,
} from "./DemoPanels";

export function FlowDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [beat, setBeat] = useState<1 | 2 | 3 | 4>(1);
  const [typedChars, setTypedChars] = useState(FULL_JD_TEXT.length);
  const [isApplied, setIsApplied] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    let isVisible = !document.hidden;
    let isIntersecting = true;
    let animationFrameId: number | null = null;
    let lastTimestamp = performance.now();
    let elapsedMs = 0;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function stopLoop() {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }

    function startLoop() {
      if (animationFrameId !== null) return;
      if (motionQuery.matches) {
        // Reduced motion: cancel/prevent loop and set static final frame
        setIsReducedMotion(true);
        setBeat(4);
        setTypedChars(FULL_JD_TEXT.length);
        setIsApplied(true);
        return;
      }

      setIsReducedMotion(false);
      lastTimestamp = performance.now();

      const tick = (now: number) => {
        const delta = now - lastTimestamp;
        lastTimestamp = now;

        if (isVisible && isIntersecting) {
          elapsedMs = (elapsedMs + delta) % 10000;

          if (elapsedMs < 2000) {
            // Beat 1: 0-2s (Typewriter)
            setBeat(1);
            setIsApplied(false);
            const ratio = Math.min(1, elapsedMs / 1800);
            setTypedChars(Math.max(12, Math.floor(ratio * FULL_JD_TEXT.length)));
          } else if (elapsedMs < 4000) {
            // Beat 2: 2-4s (Extract & Transform)
            setBeat(2);
            setTypedChars(FULL_JD_TEXT.length);
            setIsApplied(false);
          } else if (elapsedMs < 6000) {
            // Beat 3: 4-6s (Evaluate)
            setBeat(3);
            setTypedChars(FULL_JD_TEXT.length);
            setIsApplied(false);
          } else {
            // Beat 4: 6-10s (Track & Hold)
            setBeat(4);
            setTypedChars(FULL_JD_TEXT.length);
            setIsApplied(elapsedMs >= 7200);
          }
        }

        animationFrameId = requestAnimationFrame(tick);
      };

      animationFrameId = requestAnimationFrame(tick);
    }

    // Requirement 3: Stop when reduced-motion matches at runtime; restart when it changes back
    function handleMotionChange(e: MediaQueryListEvent) {
      if (e.matches) {
        stopLoop();
        setIsReducedMotion(true);
        setBeat(4);
        setTypedChars(FULL_JD_TEXT.length);
        setIsApplied(true);
      } else {
        setIsReducedMotion(false);
        startLoop();
      }
    }

    // Initial setup on client mount
    if (motionQuery.matches) {
      setIsReducedMotion(true);
      setBeat(4);
      setTypedChars(FULL_JD_TEXT.length);
      setIsApplied(true);
    } else {
      startLoop();
    }

    motionQuery.addEventListener("change", handleMotionChange);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isIntersecting = entry ? entry.isIntersecting : true;
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopLoop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {/* Sibling sr-only element */}
      <div className="sr-only">
        <h3>How Uppend Works Demonstration</h3>
        <p>Step 1: Paste messy job posting text for Acme Corp Frontend Engineer role.</p>
        <p>Step 2: Instant extraction of structured fields: Role, Company, Stack, Salary, and Location.</p>
        <p>Step 3: Fit evaluation scoring 4 out of 5 for role fit and 5 out of 5 for culture fit, with strengths in React and TypeScript and a note on FinTech experience gap.</p>
        <p>Step 4: Automatic pipeline tracking with status transition from Draft to Applied and follow-up reminders scheduled.</p>
      </div>

      {/* Visual Animation Container (aria-hidden) */}
      <div
        aria-hidden="true"
        className={`w-full rounded-sm border border-[var(--landing-hairline)] bg-[var(--landing-card)] shadow-sm overflow-hidden select-none flex flex-col justify-between ${styles.ledgerCard}`}
      >
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--landing-hairline)] bg-[var(--landing-paper)] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--landing-hairline)] border border-[var(--landing-ink)] opacity-60 inline-block" />
            <span className={`text-[11px] font-medium tracking-wider uppercase text-[var(--landing-ink)] ${styles.monoLabel}`}>
              demo_session.log
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] tracking-widest font-semibold px-1.5 py-0.5 border border-[var(--landing-hairline)] text-[var(--landing-muted)] uppercase ${styles.monoLabel}`}
            >
              SAMPLE DATA
            </span>
            <span
              className={`text-[10px] tracking-wider px-1.5 py-0.5 rounded-sm ${styles.monoLabel} ${
                isReducedMotion ? "bg-[var(--landing-hairline)] text-[var(--landing-ink)]" : "bg-[var(--landing-accent)] text-[#121212] font-semibold"
              }`}
            >
              {isReducedMotion ? "STATIC VIEW" : `BEAT 0${beat}/04`}
            </span>
          </div>
        </div>

        {/* Stepper Tabs Bar */}
        <div className="grid grid-cols-4 border-b border-[var(--landing-hairline)] bg-[var(--landing-paper)] text-[10px] sm:text-xs shrink-0">
          {[
            { id: 1, label: "01 PASTE" },
            { id: 2, label: "02 EXTRACT" },
            { id: 3, label: "03 EVALUATE" },
            { id: 4, label: "04 TRACK" },
          ].map((item) => {
            const isActive = beat === item.id;
            return (
              <div
                key={item.id}
                className={`py-1.5 sm:py-2 px-1 text-center border-r last:border-r-0 border-[var(--landing-hairline)] transition-colors truncate ${styles.monoLabel} ${
                  isActive
                    ? "bg-[var(--landing-card)] text-[var(--landing-ink)] font-semibold border-b-2 border-b-[var(--landing-ink)]"
                    : "text-[var(--landing-muted)] opacity-60"
                }`}
              >
                {item.label}
              </div>
            );
          })}
        </div>

        {/* Content Body: FIXED HEIGHT (h-[340px] mobile, h-[480px] desktop), ZERO layout shift */}
        <div className="p-3 sm:p-3.5 h-[340px] md:h-[480px] overflow-hidden">
          {/* MOBILE VIEW (md:hidden): Single active panel fills fixed body */}
          <div className="block md:hidden h-full overflow-hidden">
            {beat === 1 && <Beat1Panel typedChars={typedChars} />}
            {beat === 2 && (
              <Beat2Panel
                isRevealed={true}
                isStatic={isReducedMotion}
                showRawHighlightOnTop={true}
              />
            )}
            {beat === 3 && <Beat3Panel />}
            {beat === 4 && <Beat4Panel isApplied={isApplied} />}
          </div>

          {/* DESKTOP VIEW (hidden md:grid): 2x2 grid with equal-height rows (grid-rows-2) filling fixed body */}
          <div className="hidden md:grid md:grid-cols-2 md:grid-rows-2 gap-2.5 h-full overflow-hidden">
            <div className={`h-full overflow-hidden transition-opacity duration-300 ${beat === 1 ? "opacity-100 ring-1 ring-inset ring-[var(--landing-ink)] rounded-sm" : "opacity-35"}`}>
              <Beat1Panel
                typedChars={typedChars}
                highlightTokens={beat >= 2}
              />
            </div>
            <div className={`h-full overflow-hidden transition-opacity duration-300 ${beat === 2 ? "opacity-100 ring-1 ring-inset ring-[var(--landing-ink)] rounded-sm" : "opacity-35"}`}>
              <Beat2Panel
                isRevealed={beat >= 2}
                isStatic={isReducedMotion}
              />
            </div>
            <div className={`h-full overflow-hidden transition-opacity duration-300 ${beat === 3 ? "opacity-100 ring-1 ring-inset ring-[var(--landing-ink)] rounded-sm" : "opacity-35"}`}>
              <Beat3Panel />
            </div>
            <div className={`h-full overflow-hidden transition-opacity duration-300 ${beat === 4 ? "opacity-100 ring-1 ring-inset ring-[var(--landing-ink)] rounded-sm" : "opacity-35"}`}>
              <Beat4Panel isApplied={isApplied} />
            </div>
          </div>
        </div>

        {/* Terminal Footer Status Bar: Single-line with truncation */}
        <div className="px-3.5 py-2 border-t border-[var(--landing-hairline)] bg-[var(--landing-paper)] flex items-center justify-between text-[11px] text-[var(--landing-muted)] shrink-0 gap-2">
          <span className={`shrink-0 ${styles.monoLabel}`}>target: acme_corp_fe.json</span>
          <span className={`truncate text-right ${styles.monoLabel}`}>
            {beat === 1 && "status: reading posting stream..."}
            {beat === 2 && "status: entities mapped (5 fields)"}
            {beat === 3 && "status: candidate fit scored"}
            {beat === 4 && (isApplied ? "status: applied - reminder queued" : "status: draft created")}
          </span>
        </div>
      </div>
    </div>
  );
}
