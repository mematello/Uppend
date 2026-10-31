"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";
import { Check } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [crossTabAuth, setCrossTabAuth] = useState(false);
  const supabase = createClient();

  // Listen for cross-tab auth state changes after sending the magic link
  useEffect(() => {
    if (!linkSent) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setCrossTabAuth(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [linkSent, supabase.auth]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('message')) {
      setMessage(params.get('message') as string);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);
    setLinkSent(false);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?intent=login`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      setIsError(true);
      
      let errMsg = error.message;
      if (!errMsg || (typeof errMsg === 'string' && errMsg === '{}') || typeof errMsg === 'object') {
        errMsg = "Something went wrong sending the confirmation email. Please try again in a moment.";
      }

      if (typeof errMsg === 'string' && errMsg.toLowerCase().includes("signups not allowed")) {
         setMessage("No account found. Please sign up instead.");
      } else {
         setMessage(`Error: ${errMsg}`);
      }
    } else {
      setLinkSent(true);
      setMessage("Click the link we sent to your email to log in.");
    }
    setLoading(false);
  };

  if (crossTabAuth) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 border border-ink rounded-ledger flex items-center justify-center mb-5">
          <Check className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-normal font-display text-ink mb-3">You&apos;re logged in!</h2>
        <p className="text-muted-ink mb-8 text-sm">
          You successfully authenticated in another tab. You can safely close this tab or continue to your account.
        </p>
        <Link
          href="/migrate?intent=login"
          className="btn-primary rounded-ledger min-h-[44px] w-full inline-flex items-center justify-center px-4 text-sm font-medium"
        >
          Continue to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="font-label text-xs uppercase tracking-widest text-muted-ink mb-1">Log In</p>
      <h1 className="font-display text-2xl font-normal text-ink mb-1">Welcome Back</h1>
      <p className="text-sm text-muted-ink mb-5">Enter your email to receive a magic link.</p>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-ink mb-1">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full min-w-0 max-w-full rounded-ledger border border-field-border bg-card text-base text-ink placeholder:text-muted-ink focus-ink px-3 py-2"
          />
        </div>
        <p
          role="status"
          className={`text-sm min-h-5 ${message ? (isError ? 'text-red-700 dark:text-red-400' : 'text-ink') : ''}`}
        >
          {message}
        </p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-hairline pt-3.5">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary rounded-ledger min-h-[44px] sm:min-w-[176px] px-4 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </button>
        </div>
      </form>
      <div className="mt-5 text-sm text-muted-ink text-center">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="link-ink font-medium">
          Sign up
        </Link>
      </div>
    </>
  );
}
