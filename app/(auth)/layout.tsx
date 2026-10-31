import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-16 bg-paper">
      <div className="w-full max-w-[480px]">
        <Link
          href="/"
          className="btn-secondary rounded-ledger min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 mb-4"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
        <div className="w-full bg-card border border-hairline rounded-ledger p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
