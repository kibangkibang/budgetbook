'use client';

import { useQuery } from '@tanstack/react-query';
import type { MonthlyReport } from '@/types/report';

async function http<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useMonthlyReport(month: string) {
  return useQuery({
    queryKey: ['reports', 'monthly', month],
    queryFn: () => http<{ report: MonthlyReport }>(`/api/reports/monthly?month=${month}`),
    select: (data) => data.report,
  });
}
