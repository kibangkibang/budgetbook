import { promises as fs } from 'node:fs';
import path from 'node:path';
import lockfile from 'proper-lockfile';

export interface StoreFile<T> {
  version: number;
  records: Record<string, T>;
}

const STORE_VERSION = 1;

const inProcessQueues = new Map<string, Promise<unknown>>();

export function getDataDir(): string {
  return process.env.BUDGETBOOK_DATA_DIR ?? path.join(process.cwd(), 'data');
}

export class JsonStore<T extends { id: string }> {
  readonly filePath: string;

  constructor(filename: string, dataDir?: string) {
    const dir = dataDir ?? getDataDir();
    this.filePath = path.join(dir, filename);
  }

  async ensureFile(): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    try {
      await fs.access(this.filePath);
      return;
    } catch {
      // falls through to create
    }
    const initial: StoreFile<T> = { version: STORE_VERSION, records: {} };
    try {
      await fs.writeFile(this.filePath, JSON.stringify(initial, null, 2), {
        encoding: 'utf-8',
        flag: 'wx',
      });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
    }
  }

  async read(): Promise<StoreFile<T>> {
    await this.ensureFile();
    const raw = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(raw) as StoreFile<T>;
  }

  private async writeAtomic(data: StoreFile<T>): Promise<void> {
    const tmp = `${this.filePath}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tmp, this.filePath);
  }

  async mutate<R>(fn: (records: Record<string, T>) => Promise<R> | R): Promise<R> {
    await this.ensureFile();
    const prev = inProcessQueues.get(this.filePath) ?? Promise.resolve();
    const task = prev.then(() => this.mutateLocked(fn));
    inProcessQueues.set(
      this.filePath,
      task.catch(() => undefined),
    );
    return task;
  }

  private async mutateLocked<R>(
    fn: (records: Record<string, T>) => Promise<R> | R,
  ): Promise<R> {
    const release = await lockfile.lock(this.filePath, {
      retries: { retries: 10, factor: 1.5, minTimeout: 50, maxTimeout: 500 },
      stale: 5000,
    });
    try {
      const file = await this.read();
      const result = await fn(file.records);
      await this.writeAtomic(file);
      return result;
    } finally {
      await release();
    }
  }

  async list(): Promise<T[]> {
    const file = await this.read();
    return Object.values(file.records);
  }

  async get(id: string): Promise<T | null> {
    const file = await this.read();
    return file.records[id] ?? null;
  }
}
