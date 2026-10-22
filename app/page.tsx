import { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import { LandingHeader } from "../components/landing/LandingHeader";
import { LandingHero } from "../components/landing/LandingHero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { PrivacyNotice } from "../components/landing/PrivacyNotice";
import { OriginStory } from "../components/landing/OriginStory";
import { SiteFooter } from "../components/landing/SiteFooter";
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

      {/* Stage 3: Site Footer */}
      <SiteFooter />
    </div>
  );
}
