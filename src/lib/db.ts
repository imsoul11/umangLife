import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { PgStore } from "@/lib/pgStore";

/** Storage backend contract — SQLite locally, Postgres when DATABASE_URL is set. */
export interface Store {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
  /** Moves every `fromPrefix*` key to `toPrefix*`. */
  rekeyPrefix(fromPrefix: string, toPrefix: string): Promise<void>;
}

/** Minimal key-value store backed by SQLite (node:sqlite — no external deps). */
export class Kv implements Store {
  private db: DatabaseSync;

  constructor(dbPath: string) {
    this.db = new DatabaseSync(dbPath);
    this.db.exec("CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)");
  }

  async get(key: string): Promise<string | null> {
    const row = this.db.prepare("SELECT value FROM kv WHERE key = ?").get(key) as { value: string } | undefined;
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.db
      .prepare("INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
      .run(key, value, Date.now());
  }

  async del(key: string): Promise<void> {
    this.db.prepare("DELETE FROM kv WHERE key = ?").run(key);
  }

  /** Moves every `prefix:from:*` key to `prefix:to:*`. */
  async rekeyPrefix(fromPrefix: string, toPrefix: string): Promise<void> {
    const rows = this.db.prepare("SELECT key, value FROM kv WHERE key LIKE ?").all(`${fromPrefix}%`) as { key: string; value: string }[];
    for (const row of rows) {
      await this.del(row.key);
      await this.set(toPrefix + row.key.slice(fromPrefix.length), row.value);
    }
  }

  close(): void {
    this.db.close();
  }
}

let store: Store | null = null;

/**
 * Backend selection: Postgres (Neon) when DATABASE_URL/POSTGRES_URL is set,
 * otherwise a local SQLite file. Serverless-safe: the project directory is
 * read-only on Vercel, so fall back to /tmp when SQLite is used there.
 */
export function getStore(): Store {
  if (!store) {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    if (url) {
      store = new PgStore(url);
      return store;
    }
    let dir = process.env.UMANG_DATA_DIR ?? path.join(process.cwd(), ".data");
    try {
      mkdirSync(dir, { recursive: true });
    } catch {
      dir = path.join(tmpdir(), "umang-data");
      mkdirSync(dir, { recursive: true });
    }
    store = new Kv(path.join(dir, "umang.db"));
  }
  return store;
}

/** Which backend the singleton resolves to (for the health endpoint). */
export function storeKind(): "postgres" | "sqlite" {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  return url ? "postgres" : "sqlite";
}