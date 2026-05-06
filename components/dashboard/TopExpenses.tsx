'use client';

import type { TopExpenseEntry } from '@/types/report';
import { formatCurrency } from '@/lib/utils/format';

export function TopExpenses({ items }: { items: TopExpenseEntry[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-700">지출 TOP 3</h3>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">데이터가 없습니다.</p>
      ) : (
        <ol className="space-y-2">
          {items.map((item, idx) => (
            <li key={item.categoryId} className="flex items-center gap-3">
              <span className="w-5 text-center text-sm font-semibold text-gray-400">
                {idx + 1}
              </span>
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color ?? '#e5e7eb' }}
              />
              <span className="flex-1 text-sm text-gray-900">{item.name}</span>
              <span className="text-sm font-semibold text-red-600">
                {formatCurrency(item.amount)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
