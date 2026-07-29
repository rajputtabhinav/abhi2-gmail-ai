import fs from "fs/promises";
import path from "path";
import { getDb, closeDb } from "../config/db";
import { logger } from "../utils/logger";

async function ensureMigrationTable() {
  await getDb().query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function main() {
  await ensureMigrationTable();
  const migrationsDir = path.resolve(__dirname, "../../migrations");
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const exists = await getDb().query("SELECT 1 FROM schema_migrations WHERE filename = $1", [file]);
    if (exists.rowCount) continue;

    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await getDb().query("BEGIN");
    try {
      await getDb().query(sql);
      await getDb().query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
      await getDb().query("COMMIT");
      logger.info("Applied migration", { file });
    } catch (error) {
      await getDb().query("ROLLBACK");
      throw error;
    }
  }
}

main()
  .catch((error) => {
    logger.error("Migration failed", { error });
    process.exitCode = 1;
  })
  .finally(() => closeDb());
