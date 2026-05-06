import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getRepositories } from '@/lib/db';
import { seedDefaultCategories } from '@/lib/db/seed';
import { signupSchema } from '@/lib/validation/auth';
import { hashPassword } from '@/lib/auth/password';
import { getSession } from '@/lib/auth/session';
import { handleZodError, jsonError, unknownError } from '@/lib/api/response';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = signupSchema.parse(body);

    const { users, categories } = getRepositories();
    const existing = await users.findByEmail(email);
    if (existing) {
      return jsonError('EMAIL_TAKEN', '이미 가입된 이메일입니다', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await users.create({ email, passwordHash, name });
    await seedDefaultCategories(user.id, categories);

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
