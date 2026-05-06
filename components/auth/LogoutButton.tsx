'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full rounded-md bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
    >
      {loading ? '로그아웃 중...' : '로그아웃'}
    </button>
  );
}
