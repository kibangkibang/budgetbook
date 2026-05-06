export function prevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return toMonthString(d);
}

export function nextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m, 1);
  return toMonthString(d);
}

function toMonthString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

export function formatMonthKo(month: string): string {
  const [y, m] = month.split('-');
  return `${y}년 ${Number(m)}월`;
}

export function computeDelta(current: number, previous: number) {
  const absolute = current - previous;
  let percentage: number | null;
  if (previous === 0 && current === 0) percentage = 0;
  else if (previous === 0) percentage = null;
  else percentage = (absolute / previous) * 100;
  return { absolute, percentage };
}
