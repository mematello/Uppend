import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Uppend',
  description: 'Privacy Policy for Uppend',
};

export default function PrivacyPage() {
  return (
    <div>
      <p className="font-label text-xs uppercase tracking-widest text-muted-ink">LEGAL</p>

      <h1 className="font-display text-4xl sm:text-5xl font-normal leading-[1.1] mt-2 mb-3">Privacy Policy</h1>
      <p className="font-label text-xs tracking-wider text-muted-ink mb-6">Last Updated: October 3, 2026</p>

      <div className="border border-field-border bg-card rounded-ledger p-4 mb-6">
        <p className="text-sm leading-normal text-ink">
          Draft — pending legal review. This is boilerplate and does not constitute vetted legal advice.
        </p>
      </div>

      <section className="border-t border-hairline py-7">
        <h2 className="font-display text-xl sm:text-2xl font-normal mb-2.5">1. Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-2 marker:text-muted-ink text-base leading-relaxed">
          <li><strong>Account Email:</strong> We collect your email address when you create an account to facilitate secure login via magic links and send application reminder notifications.</li>
          <li><strong>Job Descriptions:</strong> The raw job description text (`raw_jd`) you paste is processed to extract structured fields (e.g., company, role, requirements).</li>
          <li><strong>Resumes & Extracted Text:</strong> If you choose to upload a resume, the file is securely stored in Supabase Storage, and the extracted text is processed to generate AI fit scores.</li>
          <li><strong>AI Fit Scores:</strong> Generated metrics (role fit, culture fit, matching strengths and gaps) are saved alongside your application records.</li>
        </ul>
      </section>

      <section className="border-t border-hairline py-7">
        <h2 className="font-display text-xl sm:text-2xl font-normal mb-2.5">2. Local Mode Data & Deletion</h2>
        <p className="text-base leading-relaxed">
          If you use Uppend without an account (&quot;Local Mode&quot;), your application data and AI scores are stored exclusively in your browser&apos;s <strong>IndexedDB</strong>. 
          This data remains on your device. You can permanently delete all local-mode data at any time by using the <strong>Clear Local Data</strong> control located in the Settings page. This action is irreversible and wipes your IndexedDB storage entirely.
        </p>
      </section>

      <section className="border-t border-hairline py-7">
        <h2 className="font-display text-xl sm:text-2xl font-normal mb-2.5">3. Third-Party Processors</h2>
        <p className="text-base leading-relaxed">Uppend relies on the following third-party services to function:</p>
        <ul className="mt-3 list-disc pl-5 space-y-2 marker:text-muted-ink text-base leading-relaxed">
          <li><strong>AI Processors (Google and Groq):</strong> To generate structured data and fit scores, we send the job description text you provide and the text extracted from your resume to an AI provider. We do not send your account ID or login email, but your resume text may contain your name and contact details. The shared AI pool uses Google Gemini and may use Groq when Gemini is unavailable. If you use the &apos;Bring Your Own Key&apos; (BYOK) feature, your text goes only to the provider(s) whose key(s) you have saved. Each provider handles this data under its own terms, including how long it keeps it and whether it uses it to improve its products (see the <a href="https://ai.google.dev/terms" target="_blank" rel="noreferrer" className="link-ink">Gemini API terms</a> and the <a href="https://console.groq.com/docs/your-data" target="_blank" rel="noreferrer" className="link-ink">Groq data documentation</a>). 
          Because the shared AI pool currently uses Google&apos;s free (unpaid) Gemini API tier, Google may use the job description and resume text sent through it to improve its products and machine learning technologies, and human reviewers may read it. If you use your own API key (BYOK), your text is handled under the terms that apply to your own key&apos;s plan.</li>
          <li><strong>Supabase:</strong> Our backend provider. For authenticated users, Supabase handles database storage, authentication, and secure file hosting for resumes (Supabase Storage).</li>
          <li><strong>Gmail SMTP:</strong> Used to deliver authentication magic links and optional follow-up reminder emails regarding your applications.</li>
        </ul>
      </section>

      <section className="border-t border-hairline py-7">
        <h2 className="font-display text-xl sm:text-2xl font-normal mb-2.5">4. Essential Cookies & Storage</h2>
        <p className="text-base leading-relaxed">
          Uppend does not use tracking, marketing, or analytics cookies. We use essential cookies required for Supabase authentication to maintain your secure session. 
          We also use your browser&apos;s local storage to remember non-sensitive UI preferences, such as your dark mode theme preference and cookie banner dismissal state.
        </p>
      </section>

      <section className="border-t border-hairline py-7">
        <h2 className="font-display text-xl sm:text-2xl font-normal mb-2.5">5. Contact Us</h2>
        <p className="text-base leading-relaxed">
          If you have any questions or concerns about this Privacy Policy or how your data is handled, please contact us.
        </p>
      </section>
    </div>
  );
}
