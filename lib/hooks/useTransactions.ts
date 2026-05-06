'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Transaction, TransactionFilter } from '@/types/transaction';
import type {
  TransactionCreateInput,
  TransactionUpdateInput,
} from '@/lib/validation/transaction';

const TRANSACTIONS_KEY = 'transactions' as const;

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function buildQuery(filter: TransactionFilter = {}): string {
  const params = new URLSearchParams();
  if (filter.type) params.set('type', filter.type);
  if (filter.categoryId) params.set('categoryId', filter.categoryId);
  if (filter.month) params.set('month', filter.month);
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useTransactions(filter: TransactionFilter = {}) {
  return useQuery({
    queryKey: [TRANSACTIONS_KEY, filter],
    queryFn: () =>
      http<{ transactions: Transaction[] }>(`/api/transactions${buildQuery(filter)}`),
    select: (data) => data.transactions,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] });
  qc.invalidateQueries({ queryKey: ['reports'] });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionCreateInput) =>
      http<{ transaction: Transaction }>('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TransactionUpdateInput }) =>
      http<{ transaction: Transaction }>(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      http<{ ok: boolean }>(`/api/transactions/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(qc),
  });
}
