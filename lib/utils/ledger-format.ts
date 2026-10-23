const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

export function fitValue(
  roleFit: number | null | undefined,
  cultureFit: number | null | undefined
): number | null {
  const values: number[] = [];
  if (typeof roleFit === 'number' && !Number.isNaN(roleFit)) {
    values.push(roleFit);
  }
  if (typeof cultureFit === 'number' && !Number.isNaN(cultureFit)) {
    values.push(cultureFit);
  }

  if (values.length === 0) {
    return null;
  }

  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

export function compareNullsLast(
  a: number | null,
  b: number | null,
  asc: boolean
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (a === b) return 0;
  return asc ? a - b : b - a;
}

export function averageFit(
  roleFit: number | null | undefined,
  cultureFit: number | null | undefined
): string {
  const avg = fitValue(roleFit, cultureFit);
  if (avg === null) {
    return '—';
  }

  const text = Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
  return `${text}/5`;
}

export function formatMonthDay(date: string | null | undefined): string {
  if (!date || typeof date !== 'string') {
    return '—';
  }

  const datePart = date.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return '—';
  }

  const parts = datePart.split('-');
  const monthNum = parseInt(parts[1], 10);
  const dayNum = parseInt(parts[2], 10);

  if (monthNum < 1 || monthNum > 12 || Number.isNaN(dayNum)) {
    return '—';
  }

  const monthName = MONTH_NAMES[monthNum - 1];
  return `${monthName} ${dayNum}`;
}
