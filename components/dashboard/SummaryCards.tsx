'use client';

import { formatCurrency } from '@/lib/utils/format';

interface Props {
  income: number;
  expense: number;
  balance: number;
}

export function SummaryCards({ income, expense, balance }: Props) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card label="이번 달 수입" value={income} tone="income" />
      <Card label="이번 달 지출" value={expense} tone="expense" />
      <Card label="잔액" value={balance} tone={balance >= 0 ? 'income' : 'expense'} />
    </section>
  );
}

function Card({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'income' | 'expense';
}) {
  const color = tone === 'income' ? 'text-green-600' : 'text-red-600';
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{formatCurrency(value)}</div>
    </div>
  );
}
