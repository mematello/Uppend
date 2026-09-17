import { Application } from '../types';
import { formatToLocalDate } from './dates';

export interface StreakStatus {
  status: 'active' | 'at_risk' | 'none';
  count: number;
}

export function getStreakStatus(applications: Application[], timezone: string | null): StreakStatus {
  if (!applications || applications.length === 0) return { status: 'none', count: 0 };
  
  const todayDateStr = formatToLocalDate(new Date(), timezone);
  
  // Safely get yesterday's calendar date in local timezone
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
  
  const hasToday = activeDates.has(todayDateStr);
  const hasYesterday = activeDates.has(yesterdayDateStr);
  
  if (!hasToday && !hasYesterday) {
    return { status: 'none', count: 0 };
  }
  
  const status = hasToday ? 'active' : 'at_risk';
  let streak = 0;
  let currentCheckStr = hasToday ? todayDateStr : yesterdayDateStr;
  
  while (activeDates.has(currentCheckStr)) {
    streak++;
    
    // Safely decrement one calendar day using UTC to avoid DST edge cases
    const ms = new Date(currentCheckStr + 'T00:00:00Z').getTime();
    currentCheckStr = new Date(ms - 86400000).toISOString().split('T')[0];
  }
  
  return { status, count: streak };
}
