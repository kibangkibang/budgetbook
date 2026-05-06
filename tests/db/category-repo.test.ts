import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { JsonCategoryRepository } from '@/lib/db/category-repo';

describe('JsonCategoryRepository', () => {
  let tmpDir: string;
  let repo: JsonCategoryRepository;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'budgetbook-test-'));
    repo = new JsonCategoryRepository(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('creates and lists categories scoped to user', async () => {
    await repo.create({ userId: 'u1', name: 'Food', type: 'expense', isDefault: true });
    await repo.create({ userId: 'u1', name: 'Salary', type: 'income', isDefault: true });
    await repo.create({ userId: 'u2', name: 'Other', type: 'expense', isDefault: false });

    const u1 = await repo.list('u1');
    const u2 = await repo.list('u2');

    expect(u1).toHaveLength(2);
    expect(u2).toHaveLength(1);
  });

  it('updates category fields but preserves userId', async () => {
    const cat = await repo.create({
      userId: 'u1',
      name: 'Food',
      type: 'expense',
      isDefault: false,
    });
    const updated = await repo.update(cat.id, { name: 'Groceries', color: '#fff' });
    expect(updated.name).toBe('Groceries');
    expect(updated.color).toBe('#fff');
    expect(updated.userId).toBe('u1');
  });

  it('deletes a category', async () => {
    const cat = await repo.create({
      userId: 'u1',
      name: 'X',
      type: 'expense',
      isDefault: false,
    });
    await repo.delete(cat.id);
    expect(await repo.get(cat.id)).toBeNull();
  });
});
