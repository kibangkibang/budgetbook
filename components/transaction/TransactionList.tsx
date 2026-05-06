'use client';

import { useState } from 'react';
import type { Category } from '@/types/category';
import type { Transaction } from '@/types/transaction';
import { formatDateKo, formatSignedCurrency } from '@/lib/utils/format';
import { TransactionForm } from './TransactionForm';
import type { TransactionCreateInput } from '@/lib/validation/transaction';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onUpdate: (id: string, input: TransactionCreateInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  updatingId?: string | null;
  deletingId?: string | null;
}

export function TransactionList({
  transactions,
  categories,
  onUpdate,
  onDelete,
  updatingId,
  deletingId,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const byDate = groupByDate(transactions);

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
        거래 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {byDate.map(([date, items]) => (
        <section key={date}>
          <h3 className="mb-2 text-xs font-medium text-gray-500">{formatDateKo(date)}</h3>
          <ul className="space-y-2">
            {items.map((tx) => {
              const category = categories.find((c) => c.id === tx.categoryId);
              if (editingId === tx.id) {
                return (
                  <li key={tx.id} className="rounded-lg border border-blue-300 bg-white p-2">
                    <TransactionForm
                      categories={categories}
                      initial={tx}
                      submitLabel="수정 저장"
                      submitting={updatingId === tx.id}
                      onSubmit={async (input) => {
                        await onUpdate(tx.id, input);
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  </li>
                );
              }
              return (
                <li
                  key={tx.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
                >
                  <span
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: category?.color ?? '#e5e7eb' }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {category?.name ?? '(삭제된 카테고리)'}
                      </span>
                      {tx.paymentMethod && (
                        <span className="text-xs text-gray-400">· {tx.paymentMethod}</span>
                      )}
                    </div>
                    {tx.memo && (
                      <p className="truncate text-xs text-gray-500">{tx.memo}</p>
                    )}
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      tx.type === 'expense' ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatSignedCurrency(tx.amount, tx.type)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingId(tx.id)}
                      className="rounded-md px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      수정
                    </button>
                    <button
                      disabled={deletingId === tx.id}
                      onClick={async () => {
                        if (!confirm('이 거래를 삭제할까요?')) return;
                        await onDelete(tx.id);
                      }}
                      className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function groupByDate(transactions: Transaction[]): [string, Transaction[]][] {
  const map = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const bucket = map.get(tx.date) ?? [];
    bucket.push(tx);
    map.set(tx.date, bucket);
  }
  return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
}
