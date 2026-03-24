import { Pool } from "pg";

let _pool: Pool | null = null;

/**
 * Returns a singleton pg Pool configured from environment variables.
 *
 * Required env vars:
 *   PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
 */
export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      host: process.env.PGHOST ?? "localhost",
      port: Number(process.env.PGPORT ?? 5432),
      database: process.env.PGDATABASE ?? "uw_flow",
      user: process.env.PGUSER ?? "postgres",
      password: process.env.PGPASSWORD ?? "",
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    _pool.on("error", (err) => {
      console.error("[pg] Unexpected pool error:", err);
    });
  }
  return _pool;
}

/** Closes the pool — call during graceful shutdown. */
export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}
