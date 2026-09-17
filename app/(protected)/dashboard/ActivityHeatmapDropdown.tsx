import React, { useState, useEffect } from 'react';
import { Application } from '../../../lib/types';
import { generateMonthGrid, getLocalYearMonth } from '../../../lib/utils/heatmap';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  applications: Application[];
  accountCreatedAt: string | null;
  timezone: string | null;
}

export default function ActivityHeatmapDropdown({
  applications,
  accountCreatedAt,
  timezone
}: Props) {
  // Current local month/year
  const todayLocal = getLocalYearMonth(new Date(), timezone);

  // Earliest boundary
  const startBound = accountCreatedAt
    ? getLocalYearMonth(new Date(accountCreatedAt), timezone)
    : todayLocal;

  // We need to safely ensure startBound is not after todayLocal
  if (startBound.year > todayLocal.year || (startBound.year === todayLocal.year && startBound.month > todayLocal.month)) {
    startBound.year = todayLocal.year;
    startBound.month = todayLocal.month;
  }

  const [viewYear, setViewYear] = useState(todayLocal.year);
  const [viewMonth, setViewMonth] = useState(todayLocal.month);

  const { weeks } = generateMonthGrid(applications, viewYear, viewMonth, timezone);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-white/2';
    if (count === 1) return 'bg-green-200 dark:bg-green-900/40';
    if (count === 2) return 'bg-green-400 dark:bg-green-700/60';
    if (count === 3) return 'bg-green-600 dark:bg-green-600';
    return 'bg-green-800 dark:bg-green-500';
  };

  const isAtEarliestBound = viewYear === startBound.year && viewMonth === startBound.month;
  const isAtLatestBound = viewYear === todayLocal.year && viewMonth === todayLocal.month;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAtEarliestBound) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAtLatestBound) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(viewYear, viewMonth, 1));

  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div
      className="p-4 w-72"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          disabled={isAtEarliestBound}
          className={`p-1 rounded transition-colors ${isAtEarliestBound ? 'opacity-0 cursor-default pointer-events-none' : 'hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400'}`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
          {monthName} {viewYear}
        </span>

        <button
          onClick={handleNext}
          disabled={isAtLatestBound}
          className={`p-1 rounded transition-colors ${isAtLatestBound ? 'opacity-0 cursor-default pointer-events-none' : 'hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400'}`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-gray-400 dark:text-zinc-500">
            {day.charAt(0)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, wIndex) => (
          week.map((day, dIndex) => (
            <div key={`${wIndex}-${dIndex}`} className="aspect-square">
              {day ? (
                <div
                  title={day.tooltip}
                  className={`w-full h-full rounded-sm transition-colors cursor-default ${getHeatmapColor(day.count)}`}
                />
              ) : (
                <div className="w-full h-full bg-transparent" />
              )}
            </div>
          ))
        ))}
      </div>
    </div>
  );
}
