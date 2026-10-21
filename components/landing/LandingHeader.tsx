import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "../ThemeToggle";
import styles from "./landing.module.css";

export function LandingHeader() {
  return (
    <header className="w-full border-b border-[var(--landing-hairline)] px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-2">
        {/* Logo and Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 min-h-[44px] shrink-0"
          aria-label="Uppend Home"
        >
          <Image
            src="/images/uppend-logo.jpg"
            alt="Uppend Logo"
            width={28}
            height={28}
            className="rounded-sm object-contain"
            priority
          />
          <span className={`text-lg font-semibold tracking-tight text-[var(--landing-ink)] ${styles.monoLabel}`}>
            Uppend
          </span>
        </Link>

        {/* Right Nav: One row on mobile (fits 375px), 44px min tap targets */}
        <nav className="flex flex-row items-center gap-1 sm:gap-3 shrink-0">
          <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
            <ThemeToggle />
          </div>

          <Link
            href="/login"
            className={`min-h-[44px] px-2.5 sm:px-3 flex items-center justify-center text-xs tracking-wider uppercase text-[var(--landing-muted)] hover:text-[var(--landing-ink)] transition-colors whitespace-nowrap ${styles.monoLabel}`}
          >
            Log in
          </Link>

          <Link
            href="/signup"
            className={`min-h-[44px] px-3.5 sm:px-4 py-2 flex items-center justify-center bg-[var(--landing-ink)] text-[var(--landing-paper)] hover:bg-[var(--landing-accent)] hover:text-[#121212] rounded-sm text-xs font-semibold tracking-wider uppercase transition-colors whitespace-nowrap border border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent)] ${styles.monoLabel}`}
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
