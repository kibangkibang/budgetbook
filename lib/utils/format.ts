export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export function formatSignedCurrency(amount: number, type: 'income' | 'expense'): string {
  const prefix = type === 'expense' ? '-' : '+';
  return prefix + formatCurrency(amount);
}

export function todayYmd(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function currentMonth(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

export function formatDateKo(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return `${y}.${m}.${d}`;
}
