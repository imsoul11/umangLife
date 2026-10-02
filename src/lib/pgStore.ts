import { neon } from "@neondatabase/serverless";
import type { Store } from "@/lib/db";

type SqlClient = (query: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

/** Postgres backend (Neon serverless HTTP driver) — used when DATABASE_URL is set. */
export class PgStore implements Store {
  private sql: SqlClient;
  private ready: Promise<void>;

  constructor(connectionString: string) {
    this.sql = neon(connectionString) as unknown as SqlClient;
    this.ready = this.sql(
      "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at BIGINT NOT NULL)",
    ).then(() => undefined);
  }

  private async ensure(): Promise<void> {
    await this.ready;
  }

  async get(key: string): Promise<string | null> {
    await this.ensure();
    const rows = (await this.sql("SELECT value FROM kv WHERE key = $1", [key])) as { value: string }[];
    return rows[0]?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.ensure();
    await this.sql(
      "INSERT INTO kv (key, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
      [key, value, Date.now()],
    );
  }

  async del(key: string): Promise<void> {
    await this.ensure();
    await this.sql("DELETE FROM kv WHERE key = $1", [key]);
  }

  async rekeyPrefix(fromPrefix: string, toPrefix: string): Promise<void> {
    await this.ensure();
    await this.sql(
      "UPDATE kv SET key = $2 || substr(key, length($1) + 1) WHERE key LIKE $1 || '%'",
      [fromPrefix, toPrefix],
    );
  }
}
