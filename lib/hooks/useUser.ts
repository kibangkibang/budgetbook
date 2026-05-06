'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserUpdateInput } from '@/lib/validation/user';

export interface PublicUserDto {
  id: string;
  email: string;
  name: string;
  initialBalance: number;
  createdAt: string;
}

const USER_KEY = ['user', 'me'] as const;

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useUser() {
  return useQuery({
    queryKey: USER_KEY,
    queryFn: () => http<{ user: PublicUserDto }>('/api/user/me'),
    select: (data) => data.user,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UserUpdateInput) =>
      http<{ user: PublicUserDto }>('/api/user/me', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USER_KEY });
      qc.invalidateQueries({ queryKey: ['reports', 'assets'] });
    },
  });
}
