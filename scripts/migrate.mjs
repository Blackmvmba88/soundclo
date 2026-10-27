import { readFile } from "node:fs/promises";
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL");
try {
  await pool.query(
    await readFile(
      new URL("../migrations/001_platform.sql", import.meta.url),
      "utf8",
    ),
  );
  console.log("Migration applied");
} finally {
  await pool.end();
}
