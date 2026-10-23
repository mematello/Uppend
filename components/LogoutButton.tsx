"use client";

import { createClient } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function LogoutButton({ menuItem = false }: { menuItem?: boolean } = {}) {
  const router = useRouter();
  const supabase = createClient();
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const openModal = () => {
    setIsMounted(true);
    setTimeout(() => setIsVisible(true), 10);
  };

  const closeModal = () => {
    setIsVisible(false);
    setTimeout(() => setIsMounted(false), 200); // 200ms matches transition duration
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (isMounted) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMounted]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh(); // Clear any server component cache
  };

  const modalContent = isMounted ? (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-scrim transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
      onClick={closeModal}
    >
      <div 
        className={`bg-card rounded-ledger border border-hairline w-full max-w-sm p-6 overflow-hidden flex flex-col transition-all duration-200 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} 
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold font-display text-ink mb-2">Log Out</h3>
        <p className="text-muted-ink mb-6">Are you sure you want to log out of your account?</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={closeModal}
            className="px-4 py-2 min-h-[44px] btn-secondary font-medium rounded-ledger"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              closeModal();
              handleLogout();
            }}
            className="px-4 py-2 min-h-[44px] bg-red-700 dark:bg-red-800 hover:bg-red-800 dark:hover:bg-red-700 text-white font-medium rounded-ledger transition-colors focus-ink"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {menuItem ? (
        <button
          onClick={openModal}
          className="w-full min-h-[44px] px-4 flex items-center justify-start font-label text-xs uppercase tracking-wider text-ink hover:bg-row-hover transition-colors focus-ink"
          title="Log Out"
          aria-label="Log Out"
        >
          Log Out
        </button>
      ) : (
        <button
          onClick={openModal}
          className="font-label text-xs uppercase tracking-wider text-muted-ink hover:text-ink min-h-[44px] min-w-[44px] px-2 inline-flex items-center justify-center transition-colors focus-ink"
          title="Log Out"
          aria-label="Log Out"
        >
          <LogOut className="w-5 h-5 sm:hidden" />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      )}
      {typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
}
