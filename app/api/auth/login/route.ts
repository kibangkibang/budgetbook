import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getRepositories } from '@/lib/db';
import { loginSchema } from '@/lib/validation/auth';
import { verifyPassword } from '@/lib/auth/password';
import { getSession } from '@/lib/auth/session';
import { handleZodError, jsonError, unknownError } from '@/lib/api/response';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const { users } = getRepositories();
    const user = await users.findByEmail(email);
    if (!user) {
      return jsonError('INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다', 401);
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return jsonError('INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다', 401);
    }

    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.name = user.name;
    await session.save();

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    return unknownError(err);
  }
}
