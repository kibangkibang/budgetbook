'use client';

import { useQuery } from '@tanstack/react-query';
import type { AssetsReport } from '@/types/report';

async function http<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useAssets() {
  return useQuery({
    queryKey: ['reports', 'assets'],
    queryFn: () => http<{ report: AssetsReport }>('/api/reports/assets'),
    select: (data) => data.report,
  });
}
