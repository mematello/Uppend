import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Uppend',
  description: 'Terms of Service for Uppend',
};

export default function TermsPage() {
  return (
    <div>
      <p className="font-label text-xs uppercase tracking-widest text-muted-ink">LEGAL</p>

      <h1 className="font-display text-4xl sm:text-5xl font-normal leading-[1.1] mt-2 mb-3">Terms of Service</h1>
      <p className="font-label text-xs tracking-wider text-muted-ink mb-6">Last Updated: September 10, 2026</p>

      <div className="border border-field-border bg-card rounded-ledger p-4 mb-6">
        <p className="text-sm leading-normal text-ink">
          Draft — pending legal review. This is boilerplate and does not constitute vetted legal advice.
        </p>
      </div>

      <section className="border-t border-hairline py-7">
        <h2 className="font-display text-xl sm:text-2xl font-normal mb-2.5">1. Acceptance of Terms</h2>
        <p className="text-base leading-relaxed">
          By accessing and using Uppend (&quot;Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. 
          If you do not agree to abide by these terms, please do not use this Service.
        </p>
      </section>

      <section className="border-t border-hairline py-7">
        <h2 className="font-display text-xl sm:text-2xl font-normal mb-2.5">2. Description of Service</h2>
        <p className="text-base leading-relaxed">
          Uppend is an AI-powered job application tracker that allows users to extract job descriptions, analyze resume fit, and track applications.
          The Service is provided &quot;as is&quot; and on an &quot;as available&quot; basis.
        </p>
      </section>

      <section className="border-t border-hairline py-7">
        <h2 className="font-display text-xl sm:text-2xl font-normal mb-2.5">3. User Data & Privacy</h2>
        <p className="text-base leading-relaxed">
          Your use of the Service is also governed by our Privacy Policy. By using Uppend, you consent to the practices detailed in our Privacy Policy, including the processing of text and resumes via third-party AI APIs.
        </p>
      </section>

      <section className="border-t border-hairline py-7">
        <h2 className="font-display text-xl sm:text-2xl font-normal mb-2.5">4. Acceptable Use</h2>
        <p className="text-base leading-relaxed">
          You agree not to use the Service for any unlawful purpose or in any way that interrupts, damages, or impairs the service. We reserve the right to terminate access to the Service for any user who violates these Terms.
        </p>
      </section>

      <section className="border-t border-hairline py-7">
        <h2 className="font-display text-xl sm:text-2xl font-normal mb-2.5">5. Disclaimer of Warranties</h2>
        <p className="text-base leading-relaxed">
          Uppend makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
        </p>
      </section>

      <section className="border-t border-hairline py-7">
        <h2 className="font-display text-xl sm:text-2xl font-normal mb-2.5">6. Changes to Terms</h2>
        <p className="text-base leading-relaxed">
          We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page.
        </p>
      </section>
    </div>
  );
}
