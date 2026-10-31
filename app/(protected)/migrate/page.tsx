"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApplications } from "../../../lib/local/applications";
import { clearDb } from "../../../lib/local/db";
import { Application } from "../../../lib/types";

export default function MigratePage() {
  const router = useRouter();
  const [status, setStatus] = useState("Checking for local data...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [appsToMerge, setAppsToMerge] = useState<Application[] | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [intent, setIntent] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Read intent without triggering suspense requirements
    const urlParams = new URLSearchParams(window.location.search);
    const intentParam = urlParams.get('intent');
    if (isMounted) setIntent(intentParam);

    async function checkLocalData() {
      try {
        const localApps = await getApplications();
        
        if (!localApps || localApps.length === 0) {
          if (isMounted) setStatus("No local data to sync. Redirecting...");
          setTimeout(() => router.push("/dashboard"), 1000);
          return;
        }

        if (isMounted) {
          // Explicit casting to match state type since getApplications might return unknown[]
          setAppsToMerge(localApps as Application[]);
          setStatus(""); // clear status text to show prompt
        }
      } catch (err: unknown) {
        console.error("Local check failed:", err);
        setTimeout(() => router.push("/dashboard"), 1000);
      }
    }

    checkLocalData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleMerge = async () => {
    if (!appsToMerge) return;
    setIsMerging(true);
    setStatus(`Syncing ${appsToMerge.length} local application(s) to your account...`);
    try {
      const res = await fetch("/api/applications/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applications: appsToMerge }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to migrate data");
      }

      setStatus("Sync complete! Cleaning up...");
      await clearDb();

      setTimeout(() => router.push("/dashboard"), 1000);

    } catch (err: unknown) {
      console.error("Migration failed:", err);
      setErrorMsg("Couldn't sync your local data — it's still saved on this device, we'll retry next visit.");
      setStatus("Redirecting to dashboard...");
      setTimeout(() => router.push("/dashboard"), 3000);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  const handleDelete = async () => {
    await clearDb();
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-paper">
      <div className="w-full max-w-[600px] bg-card border border-hairline rounded-ledger p-6">
        <p className="font-label text-xs uppercase tracking-widest text-muted-ink mb-1">Migrate</p>
        <h1 className="font-display text-2xl font-normal text-ink mb-4">
          Setting up your account
        </h1>

        {status && (
          <p role="status" className="text-sm text-muted-ink mb-4">{status}</p>
        )}

        {appsToMerge && !isMerging && !errorMsg && (
          <div className="mt-2">
            <p className="text-ink font-medium mb-5">
              We found {appsToMerge.length} saved application(s) on this browser &ndash; add them to your account?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 border-t border-hairline pt-3.5">
              <button
                onClick={handleDelete}
                className="btn-secondary rounded-ledger min-h-[44px] px-4 text-sm font-medium border-red-700 dark:border-red-500 text-red-700 dark:text-red-400 sm:order-first"
              >
                Not mine &ndash; delete it
              </button>
              <div className="flex flex-col sm:flex-row gap-3 sm:ml-auto">
                <button
                  onClick={handleSkip}
                  className="btn-secondary rounded-ledger min-h-[44px] px-4 text-sm font-medium"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleMerge}
                  className={`rounded-ledger min-h-[44px] px-4 text-sm font-medium ${intent === 'signup' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Yes, add them
                </button>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <p role="status" className="mt-4 text-sm text-red-700 dark:text-red-400">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
