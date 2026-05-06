import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getRepositories } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { userUpdateSchema } from '@/lib/validation/user';
import { handleZodError, jsonError, unknownError } from '@/lib/api/response';
import type { User } from '@/types/user';

export const runtime = 'nodejs';

function toPublic(u: User) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    initialBalance: u.initialBalance ?? 0,
    createdAt: u.createdAt,
  };
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session.userId) return jsonError('UNAUTHORIZED', '로그인이 필요합니다', 401);

    const { users } = getRepositories();
    const user = await users.get(session.userId);
    if (!user) return jsonError('NOT_FOUND', '사용자를 찾을 수 없습니다', 404);

    return NextResponse.json({ user: toPublic(user) });
  } catch (err) {
    return unknownError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session.userId) return jsonError('UNAUTHORIZED', '로그인이 필요합니다', 401);

    const body = await req.json();
    const data = userUpdateSchema.parse(body);

    const { users } = getRepositories();
    const existing = await users.get(session.userId);
    if (!existing) return jsonError('NOT_FOUND', '사용자를 찾을 수 없습니다', 404);

    const updated = await users.update(session.userId, data);

    if (data.name) {
      session.name = updated.name;
      await session.save();
    }

    return NextResponse.json({ user: toPublic(updated) });
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    return unknownError(err);
  }
}
