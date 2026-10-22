"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ label, className }: { label?: string; className?: string } = {}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="min-h-[44px] min-w-[44px]" />; // Placeholder with same dimensions
  }

  const defaultClasses = label
    ? "font-label text-xs uppercase tracking-wider text-muted-ink hover:text-ink min-h-[44px] min-w-[44px] px-2 inline-flex items-center justify-center transition-colors focus-ink"
    : "min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-md text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--row-hover)] transition-colors";

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={className || defaultClasses}
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? (
        <Sun className={label ? "w-5 h-5 sm:hidden" : "w-5 h-5"} />
      ) : (
        <Moon className={label ? "w-5 h-5 sm:hidden" : "w-5 h-5"} />
      )}
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}
