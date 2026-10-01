// Local development database: an embedded Postgres (PGlite) exposed over TCP,
// so the app talks to it exactly like it would to Supabase or Neon.
// Data is kept in ./.pglite between runs. Delete that folder to reset.
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const port = Number(process.env.LOCAL_DB_PORT ?? 5433);
const db = await PGlite.create("./.pglite");

await db.exec(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
await db.exec(readFileSync(new URL("../db/seed.sql", import.meta.url), "utf8"));

const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 10 });
await server.start();
console.log(`Local Postgres ready: postgresql://postgres:postgres@127.0.0.1:${port}/postgres`);

async function shutdown() {
  await server.stop();
  await db.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
