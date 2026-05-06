import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function jsonError(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function handleZodError(error: ZodError) {
  const first = error.issues[0];
  const message = first?.message ?? 'Invalid input';
  return jsonError('VALIDATION_ERROR', message, 400);
}

export function unknownError(err: unknown) {
  const message = err instanceof Error ? err.message : 'Unexpected error';
  return jsonError('INTERNAL_ERROR', message, 500);
}
