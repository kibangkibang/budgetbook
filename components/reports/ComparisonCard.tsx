'use client';

import { formatCurrency } from '@/lib/utils/format';
import { computeDelta } from '@/lib/utils/month';

interface Props {
  label: string;
  current: number;
  previous: number;
  /** For expense, an increase is negative (red). For income/balance, an increase is positive (green). */
  direction: 'higher-is-good' | 'higher-is-bad';
}

export function ComparisonCard({ label, current, previous, direction }: Props) {
  const { absolute, percentage } = computeDelta(current, previous);
  const increased = absolute > 0;
  const decreased = absolute < 0;

  const isGood =
    (increased && direction === 'higher-is-good') ||
    (decreased && direction === 'higher-is-bad');
  const isBad =
    (increased && direction === 'higher-is-bad') ||
    (decreased && direction === 'higher-is-good');

  const deltaColor = isGood
    ? 'text-green-600'
    : isBad
      ? 'text-red-600'
      : 'text-gray-500';
  const arrow = increased ? '▲' : decreased ? '▼' : '–';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">
        {formatCurrency(current)}
      </div>
      <div className={`mt-2 text-xs ${deltaColor}`}>
        <span className="mr-1">{arrow}</span>
        {percentage === null
          ? '전월 데이터 없음'
          : absolute === 0
            ? '전월과 동일'
            : `${formatCurrency(Math.abs(absolute))} (${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%)`}
      </div>
      <div className="mt-1 text-[11px] text-gray-400">
        전월: {formatCurrency(previous)}
      </div>
    </div>
  );
}
