import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink font-sans">
      <header className="w-full border-b border-hairline px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 min-h-[44px] shrink-0 focus-ink"
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
            <span className="text-lg font-semibold tracking-tight text-ink font-label">
              Uppend
            </span>
          </Link>
          <nav aria-label="Site" className="flex flex-row items-center gap-1 sm:gap-3 shrink-0">
            <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>
      <div className="w-full max-w-[680px] mx-auto px-5 sm:px-16 pt-6">
        <Link
          href="/"
          className="btn-secondary rounded-ledger min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
      <main className="flex-1 w-full max-w-[680px] mx-auto px-5 sm:px-16 pt-6 sm:pt-8 pb-12">
        {children}
      </main>
      <footer className="border-t border-hairline">
        <nav
          aria-label="Legal"
          className="max-w-[680px] mx-auto px-5 sm:px-16 pt-4 pb-24 flex flex-wrap items-center gap-x-6"
        >
          <Link
            href="/terms"
            className="link-ink font-label text-xs uppercase tracking-wider inline-flex items-center min-h-[44px]"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="link-ink font-label text-xs uppercase tracking-wider inline-flex items-center min-h-[44px]"
          >
            Privacy Policy
          </Link>
          <Link
            href="/"
            className="link-ink font-label text-xs uppercase tracking-wider inline-flex items-center min-h-[44px]"
          >
            Home
          </Link>
        </nav>
      </footer>
    </div>
  );
}
