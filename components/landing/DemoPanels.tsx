import React from "react";
import styles from "./landing.module.css";

export const FULL_JD_TEXT =
  "Acme Corp is hiring a Frontend Engineer to build modern web apps. We offer competitive pay of ₱60,000-₱90,000. You'll use React, TypeScript, and TailwindCSS to build features. The ideal candidate is a team player who must be willing to work in our office in BGC, Taguig at least 3 days a week.";

// Segmented representation of the JD text for highlighted token rendering in Beat 2
export function HighlightedRawJD({ compact = false }: { compact?: boolean }) {
  return (
    <p
      className={`text-xs leading-relaxed text-[var(--landing-ink)] font-mono break-words ${styles.monoLabel} ${
        compact ? "line-clamp-3 text-[11px] leading-normal" : ""
      }`}
    >
      <span className={styles.tokenHighlight}>Acme Corp</span> is hiring a{" "}
      <span className={styles.tokenHighlight}>Frontend Engineer</span> to build modern web apps. We offer competitive pay of{" "}
      <span className={styles.tokenHighlight}>₱60,000-₱90,000</span>. You&apos;ll use{" "}
      <span className={styles.tokenHighlight}>React, TypeScript, and TailwindCSS</span> to build features. The ideal candidate is a team player who must be willing to work in our office in{" "}
      <span className={styles.tokenHighlight}>BGC, Taguig at least 3 days a week</span>.
    </p>
  );
}

// ---------------- PANEL 1: PASTE ----------------
interface Beat1PanelProps {
  typedChars?: number;
  highlightTokens?: boolean;
}

export function Beat1Panel({ typedChars = FULL_JD_TEXT.length, highlightTokens = false }: Beat1PanelProps) {
  const currentText = FULL_JD_TEXT.slice(0, typedChars);

  return (
    <div className="p-3 border border-[var(--landing-hairline)] bg-[var(--landing-paper)] rounded-sm h-full flex flex-col justify-between overflow-hidden">
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <span className={`text-[10px] font-semibold text-[var(--landing-ink)] tracking-wider ${styles.monoLabel}`}>
          01 // RAW_INPUT.TXT
        </span>
        <span className={`text-[9px] text-[var(--landing-muted)] uppercase ${styles.monoLabel}`}>
          paste
        </span>
      </div>

      {/* Fixed layout container: full text reserves exact height invisibly, typed text overlays */}
      <div className="relative flex-1 overflow-hidden">
        {highlightTokens ? (
          <HighlightedRawJD />
        ) : (
          <>
            {/* Invisible full-text placeholder to prevent ANY layout shift */}
            <p
              aria-hidden="true"
              className={`text-xs leading-relaxed font-mono invisible select-none ${styles.monoLabel}`}
            >
              {FULL_JD_TEXT}
            </p>
            {/* Overlay with active typed text */}
            <p
              className={`absolute inset-0 text-xs leading-relaxed text-[var(--landing-ink)] font-mono break-words ${styles.monoLabel}`}
            >
              {currentText}
              <span className={styles.blinkingCursor} />
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------- PANEL 2: EXTRACT ----------------
interface Beat2PanelProps {
  isRevealed?: boolean;
  isStatic?: boolean;
  showRawHighlightOnTop?: boolean;
}

export function Beat2Panel({
  isRevealed = true,
  isStatic = false,
  showRawHighlightOnTop = false,
}: Beat2PanelProps) {
  const fields = [
    { label: "company", value: "Acme Corp", isBold: true, isStack: false },
    { label: "role", value: "Frontend Engineer", isBold: true, isStack: false },
    { label: "salary", value: "₱60,000–₱90,000", isBold: false, isStack: false },
    { label: "location", value: "BGC, Taguig (Hybrid 3d)", isBold: false, isStack: false },
    { label: "stack", value: ["React", "TypeScript", "TailwindCSS"], isBold: false, isStack: true },
  ];

  return (
    <div className="p-3 border border-[var(--landing-hairline)] bg-[var(--landing-paper)] rounded-sm h-full flex flex-col justify-between overflow-hidden">
      <div className="flex items-center justify-between mb-1 shrink-0">
        <span className={`text-[10px] font-semibold text-[var(--landing-ink)] tracking-wider ${styles.monoLabel}`}>
          02 // EXTRACTED_RECORD
        </span>
        <span className={`text-[9px] text-[var(--landing-muted)] uppercase ${styles.monoLabel}`}>
          json
        </span>
      </div>

      {/* On mobile Beat 2: compact highlighted text above fields */}
      {showRawHighlightOnTop && (
        <div className="mb-2 p-1.5 bg-[var(--landing-card)] border border-[var(--landing-hairline)] rounded-sm shrink-0">
          <div className={`text-[9px] text-[var(--landing-muted)] uppercase tracking-wider mb-0.5 ${styles.monoLabel}`}>
            Tokens detected in raw text:
          </div>
          <HighlightedRawJD compact />
        </div>
      )}

      {/* Staggered Extracted Fields */}
      <div className={`space-y-1 text-xs flex-1 flex flex-col justify-center ${styles.monoLabel}`}>
        {fields.map((f, idx) => {
          const delayMs = isStatic ? 0 : idx * 150;
          return (
            <div
              key={f.label}
              style={{
                transitionDelay: `${delayMs}ms`,
              }}
              className={`flex justify-between items-center border-b border-[var(--landing-hairline)] pb-1 transition-all duration-300 ${
                isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5"
              }`}
            >
              <span className="text-[var(--landing-muted)] text-[11px]">{f.label}</span>
              {f.isStack ? (
                <div className="flex gap-1">
                  {(f.value as string[]).map((tech) => (
                    <span key={tech} className={`text-[10px] px-1 py-0.5 rounded-sm ${styles.tokenHighlight}`}>
                      {tech}
                    </span>
                  ))}
                </div>
              ) : (
                <span className={`text-[var(--landing-ink)] ${f.isBold ? "font-semibold" : "font-normal"}`}>
                  {f.value as string}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- PANEL 3: EVALUATE ----------------
export function Beat3Panel() {
  return (
    <div className="p-3 border border-[var(--landing-hairline)] bg-[var(--landing-paper)] rounded-sm h-full flex flex-col justify-between overflow-hidden">
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <span className={`text-[10px] font-semibold text-[var(--landing-ink)] tracking-wider ${styles.monoLabel}`}>
          03 // FIT_EVALUATION
        </span>
        <span className={`text-[9px] text-[var(--landing-muted)] uppercase ${styles.monoLabel}`}>
          resume v2
        </span>
      </div>

      <div className="space-y-2 flex-1 flex flex-col justify-center">
        {/* Role Fit Meter */}
        <div>
          <div className={`flex justify-between text-[11px] mb-1 ${styles.monoLabel}`}>
            <span className="text-[var(--landing-muted)]">Role Fit</span>
            <span className="font-semibold text-[var(--landing-ink)]">4 / 5</span>
          </div>
          <div className={styles.meterTrack}>
            <div className={styles.meterFill} style={{ width: "80%" }} />
          </div>
        </div>

        {/* Culture Fit Meter */}
        <div>
          <div className={`flex justify-between text-[11px] mb-1 ${styles.monoLabel}`}>
            <span className="text-[var(--landing-muted)]">Culture Fit</span>
            <span className="font-semibold text-[var(--landing-ink)]">5 / 5</span>
          </div>
          <div className={styles.meterTrack}>
            <div className={styles.meterFill} style={{ width: "100%" }} />
          </div>
        </div>

        {/* Chips: Chartreuse filled strengths, dashed gap outline, NO green/blue/amber tints */}
        <div className="pt-0.5 flex flex-wrap gap-1.5">
          <span className={`text-[10px] px-2 py-0.5 rounded-sm ${styles.strengthChip} ${styles.monoLabel}`}>
            + React + TypeScript match
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-sm ${styles.strengthChip} ${styles.monoLabel}`}>
            + TailwindCSS experience
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-sm ${styles.gapChip} ${styles.monoLabel}`}>
            - No prior FinTech
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------- PANEL 4: TRACK ----------------
interface Beat4PanelProps {
  isApplied?: boolean;
}

export function Beat4Panel({ isApplied = true }: Beat4PanelProps) {
  return (
    <div className="p-3 border border-[var(--landing-hairline)] bg-[var(--landing-paper)] rounded-sm h-full flex flex-col justify-between overflow-hidden">
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <span className={`text-[10px] font-semibold text-[var(--landing-ink)] tracking-wider ${styles.monoLabel}`}>
          04 // PIPELINE_ENTRY
        </span>
        <span className={`text-[9px] text-[var(--landing-muted)] uppercase ${styles.monoLabel}`}>
          live ledger
        </span>
      </div>

      <div className="space-y-2 flex-1 flex flex-col justify-center">
        {/* Row Table Mock */}
        <div className="border border-[var(--landing-hairline)] rounded-sm overflow-hidden bg-[var(--landing-card)]">
          <div className={`grid grid-cols-12 text-[10px] py-1 px-2 border-b border-[var(--landing-hairline)] text-[var(--landing-muted)] ${styles.monoLabel}`}>
            <span className="col-span-5">COMPANY</span>
            <span className="col-span-4">ROLE</span>
            <span className="col-span-3 text-right">STATUS</span>
          </div>
          <div className={`grid grid-cols-12 text-[11px] py-1.5 px-2 items-center bg-[var(--landing-paper)] ${styles.monoLabel}`}>
            <span className="col-span-5 font-semibold text-[var(--landing-ink)] truncate">Acme Corp</span>
            <span className="col-span-4 text-[var(--landing-muted)] truncate">Frontend</span>
            <div className="col-span-3 flex justify-end">
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-sm transition-all duration-300 uppercase ${
                  isApplied ? styles.statusApplied : styles.statusDraft
                }`}
              >
                {isApplied ? "Applied" : "Draft"}
              </span>
            </div>
          </div>
        </div>

        {/* Reminder Toast */}
        <div
          className={`p-2 border border-[var(--landing-hairline)] rounded-sm bg-[var(--landing-card)] flex items-center justify-between transition-opacity duration-300 ${
            isApplied ? "opacity-100" : "opacity-30"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--landing-ink)] inline-block shrink-0" />
            <span className={`text-[10px] text-[var(--landing-ink)] truncate ${styles.monoLabel}`}>
              Follow up with Acme Corp — tomorrow
            </span>
          </div>
          <span className={`text-[9px] text-[var(--landing-muted)] uppercase shrink-0 ${styles.monoLabel}`}>
            queued
          </span>
        </div>
      </div>
    </div>
  );
}
