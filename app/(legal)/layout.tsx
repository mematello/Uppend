import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink font-sans">
      <header className="border-b border-hairline">
        <div className="flex items-center justify-between gap-4 px-5 sm:px-16 py-4">
          <Link
            href="/"
            className="btn-secondary rounded-ledger min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2.5 min-h-[44px] focus-ink">
            <Image
              src="/images/uppend-logo.jpg"
              alt="Uppend Logo"
              width={28}
              height={28}
              className="rounded-sm object-contain"
            />
            <span className="font-label text-sm uppercase tracking-widest text-ink">
              Uppend
            </span>
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full max-w-[680px] mx-auto px-5 sm:px-16 pt-10 sm:pt-14 pb-12">
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
