import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { JsonTransactionRepository } from '@/lib/db/transaction-repo';

describe('JsonTransactionRepository', () => {
  let tmpDir: string;
  let repo: JsonTransactionRepository;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'budgetbook-test-'));
    repo = new JsonTransactionRepository(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  const seed = async () => {
    await repo.create({
      userId: 'u1',
      type: 'expense',
      amount: 10000,
      categoryId: 'food',
      date: '2026-04-01',
      memo: 'lunch',
    });
    await repo.create({
      userId: 'u1',
      type: 'expense',
      amount: 5000,
      categoryId: 'food',
      date: '2026-04-10',
    });
    await repo.create({
      userId: 'u1',
      type: 'income',
      amount: 2000000,
      categoryId: 'salary',
      date: '2026-04-25',
    });
    await repo.create({
      userId: 'u1',
      type: 'expense',
      amount: 8000,
      categoryId: 'cafe',
      date: '2026-03-15',
    });
    await repo.create({
      userId: 'u2',
      type: 'expense',
      amount: 1000,
      categoryId: 'food',
      date: '2026-04-05',
    });
  };

  it('creates a transaction with timestamps', async () => {
    const tx = await repo.create({
      userId: 'u1',
      type: 'expense',
      amount: 100,
      categoryId: 'food',
      date: '2026-04-20',
    });
    expect(tx.id).toBeTruthy();
    expect(tx.createdAt).toBeTruthy();
    expect(tx.updatedAt).toBe(tx.createdAt);
  });

  it('scopes list to userId', async () => {
    await seed();
    const u1 = await repo.list('u1');
    const u2 = await repo.list('u2');
    expect(u1).toHaveLength(4);
    expect(u2).toHaveLength(1);
  });

  it('filters by month', async () => {
    await seed();
    const april = await repo.list('u1', { month: '2026-04' });
    expect(april).toHaveLength(3);
    expect(april.every((t) => t.date.startsWith('2026-04'))).toBe(true);
  });

  it('filters by type and category', async () => {
    await seed();
    const expenses = await repo.list('u1', { type: 'expense' });
    expect(expenses).toHaveLength(3);
    const food = await repo.list('u1', { categoryId: 'food' });
    expect(food).toHaveLength(2);
  });

  it('filters by date range', async () => {
    await seed();
    const result = await repo.list('u1', { from: '2026-04-05', to: '2026-04-20' });
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-04-10');
  });

  it('sorts by date desc', async () => {
    await seed();
    const list = await repo.list('u1');
    for (let i = 0; i < list.length - 1; i++) {
      expect(list[i].date >= list[i + 1].date).toBe(true);
    }
  });

  it('updates a transaction and bumps updatedAt', async () => {
    const tx = await repo.create({
      userId: 'u1',
      type: 'expense',
      amount: 100,
      categoryId: 'food',
      date: '2026-04-20',
    });
    await new Promise((r) => setTimeout(r, 5));
    const updated = await repo.update(tx.id, { amount: 200 });
    expect(updated.amount).toBe(200);
    expect(updated.updatedAt).not.toBe(tx.updatedAt);
    expect(updated.createdAt).toBe(tx.createdAt);
  });

  it('deletes a transaction', async () => {
    const tx = await repo.create({
      userId: 'u1',
      type: 'expense',
      amount: 100,
      categoryId: 'food',
      date: '2026-04-20',
    });
    await repo.delete(tx.id);
    expect(await repo.get(tx.id)).toBeNull();
  });
});
