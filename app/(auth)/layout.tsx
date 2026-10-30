import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-16 bg-paper relative">
      <Link
        href="/"
        className="absolute top-4 left-4 md:top-6 md:left-6 btn-secondary rounded-ledger min-h-[44px] inline-flex items-center gap-2 px-3 text-sm"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to home
      </Link>
      <div className="w-full max-w-[480px] bg-card border border-hairline rounded-ledger p-6 mt-14 md:mt-0">
        {children}
      </div>
    </div>
  );
}
