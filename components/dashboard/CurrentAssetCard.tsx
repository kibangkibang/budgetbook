'use client';

import Link from 'next/link';
import { useAssets } from '@/lib/hooks/useAssets';
import { formatCurrency } from '@/lib/utils/format';

export function CurrentAssetCard() {
  const { data, isLoading, error, refetch, isFetching } = useAssets();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-gray-500">현재 총 자산</div>
          {isLoading ? (
            <div className="mt-1 h-8 w-40 animate-pulse rounded bg-gray-100" />
          ) : error ? (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-red-600">
                불러오기 실패: {error instanceof Error ? error.message : '알 수 없는 오류'}
              </span>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                다시 시도
              </button>
            </div>
          ) : data ? (
            <div className="mt-1 text-3xl font-semibold text-gray-900">
              {formatCurrency(data.currentAsset)}
            </div>
          ) : null}
        </div>
        <Link
          href="/settings"
          className="rounded-md bg-gray-100 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-200"
        >
          초기 잔액 설정
        </Link>
      </div>
      {data && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <Stat label="초기 잔액" value={data.initialBalance} />
          <Stat label="누적 수입" value={data.totalIncome} tone="income" />
          <Stat label="누적 지출" value={data.totalExpense} tone="expense" />
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'income' | 'expense';
}) {
  const color =
    tone === 'income' ? 'text-green-600' : tone === 'expense' ? 'text-red-600' : 'text-gray-700';
  return (
    <div className="rounded bg-gray-50 px-3 py-2">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className={`mt-0.5 font-semibold ${color}`}>{formatCurrency(value)}</div>
    </div>
  );
}
