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
