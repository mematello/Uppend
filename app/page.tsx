import Link from "next/link";
import { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import { LandingHeader } from "../components/landing/LandingHeader";
import { LandingHero } from "../components/landing/LandingHero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { PrivacyNotice } from "../components/landing/PrivacyNotice";
import { OriginStory } from "../components/landing/OriginStory";
import styles from "../components/landing/landing.module.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-landing-fraunces",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-landing-mono",
});

export const metadata: Metadata = {
  title: "Uppend — AI-Powered Job Application Tracker",
  description: "Streamline your job search. Paste the job description, let AI extract the details, assess your fit, and remind you to follow up.",
  openGraph: {
    title: "Uppend — AI-Powered Job Application Tracker",
    description: "Streamline your job search. Paste the job description, let AI extract the details, assess your fit, and remind you to follow up.",
    images: ["/images/dashboard.png"],
  },
};

export default function Home() {
  return (
    <div
      className={`${fraunces.variable} ${jetbrainsMono.variable} ${styles.landingRoot} ${styles.ruledGrid} min-h-screen font-sans`}
    >
      {/* Header */}
      <LandingHeader />

      <main className="flex flex-col items-center w-full">
        {/* Hero Section */}
        <LandingHero />

        {/* Stage 2: How It Works */}
        <HowItWorks />

        {/* Stage 2: Privacy Notice */}
        <PrivacyNotice />

        {/* Stage 2: Origin Story */}
        <OriginStory />
      </main>

      {/* Footer (Untouched for Stage 3) */}
      <footer className="border-t border-gray-200 dark:border-zinc-800 py-12 text-center bg-white dark:bg-zinc-950">
        <h2 className="text-2xl font-bold mb-6">Ready to land your next role?</h2>
        <Link href="/signup" className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-lg font-medium transition-colors mb-10">
          Create your free account
        </Link>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-zinc-500 mb-4">
          <Link href="/terms" className="hover:text-gray-900 dark:hover:text-zinc-300">Terms of Service</Link>
          <span>&middot;</span>
          <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-zinc-300">Privacy Policy</Link>
        </div>
        <p className="text-sm text-gray-400 dark:text-zinc-600">
          &copy; {new Date().getFullYear()} Uppend. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
