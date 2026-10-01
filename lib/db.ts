import postgres from "postgres";

const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

// Hosted databases (Supabase, Neon) need TLS; the local dev database doesn't speak it.
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "");

// `prepare: false` keeps this compatible with Supabase's transaction pooler and Neon's pgbouncer.
export const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL!, {
    ssl: isLocal ? false : "require",
    prepare: false,
    // The local PGlite server is single-threaded and mixes up interleaved queries from parallel connections.
    max: isLocal ? 1 : 5,
    // BIGSERIAL ids (int8) come back as strings by default; they fit comfortably in a JS number.
    types: {
      bigint: { to: 20, from: [20], serialize: (n: number) => String(n), parse: (s: string) => Number(s) },
    },
  });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export type User = {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
  phone: string | null;
  address: string | null;
  zone: "island" | "mainland" | null;
  created_at: Date;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_kobo: number;
  image_url: string | null;
  stock: number;
};

export type Order = {
  id: number;
  user_id: number;
  status: string;
  subtotal_kobo: number;
  shipping_kobo: number;
  total_kobo: number;
  shipping_zone: "island" | "mainland";
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  email_sent_at: Date | null;
  created_at: Date;
};

export type OrderItem = {
  product_id: number;
  product_name: string;
  unit_kobo: number;
  quantity: number;
};
