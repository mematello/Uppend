"use client";

import { useState } from "react";
import { clearDb } from "../lib/local/db";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ClearLocalDataButton() {
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();

  const handleClear = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete all local application data? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setIsClearing(true);
      await clearDb();
      window.alert("Local data cleared successfully.");
      // Force reload to reset state
      window.location.reload();
    } catch (err) {
      console.error("Failed to clear local data:", err);
      window.alert("Failed to clear local data. Check console for details.");
      setIsClearing(false);
    }
  };

  return (
    <button
      onClick={handleClear}
      disabled={isClearing}
      className="inline-flex w-full items-center justify-center gap-2 px-4 min-h-[44px] rounded-ledger border border-red-700 dark:border-red-500 bg-transparent text-sm font-medium text-red-700 dark:text-red-400 hover:bg-row-hover focus-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Trash2 className="w-4 h-4" aria-hidden="true" />
      {isClearing ? "Clearing..." : "Clear Local Data"}
    </button>
  );
}
