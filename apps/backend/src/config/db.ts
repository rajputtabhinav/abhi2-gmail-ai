import pg from "pg";
import { env } from "./env";

let pool: pg.Pool | null = null;

export function getDb() {
  if (!pool) {
    pool = new pg.Pool({ connectionString: env.DATABASE_URL });
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params: unknown[] = []) {
  return getDb().query<T>(text, params);
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
