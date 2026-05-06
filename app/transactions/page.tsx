'use client';

import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useCategories } from '@/lib/hooks/useCategories';
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from '@/lib/hooks/useTransactions';
import type { TransactionType, TransactionFilter } from '@/types/transaction';
import { TransactionForm } from '@/components/transaction/TransactionForm';
import { TransactionList } from '@/components/transaction/TransactionList';
import { currentMonth, formatCurrency } from '@/lib/utils/format';

export default function TransactionsPage() {
  const [month, setMonth] = useState<string>(currentMonth());
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [createError, setCreateError] = useState<string | null>(null);

  const filter: TransactionFilter = useMemo(
    () => ({
      month,
      ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
      ...(categoryFilter !== 'all' ? { categoryId: categoryFilter } : {}),
    }),
    [month, typeFilter, categoryFilter],
  );

  const { data: categories = [] } = useCategories();
  const { data: transactions = [], isLoading } = useTransactions(filter);

  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const del = useDeleteTransaction();

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    }
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const filterCategories = categories.filter((c) =>
    typeFilter === 'all' ? true : c.type === typeFilter,
  );

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-57px)] bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">거래 내역</h1>
            <p className="text-sm text-gray-500">수입과 지출을 기록하고 관리합니다.</p>
          </div>

        <section className="grid grid-cols-3 gap-3">
          <SummaryCard label="수입" value={summary.income} tone="income" />
          <SummaryCard label="지출" value={summary.expense} tone="expense" />
          <SummaryCard label="잔액" value={summary.balance} tone="balance" />
        </section>

        <section className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">월</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">타입</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as TransactionType | 'all');
                setCategoryFilter('all');
              }}
              className="rounded-md border border-gray-300 px-2 py-1"
            >
              <option value="all">전체</option>
              <option value="expense">지출</option>
              <option value="income">수입</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">카테고리</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1"
            >
              <option value="all">전체</option>
              {filterCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-gray-700">새 거래 추가</h2>
          <TransactionForm
            categories={categories}
            submitLabel="추가"
            submitting={create.isPending}
            errorMessage={createError}
            onSubmit={async (input) => {
              setCreateError(null);
              try {
                await create.mutateAsync(input);
              } catch (err) {
                setCreateError(err instanceof Error ? err.message : '추가 실패');
              }
            }}
          />
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-gray-700">내역</h2>
          {isLoading ? (
            <p className="text-sm text-gray-500">불러오는 중...</p>
          ) : (
            <TransactionList
              transactions={transactions}
              categories={categories}
              updatingId={update.isPending ? update.variables?.id ?? null : null}
              deletingId={del.isPending ? del.variables ?? null : null}
              onUpdate={async (id, input) => {
                await update.mutateAsync({ id, input });
              }}
              onDelete={async (id) => {
                await del.mutateAsync(id);
              }}
            />
          )}
        </section>
        </div>
      </main>
    </>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'income' | 'expense' | 'balance';
}) {
  const color =
    tone === 'income' ? 'text-green-600' : tone === 'expense' ? 'text-red-600' : 'text-gray-900';
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${color}`}>{formatCurrency(value)}</div>
    </div>
  );
}
