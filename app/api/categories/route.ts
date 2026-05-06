import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getRepositories } from '@/lib/db';
import { categoryCreateSchema } from '@/lib/validation/category';
import { getSession } from '@/lib/auth/session';
import { handleZodError, jsonError, unknownError } from '@/lib/api/response';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.userId) return jsonError('UNAUTHORIZED', '로그인이 필요합니다', 401);

    const { categories } = getRepositories();
    const list = await categories.list(session.userId);
    list.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'expense' ? -1 : 1;
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.name.localeCompare(b.name, 'ko');
    });
    return NextResponse.json({ categories: list });
  } catch (err) {
    return unknownError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.userId) return jsonError('UNAUTHORIZED', '로그인이 필요합니다', 401);

    const body = await req.json();
    const data = categoryCreateSchema.parse(body);

    const { categories } = getRepositories();
    const created = await categories.create({
      ...data,
      userId: session.userId,
      isDefault: false,
    });
    return NextResponse.json({ category: created }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    return unknownError(err);
  }
}
