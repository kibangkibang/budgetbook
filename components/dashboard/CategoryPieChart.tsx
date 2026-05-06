'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryBreakdownEntry } from '@/types/report';
import { formatCurrency } from '@/lib/utils/format';

interface Props {
  breakdown: CategoryBreakdownEntry[];
}

const FALLBACK_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];

export function CategoryPieChart({ breakdown }: Props) {
  const expenses = breakdown.filter((c) => c.type === 'expense');

  if (expenses.length === 0) {
    return (
      <EmptyCard title="카테고리별 지출">
        이번 달 지출 내역이 없습니다.
      </EmptyCard>
    );
  }

  const data = expenses.map((c, i) => ({
    name: c.name,
    value: c.amount,
    color: c.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    percentage: c.percentage,
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-700">카테고리별 지출</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 space-y-1">
        {data.map((entry) => (
          <li key={entry.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="flex-1 text-gray-700">{entry.name}</span>
            <span className="text-gray-500">{entry.percentage.toFixed(1)}%</span>
            <span className="w-24 text-right font-medium text-gray-900">
              {formatCurrency(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-700">{title}</h3>
      <p className="text-center text-sm text-gray-500 py-8">{children}</p>
    </div>
  );
}
