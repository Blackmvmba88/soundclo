import { Pool } from "pg";
import { getConnectionString } from "@netlify/database";
const globalDb = globalThis as unknown as { bmPool?: Pool };
export function hasDatabase() {
  try {
    return Boolean(process.env.DATABASE_URL || process.env.NETLIFY_DB_URL || getConnectionString());
  } catch { return false; }
}
export function db() {
  const connectionString = process.env.DATABASE_URL || process.env.NETLIFY_DB_URL || getConnectionString();
  if (!connectionString) throw new Error("PostgreSQL is not configured");
  return (globalDb.bmPool ??= new Pool({ connectionString, max: 5 }));
}
