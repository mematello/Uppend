"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Ellipsis } from 'lucide-react';
import LogoutButton from './LogoutButton';

export default function MobileNavMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  return (
    <div className="relative sm:hidden" ref={wrapperRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
        aria-label="Menu"
        onClick={() => setOpen(!open)}
        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center border border-ink text-ink rounded-ledger hover:bg-row-hover transition-colors focus-ink"
      >
        <Ellipsis className="w-5 h-5" strokeWidth={1.75} />
      </button>

      <div
        id="mobile-nav-menu"
        className={`absolute right-0 top-full mt-2 w-48 z-30 bg-card border border-hairline rounded-ledger ${open ? '' : 'hidden'}`}
      >
        <button
          type="button"
          onClick={() => {
            setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
            setOpen(false);
          }}
          className="w-full min-h-[44px] px-4 flex items-center font-label text-xs uppercase tracking-wider text-ink hover:bg-row-hover border-b border-hairline last:border-b-0 transition-colors focus-ink"
        >
          Theme
        </button>

        {isLoggedIn && (
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="w-full min-h-[44px] px-4 flex items-center font-label text-xs uppercase tracking-wider text-ink hover:bg-row-hover border-b border-hairline last:border-b-0 transition-colors focus-ink"
          >
            Settings
          </Link>
        )}

        {isLoggedIn && (
          <div className="border-b border-hairline last:border-b-0">
            <LogoutButton menuItem />
          </div>
        )}

        {!isLoggedIn && (
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="w-full min-h-[44px] px-4 flex items-center font-label text-xs uppercase tracking-wider text-ink hover:bg-row-hover border-b border-hairline last:border-b-0 transition-colors focus-ink"
          >
            Log in
          </Link>
        )}
      </div>
    </div>
  );
}
