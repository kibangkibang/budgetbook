'use client';

import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { ComparisonCard } from '@/components/reports/ComparisonCard';
import { CategoryDetailTable } from '@/components/reports/CategoryDetailTable';
import { useMonthlyReport } from '@/lib/hooks/useMonthlyReport';
import { currentMonth, formatCurrency } from '@/lib/utils/format';
import { formatMonthKo, prevMonth } from '@/lib/utils/month';

export default function ReportsPage() {
  const [month, setMonth] = useState<string>(currentMonth());
  const previous = useMemo(() => prevMonth(month), [month]);

  const currentReport = useMonthlyReport(month);
  const previousReport = useMonthlyReport(previous);

  const isLoading = currentReport.isLoading || previousReport.isLoading;
  const curr = currentReport.data;
  const prev = previousReport.data;

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-57px)] bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">월별 리포트</h1>
              <p className="text-sm text-gray-500">
                {formatMonthKo(month)} · 전월({formatMonthKo(previous)}) 대비
              </p>
            </div>
            <MonthSelector value={month} onChange={setMonth} />
          </div>

          {currentReport.error || previousReport.error ? (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
              오류:{' '}
              {(currentReport.error ?? previousReport.error) instanceof Error
                ? (currentReport.error ?? previousReport.error)!.message
                : '알 수 없는 오류'}
            </p>
          ) : isLoading || !curr || !prev ? (
            <p className="text-sm text-gray-500">불러오는 중...</p>
          ) : (
            <>
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ComparisonCard
                  label="수입"
                  current={curr.totalIncome}
                  previous={prev.totalIncome}
                  direction="higher-is-good"
                />
                <ComparisonCard
                  label="지출"
                  current={curr.totalExpense}
                  previous={prev.totalExpense}
                  direction="higher-is-bad"
                />
                <ComparisonCard
                  label="잔액"
                  current={curr.balance}
                  previous={prev.balance}
                  direction="higher-is-good"
                />
              </section>

              <CategoryDetailTable
                title="지출 카테고리"
                current={curr.categoryBreakdown.filter((c) => c.type === 'expense')}
                previous={prev.categoryBreakdown.filter((c) => c.type === 'expense')}
                direction="higher-is-bad"
              />

              <CategoryDetailTable
                title="수입 카테고리"
                current={curr.categoryBreakdown.filter((c) => c.type === 'income')}
                previous={prev.categoryBreakdown.filter((c) => c.type === 'income')}
                direction="higher-is-good"
              />

              <div className="text-xs text-gray-400">
                {formatMonthKo(month)} 총 {curr.transactionCount}건 ·{' '}
                {formatMonthKo(previous)} 총 {prev.transactionCount}건 · 누적 차이{' '}
                {formatCurrency(curr.balance - prev.balance)}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
