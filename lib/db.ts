import { Pool } from "pg";
const globalDb = globalThis as unknown as { bmPool?: Pool };
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  return (globalDb.bmPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  }));
}
