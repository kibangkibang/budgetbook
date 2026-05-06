'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useUser, useUpdateUser, type PublicUserDto } from '@/lib/hooks/useUser';
import { useAssets } from '@/lib/hooks/useAssets';
import { formatCurrency } from '@/lib/utils/format';

export default function SettingsPage() {
  const { data: user, isLoading } = useUser();
  const { data: assets } = useAssets();

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-57px)] bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-xl space-y-5">
          <h1 className="text-xl font-semibold text-gray-900">설정</h1>

          {isLoading || !user ? (
            <p className="text-sm text-gray-500">불러오는 중...</p>
          ) : (
            <>
              <ProfileForm key={user.id} user={user} />

              {assets && (
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <h2 className="mb-3 text-sm font-medium text-gray-700">자산 요약</h2>
                  <dl className="space-y-2 text-sm">
                    <Row label="초기 잔액" value={formatCurrency(assets.initialBalance)} />
                    <Row
                      label="누적 수입"
                      value={`+${formatCurrency(assets.totalIncome)}`}
                      color="text-green-600"
                    />
                    <Row
                      label="누적 지출"
                      value={`-${formatCurrency(assets.totalExpense)}`}
                      color="text-red-600"
                    />
                    <div className="border-t border-gray-100 pt-2">
                      <Row
                        label="현재 자산"
                        value={formatCurrency(assets.currentAsset)}
                        bold
                      />
                    </div>
                  </dl>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function ProfileForm({ user }: { user: PublicUserDto }) {
  const updateUser = useUpdateUser();
  const [name, setName] = useState(user.name);
  const [initialBalance, setInitialBalance] = useState(String(user.initialBalance));
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const parsed = Number(initialBalance);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      setServerError('초기 잔액은 정수여야 합니다');
      return;
    }
    try {
      await updateUser.mutateAsync({ name: name.trim(), initialBalance: parsed });
      setSavedAt(Date.now());
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '저장 실패');
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-5"
    >
      <h2 className="text-sm font-medium text-gray-700">프로필</h2>

      <Field label="이메일">
        <input
          value={user.email}
          disabled
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
        />
      </Field>

      <Field label="이름">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </Field>

      <Field
        label="초기 잔액"
        hint="가계부를 시작한 시점의 보유 자산. 현재 자산 계산에 사용됩니다."
      >
        <input
          type="number"
          inputMode="numeric"
          step={1}
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </Field>

      {serverError && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
      )}
      {savedAt && !updateUser.isPending && !serverError && (
        <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          저장되었습니다.
        </p>
      )}

      <button
        type="submit"
        disabled={updateUser.isPending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {updateUser.isPending ? '저장 중...' : '저장'}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-gray-500">{hint}</span>}
    </label>
  );
}

function Row({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`${color ?? 'text-gray-900'} ${bold ? 'font-semibold' : ''}`}>{value}</dd>
    </div>
  );
}
