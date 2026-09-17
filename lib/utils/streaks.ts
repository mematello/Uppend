import { Application } from '../types';

export interface StreakStatus {
  status: 'active' | 'at_risk' | 'none';
  count: number;
}

export function getStreakStatus(applications: Application[], timezone: string | null): StreakStatus {
  if (!applications || applications.length === 0) return { status: 'none', count: 0 };
  
  const tz = timezone || 'UTC';
  
  let formatter: Intl.DateTimeFormat;
  try {
    // en-CA natively outputs YYYY-MM-DD
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (_e) {
    // Fallback if timezone string from DB is somehow invalid
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
  
  const formatToLocalDate = (date: Date) => formatter.format(date);
  
  const todayDateStr = formatToLocalDate(new Date());
  
  // Safely get yesterday's calendar date in local timezone
  const todayMs = new Date(todayDateStr + 'T00:00:00Z').getTime();
  const yesterdayDateStr = new Date(todayMs - 86400000).toISOString().split('T')[0];
  
  const activeDates = new Set<string>();
  for (const app of applications) {
    if (app.created_at) {
      const d = new Date(app.created_at);
      if (!isNaN(d.getTime())) {
        activeDates.add(formatToLocalDate(d));
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
