import { Application } from '../types';
import { formatToLocalDate } from './dates';

export interface HeatmapDay {
  dateStr: string;
  count: number;
  tooltip: string;
}

export interface HeatmapMonthGrid {
  weeks: (HeatmapDay | null)[][]; // 7 elements per week (Sun-Sat), null for out of month
}

export function getLocalYearMonth(date: Date, timezone: string | null): { year: number, month: number } {
  const str = formatToLocalDate(date, timezone);
  const [y, m] = str.split('-');
  return { year: parseInt(y, 10), month: parseInt(m, 10) - 1 };
}

export function generateMonthGrid(
  applications: Application[],
  year: number,
  month: number, // 0-indexed (0 = Jan, 11 = Dec)
  timezone: string | null
): HeatmapMonthGrid {
  const tz = timezone || 'UTC';
  
  const monthStr = String(month + 1).padStart(2, '0');
  const startStr = `${year}-${monthStr}-01`;
  const startMs = new Date(startStr + 'T00:00:00Z').getTime();
  
  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear++;
  }
  const nextMonthStr = String(nextMonth + 1).padStart(2, '0');
  const endMs = new Date(`${nextYear}-${nextMonthStr}-01T00:00:00Z`).getTime() - 86400000;
  
  const startDayOfWeek = new Date(startMs).getUTCDay(); // 0 = Sunday
  
  const todayStr = formatToLocalDate(new Date(), tz);
  const todayMs = new Date(todayStr + 'T00:00:00Z').getTime();
  
  const counts = new Map<string, number>();
  for (const app of applications) {
    if (app.created_at) {
      const d = new Date(app.created_at);
      if (!isNaN(d.getTime())) {
        const dateStr = formatToLocalDate(d, tz);
        counts.set(dateStr, (counts.get(dateStr) || 0) + 1);
      }
    }
  }

  const weeks: (HeatmapDay | null)[][] = [];
  let currentWeek: (HeatmapDay | null)[] = new Array(7).fill(null);
  
  let currentDayOfWeek = startDayOfWeek;
  let currentMs = startMs;
  
  const utcTooltipFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });

  while (currentMs <= endMs) {
    if (currentMs > todayMs) {
      currentWeek[currentDayOfWeek] = null;
    } else {
      const d = new Date(currentMs);
      const dateStr = d.toISOString().split('T')[0];
      const formattedDate = utcTooltipFormatter.format(d);
      
      const count = counts.get(dateStr) || 0;
      const countText = count === 0 ? 'No applications' : count === 1 ? '1 application' : `${count} applications`;
      const tooltip = `${countText} — ${formattedDate}`;

      currentWeek[currentDayOfWeek] = {
        dateStr,
        count,
        tooltip
      };
    }

    currentDayOfWeek++;
    if (currentDayOfWeek > 6) {
      weeks.push(currentWeek);
      currentWeek = new Array(7).fill(null);
      currentDayOfWeek = 0;
    }

    currentMs += 86400000;
  }
  
  if (currentDayOfWeek > 0) {
    weeks.push(currentWeek);
  }

  return { weeks };
}
