import { emailTransporter, verifyEmailTransporter } from '../utils/email';
import { createServiceClient } from '../supabase/serviceClient';

export function sendOperatorAlert(subject: string, html: string) {
  if (!process.env.ALERT_EMAIL || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn(`[Alerting] ALERT_EMAIL or SMTP credentials not set. Suppressing alert: "${subject}"`);
    return;
  }
  
  // Fire-and-forget: we do not await this in the critical path
  verifyEmailTransporter().then((isValid) => {
    if (!isValid) return;
    return emailTransporter.sendMail({
      from: `"Uppend Alerts" <${process.env.SMTP_EMAIL}>`,
      to: process.env.ALERT_EMAIL,
      subject,
      html
    });
  }).catch((err: unknown) => {
    console.error("[Alerting] Failed to send operator alert:", err);
  });
}

export async function recordExhaustionAndCheckAlert(): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('record_exhaustion_event');
    if (error) throw error;
    return data === true;
  } catch (err) {
    console.error(`[Alerting] Failed to record exhaustion event:`, err);
    return false;
  }
}

export async function checkAndRecordExhaustion(): Promise<void> {
  const shouldAlert = await recordExhaustionAndCheckAlert();
  if (shouldAlert) {
    sendOperatorAlert(
      `Critical: All AI Models Exhausted`,
      `<p>The fallback chain has been exhausted 3 times in the last hour.</p>
       <p>This indicates severe quota pressure or a systemic failure across all models.</p>`
    );
  }
}
