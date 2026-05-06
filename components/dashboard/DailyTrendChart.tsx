'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailyTrendEntry } from '@/types/report';
import { formatCurrency } from '@/lib/utils/format';

interface Props {
  data: DailyTrendEntry[];
}

export function DailyTrendChart({ data }: Props) {
  const chartData = data.map((d) => ({
    day: Number(d.date.slice(-2)),
    income: d.income,
    expense: d.expense,
  }));

  const hasAny = data.some((d) => d.income > 0 || d.expense > 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-700">일별 추이</h3>
      {!hasAny ? (
        <p className="text-center text-sm text-gray-500 py-16">
          이번 달 거래가 없습니다.
        </p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
                tickFormatter={(v: number) =>
                  v >= 10000 ? `${(v / 10000).toFixed(0)}만` : String(v)
                }
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                labelFormatter={(day) => `${day}일`}
                contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="expense"
                name="지출"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="income"
                name="수입"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
