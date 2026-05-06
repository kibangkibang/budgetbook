import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { JsonStore } from '@/lib/db/json-store';

interface TestRecord {
  id: string;
  name: string;
}

describe('JsonStore', () => {
  let tmpDir: string;
  let store: JsonStore<TestRecord>;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'budgetbook-test-'));
    store = new JsonStore<TestRecord>('test.json', tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('initializes an empty file on first access', async () => {
    const file = await store.read();
    expect(file.version).toBe(1);
    expect(file.records).toEqual({});
  });

  it('writes and reads records via mutate', async () => {
    await store.mutate((records) => {
      records['a'] = { id: 'a', name: 'Alice' };
    });

    const list = await store.list();
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual({ id: 'a', name: 'Alice' });
  });

  it('get returns null for missing id', async () => {
    const result = await store.get('missing');
    expect(result).toBeNull();
  });

  it('mutate returns the callback result', async () => {
    const result = await store.mutate((records) => {
      records['x'] = { id: 'x', name: 'X' };
      return 42;
    });
    expect(result).toBe(42);
  });

  it('persists data across JsonStore instances on the same file', async () => {
    await store.mutate((records) => {
      records['b'] = { id: 'b', name: 'Bob' };
    });

    const another = new JsonStore<TestRecord>('test.json', tmpDir);
    const fetched = await another.get('b');
    expect(fetched).toEqual({ id: 'b', name: 'Bob' });
  });

  it('serializes concurrent mutations without losing writes', async () => {
    const writers = Array.from({ length: 20 }, (_, i) =>
      store.mutate((records) => {
        records[`k${i}`] = { id: `k${i}`, name: `v${i}` };
      }),
    );
    await Promise.all(writers);
    const list = await store.list();
    expect(list).toHaveLength(20);
  });

  it('writes atomically (no partial .tmp file left)', async () => {
    await store.mutate((records) => {
      records['a'] = { id: 'a', name: 'A' };
    });
    const files = await fs.readdir(tmpDir);
    expect(files).toContain('test.json');
    expect(files.some((f) => f.endsWith('.tmp'))).toBe(false);
  });
});
