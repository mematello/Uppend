export function formatToLocalDate(date: Date, timezone: string | null): string {
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
  
  return formatter.format(date);
}
