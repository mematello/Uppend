import { Application } from '../types';
import { formatToLocalDate } from './dates';

export interface StreakStatus {
  status: 'active' | 'at_risk' | 'none';
  count: number;
}

function isWeekend(dateStr: string): boolean {
  // Append T00:00:00Z to ensure it parses as UTC, avoiding local DST shifts
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
}

export function getStreakStatus(applications: Application[], timezone: string | null): StreakStatus {
  if (!applications || applications.length === 0) return { status: 'none', count: 0 };
  
  const todayDateStr = formatToLocalDate(new Date(), timezone);
  const todayMs = new Date(todayDateStr + 'T00:00:00Z').getTime();
  const yesterdayDateStr = new Date(todayMs - 86400000).toISOString().split('T')[0];
  
  const activeDates = new Set<string>();
  for (const app of applications) {
    if (app.created_at) {
      const d = new Date(app.created_at);
      if (!isNaN(d.getTime())) {
        activeDates.add(formatToLocalDate(d, timezone));
      }
    }
  }

  // A day sustains the streak if you applied, OR if it's a weekend
  const isCovered = (dateStr: string) => activeDates.has(dateStr) || isWeekend(dateStr);
  
  let status: StreakStatus['status'] = 'none';
  let currentCheckStr = todayDateStr;

  if (isCovered(todayDateStr)) {
    status = 'active';
  } else if (isCovered(yesterdayDateStr)) {
    status = 'at_risk';
    currentCheckStr = yesterdayDateStr;
  } else {
    return { status: 'none', count: 0 };
  }
  
  let streak = 0;
  
  // Trace the continuous chain of covered days backwards
  while (isCovered(currentCheckStr)) {
    // Only increment the count for days where an application was actually made
    if (activeDates.has(currentCheckStr)) {
      streak++;
    }
    const ms = new Date(currentCheckStr + 'T00:00:00Z').getTime();
    currentCheckStr = new Date(ms - 86400000).toISOString().split('T')[0];
  }
  
  // If the chain consisted ONLY of weekends and no actual applications, it's not a streak
  if (streak === 0) {
    return { status: 'none', count: 0 };
  }
  
  return { status, count: streak };
}

export function getGoalProgress(applications: Application[], timezone: string | null, goalTarget: number): { count: number; goal: number; met: boolean } {
  if (!applications || applications.length === 0) return { count: 0, goal: goalTarget, met: goalTarget <= 0 };
  
  const todayDateStr = formatToLocalDate(new Date(), timezone);
  let count = 0;
  
  for (const app of applications) {
    if (app.created_at) {
      const d = new Date(app.created_at);
      if (!isNaN(d.getTime())) {
        if (formatToLocalDate(d, timezone) === todayDateStr) {
          count++;
        }
      }
    }
  }
  
  return { count, goal: goalTarget, met: count >= goalTarget };
}

export function getWeeklyCount(applications: Application[], timezone: string | null): number {
  if (!applications || applications.length === 0) return 0;
  
  const now = new Date();
  
  // Weekly calculations using timezone
  const localTodayDateObj = new Date(now.toLocaleString('en-US', { timeZone: timezone || 'UTC' }));
  const dayOfWeek = localTodayDateObj.getDay();
  const diffToMonday = localTodayDateObj.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  
  const mondayDate = new Date(localTodayDateObj.setDate(diffToMonday));
  const mondayStr = `${mondayDate.getFullYear()}-${String(mondayDate.getMonth() + 1).padStart(2, '0')}-${String(mondayDate.getDate()).padStart(2, '0')}`;
  
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);
  const sundayStr = `${sundayDate.getFullYear()}-${String(sundayDate.getMonth() + 1).padStart(2, '0')}-${String(sundayDate.getDate()).padStart(2, '0')}`;
  
  let count = 0;
  
  for (const app of applications) {
    if (app.created_at) {
      const d = new Date(app.created_at);
      if (!isNaN(d.getTime())) {
        const appDateStr = formatToLocalDate(d, timezone);
        if (appDateStr >= mondayStr && appDateStr <= sundayStr) {
          count++;
        }
      }
    }
  }
  
  return count;
}
