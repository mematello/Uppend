import { NextResponse } from 'next/server';
import { createServiceClient } from '../../../../lib/supabase/serviceClient';
import { emailTransporter, verifyEmailTransporter } from '../../../../lib/utils/email';
import { getStreakStatus, getGoalProgress } from '../../../../lib/utils/streaks';
import { Application } from '../../../../lib/types';

const RETRY_ELAPSED_BUDGET_MS = 5000; // Heuristic default pending real latency data, easily tunable

// Helper to retry transient Supabase errors
async function withRetry<T extends { error: unknown }>(queryBuilderFn: () => PromiseLike<T>, startTime: number, budgetMs: number = RETRY_ELAPSED_BUDGET_MS): Promise<{ result: T; retried: boolean }> {
  let result = await queryBuilderFn();
  let retried = false;
  const err = result.error as { message?: unknown } | null;
  if (err && typeof err.message === 'string') {
    const msg = err.message.toLowerCase();
    if (msg.includes('timeout') || msg.includes('gateway') || msg.includes('fetch failed') || msg.includes('network')) {
      const elapsed = Date.now() - startTime;
      if (elapsed < budgetMs) {
        console.warn(`Transient error detected ("${err.message}"), retrying in 500ms...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        result = await queryBuilderFn();
        retried = true;
        const retryErr = result.error as { message?: unknown } | null;
        if (retryErr) {
          console.error(`Retry failed with error: ${retryErr.message}`);
        } else {
          console.log(`Retry succeeded.`);
        }
      } else {
        console.warn(`Transient error detected ("${err.message}"), but skipping retry due to insufficient time budget (${elapsed}ms elapsed >= ${budgetMs}ms budget).`);
      }
    }
  }
  return { result, retried };
}

export async function GET(req: Request) {
  const handlerStart = Date.now();
  let totalRetries = 0;

  try {
    const getBaseUrl = () => {
      if (process.env.APP_URL) {
        return process.env.APP_URL;
      }
      if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
      }
      if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
      }
      return 'http://localhost:3000';
    };

    // 1. Verify Vercel Cron authentication (only allow authorized requests)
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'test_secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Query Supabase (using Service Role to bypass RLS and access multiple users)
    const supabase = createServiceClient();
    
    // Verify SMTP connection before processing the batch
    const isSmtpReady = await verifyEmailTransporter();
    if (!isSmtpReady) {
      return NextResponse.json({ error: 'SMTP connection failed', elapsedMs: Date.now() - handlerStart }, { status: 500 });
    }

    // ============================================================================
    // PHASE 1 & 2: NEXT ACTION REMINDERS
    // ============================================================================
    
    // Fetch applications where reminders are enabled and not yet sent.
    const { result: appResult, retried: appRetried } = await withRetry(() => supabase
      .from('applications')
      .select(`
        id,
        user_id,
        company_name,
        role,
        next_action,
        next_action_date,
        users ( email )
      `)
      .eq('reminder_enabled', true)
      .eq('next_action_reminder_sent', false)
      .not('next_action_date', 'is', null), handlerStart);

    if (appRetried) totalRetries++;
    const { data: applications, error: appError } = appResult;

    if (appError) {
      console.error('Error fetching applications for reminders:', appError);
    }

    const nextActionFetched = applications?.length || 0;
    const nextActionSuccessful: string[] = [];
    const nextActionFailed: Record<string, unknown>[] = [];
    let nextActionQueryError: string | null = appError ? appError.message : null;
    const now = new Date();

    if (applications && applications.length > 0) {
      // Fetch user profiles to personalize the greeting and get timezone preferences
      const userIds = [...new Set(applications.map((app) => app.user_id))];
      const { result: profResult, retried: profRetried } = await withRetry(() => supabase
        .from('profiles')
        .select('id, full_name, reminder_timezone, reminder_send_time')
        .in('id', userIds), handlerStart);
        
      if (profRetried) totalRetries++;
      const { data: profiles } = profResult;

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      for (const app of applications) {
        const profile = profileMap.get(app.user_id);
        const tz = profile?.reminder_timezone || 'UTC';
        const sendTime = profile?.reminder_send_time || '09:00:00';
        
        let localDate = '';
        let localTime = '';
        
        try {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false,
          });
          const parts = formatter.formatToParts(now);
          const p = Object.fromEntries(parts.map(pt => [pt.type, pt.value]));
          localDate = `${p.year}-${p.month}-${p.day}`;
          let localHour = p.hour;
          if (localHour === '24') localHour = '00';
          localTime = `${localHour}:${p.minute}:00`;
        } catch (e) {
          console.error(`Error formatting date for timezone ${tz}`, e);
          continue;
        }
        
        // Check condition: local_date == next_action_date AND local_time >= reminder_send_time
        if (localDate === app.next_action_date && localTime >= sendTime) {
          // Atomic check-and-set: prevent race conditions from duplicate scheduler invocations
          const { result: updateResult, retried: updateRetried } = await withRetry(() => supabase
            .from('applications')
            .update({ next_action_reminder_sent: true })
            .eq('id', app.id)
            .eq('next_action_reminder_sent', false)
            .select('id'), handlerStart);
            
          if (updateRetried) totalRetries++;
          const { data: updateData, error: updateError } = updateResult;

          if (updateError || !updateData || updateData.length === 0) {
            console.log(`Skipping app ${app.id} - already sent or error acquiring lock`);
            continue;
          }

          const users = (app as { users?: { email?: string } | { email?: string }[] }).users;
          const email = Array.isArray(users) ? users[0]?.email : users?.email;
          if (!email) continue;

          const action = app.next_action || 'Follow up';
          const fullName = profile?.full_name;
          const firstName = fullName ? fullName.split(' ')[0] : 'there';
          
          try {
            const info = await emailTransporter.sendMail({
              from: `"Uppend Reminders" <${process.env.SMTP_EMAIL || 'uppend.noreply@gmail.com'}>`,
              to: email,
              subject: `Reminder: ${action} with ${app.company_name}`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #111827;">
                  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    <div style="padding: 32px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">Uppend</h1>
                    </div>
                    <div style="padding: 32px;">
                      <p style="margin-top: 0; margin-bottom: 24px; font-size: 16px; line-height: 24px; color: #374151;">
                        Hi ${firstName},<br><br>This is your scheduled reminder for your job application at <strong>${app.company_name}</strong>.
                      </p>
                      
                      <div style="background-color: #f3f4f6; border-left: 4px solid #111827; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 32px;">
                        <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Next Action</p>
                        <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">${action}</p>
                        <p style="margin: 0; font-size: 15px; color: #4b5563;"><strong>Role:</strong> ${app.role}</p>
                      </div>

                      <div style="text-align: center;">
                        <a href="${getBaseUrl()}/applications/${app.id}" style="display: inline-block; background-color: #111827; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 12px 24px; border-radius: 6px; text-align: center; transition: background-color 0.2s;">View Application Details</a>
                      </div>
                    </div>
                  </div>
                  <div style="max-width: 500px; margin: 24px auto 0; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">
                      You're receiving this because reminders are enabled for this application.<br>
                      <a href="${getBaseUrl()}/applications/${app.id}" style="color: #6b7280; text-decoration: underline;">Manage reminder settings &rarr;</a>
                    </p>
                  </div>
                </div>
              `,
            });

            if (info.rejected && info.rejected.length > 0) {
              console.error(`Failed to send email to ${email} for app ${app.id}: rejected by server`);
              nextActionFailed.push({ id: app.id, error: 'Rejected by server' });
              const { retried: r1Retried } = await withRetry(() => supabase.from('applications').update({ next_action_reminder_sent: false }).eq('id', app.id), handlerStart);
              if (r1Retried) totalRetries++;
            } else {
              console.log(`Successfully sent next_action email to ${email} for app ${app.id} (MessageId: ${info.messageId})`);
              nextActionSuccessful.push(app.id);
            }
          } catch (e: unknown) {
            console.error(`Exception sending email for app ${app.id}:`, e);
            nextActionFailed.push({ id: app.id, error: (e as Error).message });
            const { retried: r2Retried } = await withRetry(() => supabase.from('applications').update({ next_action_reminder_sent: false }).eq('id', app.id), handlerStart);
            if (r2Retried) totalRetries++;
          }
        }
      }
    }


    // ============================================================================
    // PHASE 3: DAILY STREAK + GOAL SUMMARY REMINDERS
    // ============================================================================
    let dailySummariesFetched = 0;
    const dailySummariesSuccessful: string[] = [];
    const dailySummariesFailed: Record<string, unknown>[] = [];
    let dailySummaryQueryError: string | null = null;

    const { result: summaryProfResult, retried: summaryProfRetried } = await withRetry(() => supabase
      .from('profiles')
      .select('id, full_name, reminder_timezone, daily_summary_last_sent_date, daily_goal')
      .eq('daily_summary_enabled', true), handlerStart);
    
    if (summaryProfRetried) totalRetries++;

    if (summaryProfResult.error) {
      console.error('Error fetching profiles for daily summary:', summaryProfResult.error);
      dailySummaryQueryError = summaryProfResult.error.message;
    } else {
      const summaryProfiles = summaryProfResult.data || [];
      dailySummariesFetched = summaryProfiles.length;

      const profilesToProcess: { profile: { id: string, full_name: string, reminder_timezone: string | null, daily_summary_last_sent_date: string | null, daily_goal: number, users?: { email?: string } | { email?: string }[] }; localDate: string }[] = [];
      const userIdsToProcess: string[] = [];

      for (const profile of summaryProfiles) {
        const tz = profile.reminder_timezone || 'UTC';
        let localDate = '';
        let localTime = '';
        try {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false,
          });
          const parts = formatter.formatToParts(now);
          const p = Object.fromEntries(parts.map(pt => [pt.type, pt.value]));
          localDate = `${p.year}-${p.month}-${p.day}`;
          let localHour = p.hour;
          if (localHour === '24') localHour = '00';
          localTime = `${localHour}:${p.minute}:00`;
        } catch (e) {
          console.error(`Error formatting date for timezone ${tz}`, e);
          continue;
        }

        // Only process if it's past 8 PM local and we haven't sent today
        if (localTime >= '20:00:00' && profile.daily_summary_last_sent_date !== localDate) {
          profilesToProcess.push({ profile, localDate });
          userIdsToProcess.push(profile.id);
        }
      }

      if (userIdsToProcess.length > 0) {
        // Fetch emails for these users
        const emailsMap = new Map<string, string>();
        const { result: usersResult, retried: usersRetried } = await withRetry(() => supabase
          .from('users')
          .select('id, email')
          .in('id', userIdsToProcess), handlerStart);
        if (usersRetried) totalRetries++;
        
        if (usersResult.data) {
          for (const u of usersResult.data) {
            emailsMap.set(u.id, u.email);
          }
        }

        // Fetch recent applications for these users (last 45 days)
        const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString();
        const { result: recentAppsResult, retried: recentAppsRetried } = await withRetry(() => supabase
          .from('applications')
          .select('id, user_id, created_at')
          .in('user_id', userIdsToProcess)
          .gte('created_at', fortyFiveDaysAgo), handlerStart);
        
        if (recentAppsRetried) totalRetries++;

        const recentApps = recentAppsResult.data || [];
        const appsByUser = new Map<string, Application[]>();
        for (const app of recentApps) {
          if (!appsByUser.has(app.user_id)) appsByUser.set(app.user_id, []);
          // Type cast since we only selected partial fields, but streak utils only need created_at
          appsByUser.get(app.user_id)!.push(app as Application);
        }

        for (const { profile, localDate } of profilesToProcess) {
          const userApps = appsByUser.get(profile.id) || [];
          const tz = profile.reminder_timezone || 'UTC';
          
          const streakInfo = getStreakStatus(userApps, tz);
          const goalInfo = getGoalProgress(userApps, tz, profile.daily_goal || 5);
          
          // Atomic lock on profile
          let lockQuery = supabase.from('profiles').update({ daily_summary_last_sent_date: localDate }).eq('id', profile.id);
          if (profile.daily_summary_last_sent_date === null) {
             lockQuery = lockQuery.is('daily_summary_last_sent_date', null);
          } else {
             lockQuery = lockQuery.eq('daily_summary_last_sent_date', profile.daily_summary_last_sent_date);
          }
          
          const { result: updateResult, retried: updateRetried } = await withRetry(() => lockQuery.select('id'), handlerStart);
          if (updateRetried) totalRetries++;
          
          if (updateResult.error || !updateResult.data || updateResult.data.length === 0) {
            console.log(`Skipping daily summary for user ${profile.id} - already sent or error acquiring lock`);
            continue;
          }

          const email = emailsMap.get(profile.id);
          if (!email) continue;

          const fullName = profile.full_name;
          const firstName = fullName ? fullName.split(' ')[0] : 'there';
          
          const streakEmoji = streakInfo.status === 'active' ? '🔥' : '⏳';
          const goalEmoji = goalInfo.met ? '✅' : '📋';

          try {
            const info = await emailTransporter.sendMail({
              from: `"Uppend Reminders" <${process.env.SMTP_EMAIL || 'uppend.noreply@gmail.com'}>`,
              to: email,
              subject: `Your Daily Uppend Summary`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #111827;">
                  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    <div style="padding: 32px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">Uppend</h1>
                    </div>
                    <div style="padding: 32px;">
                      <p style="margin-top: 0; margin-bottom: 24px; font-size: 16px; line-height: 24px; color: #374151;">
                        Hi ${firstName},<br><br>Here is your daily job application summary:
                      </p>
                      
                      <div style="background-color: #f3f4f6; border-left: 4px solid #111827; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                        <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Daily Goal</p>
                        <p style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600; color: #111827;">${goalEmoji} ${goalInfo.count} of ${goalInfo.goal} applications</p>
                      </div>

                      <div style="background-color: #f3f4f6; border-left: 4px solid #111827; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 32px;">
                        <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Current Streak</p>
                        <p style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600; color: #111827;">${streakEmoji} ${streakInfo.count} days</p>
                      </div>

                      <div style="text-align: center;">
                        <a href="${getBaseUrl()}/dashboard" style="display: inline-block; background-color: #111827; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 12px 24px; border-radius: 6px; text-align: center; transition: background-color 0.2s;">Go to Dashboard</a>
                      </div>
                    </div>
                  </div>
                  <div style="max-width: 500px; margin: 24px auto 0; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">
                      You're receiving this because daily summaries are enabled.<br>
                      <a href="${getBaseUrl()}/settings" style="color: #6b7280; text-decoration: underline;">Manage settings &rarr;</a>
                    </p>
                  </div>
                </div>
              `,
            });

            if (info.rejected && info.rejected.length > 0) {
              console.error(`Failed to send daily summary email to ${email} for user ${profile.id}: rejected by server`);
              dailySummariesFailed.push({ id: profile.id, error: 'Rejected by server' });
              // Rollback the lock so it can be retried
              const rollbackQuery = supabase.from('profiles').update({ daily_summary_last_sent_date: profile.daily_summary_last_sent_date }).eq('id', profile.id);
              const { retried: r1Retried } = await withRetry(() => rollbackQuery, handlerStart);
              if (r1Retried) totalRetries++;
            } else {
              console.log(`Successfully sent daily summary email to ${email} for user ${profile.id} (MessageId: ${info.messageId})`);
              dailySummariesSuccessful.push(profile.id);
            }
          } catch (e: unknown) {
            console.error(`Exception sending daily summary email for user ${profile.id}:`, e);
            dailySummariesFailed.push({ id: profile.id, error: (e as Error).message });
            // Rollback the lock so it can be retried
            const rollbackQuery = supabase.from('profiles').update({ daily_summary_last_sent_date: profile.daily_summary_last_sent_date }).eq('id', profile.id);
            const { retried: r2Retried } = await withRetry(() => rollbackQuery, handlerStart);
            if (r2Retried) totalRetries++;
          }
        }
      }
    }


    return NextResponse.json({ 
      success: true, 
      nextActionReminders: {
        fetched: nextActionFetched,
        successful: nextActionSuccessful.length,
        failed: nextActionFailed.length,
        error: nextActionQueryError,
        details: { successfulSends: nextActionSuccessful, failedSends: nextActionFailed }
      },
      dailySummaries: {
        fetched: dailySummariesFetched,
        successful: dailySummariesSuccessful.length,
        failed: dailySummariesFailed.length,
        error: dailySummaryQueryError,
        details: { successfulSends: dailySummariesSuccessful, failedSends: dailySummariesFailed }
      },
      elapsedMs: Date.now() - handlerStart,
      retriedCount: totalRetries
    });

  } catch (err: unknown) {
    console.error('Cron reminder error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: (err as Error).message, elapsedMs: Date.now() - handlerStart }, { status: 500 });
  }
}
