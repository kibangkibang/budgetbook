import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { JsonUserRepository } from '@/lib/db/user-repo';

describe('JsonUserRepository', () => {
  let tmpDir: string;
  let repo: JsonUserRepository;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'budgetbook-test-'));
    repo = new JsonUserRepository(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('creates a user with generated id and timestamp', async () => {
    const user = await repo.create({
      email: 'alice@example.com',
      passwordHash: 'hash',
      name: 'Alice',
    });
    expect(user.id).toBeTruthy();
    expect(user.createdAt).toBeTruthy();
    expect(user.email).toBe('alice@example.com');
  });

  it('normalizes email to lowercase', async () => {
    const user = await repo.create({
      email: 'Bob@Example.COM',
      passwordHash: 'hash',
      name: 'Bob',
    });
    expect(user.email).toBe('bob@example.com');
  });

  it('rejects duplicate emails regardless of casing', async () => {
    await repo.create({ email: 'a@b.com', passwordHash: 'h', name: 'A' });
    await expect(
      repo.create({ email: 'A@B.COM', passwordHash: 'h', name: 'A2' }),
    ).rejects.toThrow(/already exists/);
  });

  it('finds user by email', async () => {
    const created = await repo.create({
      email: 'find@me.com',
      passwordHash: 'h',
      name: 'Find',
    });
    const found = await repo.findByEmail('FIND@me.com');
    expect(found?.id).toBe(created.id);
  });

  it('returns null when email not found', async () => {
    const found = await repo.findByEmail('missing@none.com');
    expect(found).toBeNull();
  });

  it('updates a user', async () => {
    const user = await repo.create({
      email: 'u@e.com',
      passwordHash: 'h',
      name: 'Old',
    });
    const updated = await repo.update(user.id, { name: 'New' });
    expect(updated.name).toBe('New');
    expect(updated.email).toBe('u@e.com');
  });

  it('deletes a user', async () => {
    const user = await repo.create({
      email: 'd@e.com',
      passwordHash: 'h',
      name: 'D',
    });
    await repo.delete(user.id);
    expect(await repo.get(user.id)).toBeNull();
  });

  it('throws when updating unknown id', async () => {
    await expect(repo.update('missing', { name: 'x' })).rejects.toThrow(/not found/);
  });
});
