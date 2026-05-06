import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { getRepositories } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { handleZodError, jsonError, unknownError } from '@/lib/api/response';
import { currentMonth } from '@/lib/utils/format';
import type {
  CategoryBreakdownEntry,
  DailyTrendEntry,
  MonthlyReport,
  TopExpenseEntry,
} from '@/types/report';

export const runtime = 'nodejs';

const querySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function emptyDays(month: string): DailyTrendEntry[] {
  const [y, m] = month.split('-').map(Number);
  const total = daysInMonth(y, m);
  const result: DailyTrendEntry[] = [];
  for (let d = 1; d <= total; d++) {
    const dd = String(d).padStart(2, '0');
    result.push({ date: `${month}-${dd}`, income: 0, expense: 0 });
  }
  return result;
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session.userId) return jsonError('UNAUTHORIZED', '로그인이 필요합니다', 401);

    const { searchParams } = new URL(req.url);
    const { month } = querySchema.parse(Object.fromEntries(searchParams.entries()));
    const targetMonth = month ?? currentMonth();

    const { transactions, categories } = getRepositories();
    const [txs, cats] = await Promise.all([
      transactions.list(session.userId, { month: targetMonth }),
      categories.list(session.userId),
    ]);

    const catById = new Map(cats.map((c) => [c.id, c]));

    let totalIncome = 0;
    let totalExpense = 0;

    const byCategory = new Map<string, { amount: number; count: number }>();
    const daily = emptyDays(targetMonth);
    const dailyIndex = new Map(daily.map((d, i) => [d.date, i]));

    for (const tx of txs) {
      if (tx.type === 'income') totalIncome += tx.amount;
      else totalExpense += tx.amount;

      const current = byCategory.get(tx.categoryId) ?? { amount: 0, count: 0 };
      current.amount += tx.amount;
      current.count += 1;
      byCategory.set(tx.categoryId, current);

      const idx = dailyIndex.get(tx.date);
      if (idx !== undefined) {
        if (tx.type === 'income') daily[idx].income += tx.amount;
        else daily[idx].expense += tx.amount;
      }
    }

    const categoryBreakdown: CategoryBreakdownEntry[] = [];
    for (const [categoryId, { amount, count }] of byCategory) {
      const category = catById.get(categoryId);
      if (!category) continue;
      const denom = category.type === 'income' ? totalIncome : totalExpense;
      const percentage = denom > 0 ? (amount / denom) * 100 : 0;
      categoryBreakdown.push({
        categoryId,
        name: category.name,
        color: category.color,
        type: category.type,
        amount,
        count,
        percentage,
      });
    }
    categoryBreakdown.sort((a, b) => b.amount - a.amount);

    const topExpenses: TopExpenseEntry[] = categoryBreakdown
      .filter((c) => c.type === 'expense')
      .slice(0, 3)
      .map((c) => ({
        categoryId: c.categoryId,
        name: c.name,
        color: c.color,
        amount: c.amount,
      }));

    const report: MonthlyReport = {
      month: targetMonth,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: txs.length,
      categoryBreakdown,
      dailyTrend: daily,
      topExpenses,
    };

    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    return unknownError(err);
  }
}
