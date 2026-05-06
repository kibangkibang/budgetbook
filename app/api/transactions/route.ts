import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getRepositories } from '@/lib/db';
import {
  transactionCreateSchema,
  transactionFilterSchema,
} from '@/lib/validation/transaction';
import { getSession } from '@/lib/auth/session';
import { handleZodError, jsonError, unknownError } from '@/lib/api/response';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session.userId) return jsonError('UNAUTHORIZED', '로그인이 필요합니다', 401);

    const { searchParams } = new URL(req.url);
    const raw = Object.fromEntries(searchParams.entries());
    const filter = transactionFilterSchema.parse(raw);

    const { transactions } = getRepositories();
    const list = await transactions.list(session.userId, filter);
    return NextResponse.json({ transactions: list });
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    return unknownError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.userId) return jsonError('UNAUTHORIZED', '로그인이 필요합니다', 401);

    const body = await req.json();
    const data = transactionCreateSchema.parse(body);

    const { categories, transactions } = getRepositories();
    const category = await categories.get(data.categoryId);
    if (!category || category.userId !== session.userId) {
      return jsonError('INVALID_CATEGORY', '카테고리를 찾을 수 없습니다', 400);
    }
    if (category.type !== data.type) {
      return jsonError('CATEGORY_TYPE_MISMATCH', '카테고리 타입이 일치하지 않습니다', 400);
    }

    const created = await transactions.create({ ...data, userId: session.userId });
    return NextResponse.json({ transaction: created }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    return unknownError(err);
  }
}
