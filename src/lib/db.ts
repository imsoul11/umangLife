import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Minimal key-value store backed by SQLite (node:sqlite — no external deps).
 * Swap this file for Postgres/Prisma later; repository.ts is the only caller.
 */
export class Kv {
  private db: DatabaseSync;

  constructor(dbPath: string) {
    this.db = new DatabaseSync(dbPath);
    this.db.exec("CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)");
  }

  get(key: string): string | null {
    const row = this.db.prepare("SELECT value FROM kv WHERE key = ?").get(key) as { value: string } | undefined;
    return row?.value ?? null;
  }

  set(key: string, value: string): void {
    this.db
      .prepare("INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
      .run(key, value, Date.now());
  }

  del(key: string): void {
    this.db.prepare("DELETE FROM kv WHERE key = ?").run(key);
  }

  /** Moves every `prefix:from:*` key to `prefix:to:*` (used for data migration on login). */
  rekeyPrefix(fromPrefix: string, toPrefix: string): void {
    const rows = this.db.prepare("SELECT key, value FROM kv WHERE key LIKE ?").all(`${fromPrefix}%`) as { key: string; value: string }[];
    for (const row of rows) {
      this.del(row.key);
      this.set(toPrefix + row.key.slice(fromPrefix.length), row.value);
    }
  }

  close(): void {
    this.db.close();
  }
}

let kv: Kv | null = null;

export function getKv(): Kv {
  if (!kv) {
    const dir = process.env.UMANG_DATA_DIR ?? path.join(process.cwd(), ".data");
    mkdirSync(dir, { recursive: true });
    kv = new Kv(path.join(dir, "umang.db"));
  }
  return kv;
}
