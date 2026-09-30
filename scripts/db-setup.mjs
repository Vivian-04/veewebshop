import { readFileSync } from "node:fs";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (expected in .env.local)");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", prepare: false });

try {
  await sql.unsafe(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
  console.log("Schema applied");
  await sql.unsafe(readFileSync(new URL("../db/seed.sql", import.meta.url), "utf8"));
  console.log("Seed data inserted");
} finally {
  await sql.end();
}
