'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { DailyTrendChart } from '@/components/dashboard/DailyTrendChart';
import { TopExpenses } from '@/components/dashboard/TopExpenses';
import { CurrentAssetCard } from '@/components/dashboard/CurrentAssetCard';
import { useMonthlyReport } from '@/lib/hooks/useMonthlyReport';
import { currentMonth } from '@/lib/utils/format';

export default function DashboardPage() {
  const [month, setMonth] = useState<string>(currentMonth());
  const { data: report, isLoading, error } = useMonthlyReport(month);

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-57px)] bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">대시보드</h1>
            <MonthSelector value={month} onChange={setMonth} />
          </div>

          <CurrentAssetCard />

          {error && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
              오류: {error instanceof Error ? error.message : '알 수 없는 오류'}
            </p>
          )}

          {isLoading || !report ? (
            <p className="text-sm text-gray-500">불러오는 중...</p>
          ) : (
            <>
              <SummaryCards
                income={report.totalIncome}
                expense={report.totalExpense}
                balance={report.balance}
              />

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <CategoryPieChart breakdown={report.categoryBreakdown} />
                <DailyTrendChart data={report.dailyTrend} />
              </div>

              <TopExpenses items={report.topExpenses} />

              <p className="text-xs text-gray-400">
                총 {report.transactionCount}건의 거래
              </p>
            </>
          )}
        </div>
      </main>
    </>
  );
}
