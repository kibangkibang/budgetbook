'use client';

import type { CategoryBreakdownEntry } from '@/types/report';
import { formatCurrency } from '@/lib/utils/format';
import { computeDelta } from '@/lib/utils/month';

interface Row {
  categoryId: string;
  name: string;
  color?: string;
  currentAmount: number;
  currentCount: number;
  currentPercentage: number;
  previousAmount: number;
}

interface Props {
  title: string;
  current: CategoryBreakdownEntry[];
  previous: CategoryBreakdownEntry[];
  /** Whether an increase is bad (expense) or good (income). */
  direction: 'higher-is-good' | 'higher-is-bad';
}

function mergeRows(
  current: CategoryBreakdownEntry[],
  previous: CategoryBreakdownEntry[],
): Row[] {
  const prevMap = new Map(previous.map((p) => [p.categoryId, p]));
  const seen = new Set<string>();
  const rows: Row[] = [];

  for (const c of current) {
    seen.add(c.categoryId);
    const p = prevMap.get(c.categoryId);
    rows.push({
      categoryId: c.categoryId,
      name: c.name,
      color: c.color,
      currentAmount: c.amount,
      currentCount: c.count,
      currentPercentage: c.percentage,
      previousAmount: p?.amount ?? 0,
    });
  }
  for (const p of previous) {
    if (seen.has(p.categoryId)) continue;
    rows.push({
      categoryId: p.categoryId,
      name: p.name,
      color: p.color,
      currentAmount: 0,
      currentCount: 0,
      currentPercentage: 0,
      previousAmount: p.amount,
    });
  }
  rows.sort((a, b) => b.currentAmount - a.currentAmount);
  return rows;
}

export function CategoryDetailTable({ title, current, previous, direction }: Props) {
  const rows = mergeRows(current, previous);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-medium text-gray-700">{title}</h3>
        <p className="py-6 text-center text-sm text-gray-500">데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-700">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500">
              <th className="py-2 text-left font-medium">카테고리</th>
              <th className="py-2 text-right font-medium">건수</th>
              <th className="py-2 text-right font-medium">금액</th>
              <th className="py-2 text-right font-medium">비율</th>
              <th className="py-2 text-right font-medium">전월 대비</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <DeltaRow key={r.categoryId} row={r} direction={direction} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeltaRow({
  row,
  direction,
}: {
  row: Row;
  direction: 'higher-is-good' | 'higher-is-bad';
}) {
  const { absolute, percentage } = computeDelta(row.currentAmount, row.previousAmount);
  const increased = absolute > 0;
  const decreased = absolute < 0;
  const isGood =
    (increased && direction === 'higher-is-good') ||
    (decreased && direction === 'higher-is-bad');
  const isBad =
    (increased && direction === 'higher-is-bad') ||
    (decreased && direction === 'higher-is-good');
  const color = isGood ? 'text-green-600' : isBad ? 'text-red-600' : 'text-gray-500';
  const arrow = increased ? '▲' : decreased ? '▼' : '–';

  return (
    <tr className="border-b border-gray-50">
      <td className="py-2">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: row.color ?? '#e5e7eb' }}
          />
          <span className="text-gray-900">{row.name}</span>
        </div>
      </td>
      <td className="py-2 text-right text-gray-600">{row.currentCount}</td>
      <td className="py-2 text-right font-medium text-gray-900">
        {formatCurrency(row.currentAmount)}
      </td>
      <td className="py-2 text-right text-gray-500">
        {row.currentPercentage.toFixed(1)}%
      </td>
      <td className={`py-2 text-right text-xs ${color}`}>
        <span className="mr-1">{arrow}</span>
        {percentage === null
          ? '신규'
          : absolute === 0
            ? '동일'
            : `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`}
      </td>
    </tr>
  );
}
