-- Money is stored in kobo (1 naira = 100 kobo) as integers to avoid rounding errors.

CREATE TABLE IF NOT EXISTS users (
  id             BIGSERIAL PRIMARY KEY,
  email          TEXT UNIQUE NOT NULL,
  name           TEXT,
  image          TEXT,
  password_hash  TEXT,                -- NULL for Google-only accounts
  phone          TEXT,
  address        TEXT,
  zone           TEXT CHECK (zone IN ('island', 'mainland')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id           BIGSERIAL PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT 'Other',
  price_kobo   INTEGER NOT NULL CHECK (price_kobo >= 0),
  image_url    TEXT,
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id                BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(id),
  status            TEXT NOT NULL DEFAULT 'pending',
  subtotal_kobo     INTEGER NOT NULL,
  shipping_kobo     INTEGER NOT NULL,
  total_kobo        INTEGER NOT NULL,
  shipping_zone     TEXT NOT NULL CHECK (shipping_zone IN ('island', 'mainland')),
  shipping_name     TEXT NOT NULL,
  shipping_phone    TEXT NOT NULL,
  shipping_address  TEXT NOT NULL,
  email_sent_at     TIMESTAMPTZ,        -- when Mailgun accepted the confirmation (not proof of delivery)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id           BIGSERIAL PRIMARY KEY,
  order_id     BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   BIGINT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  unit_kobo    INTEGER NOT NULL,
  quantity     INTEGER NOT NULL CHECK (quantity > 0)
);

-- Failed sign-ins and sign-ups, used to slow down password guessing and spam accounts.
CREATE TABLE IF NOT EXISTS auth_events (
  id          BIGSERIAL PRIMARY KEY,
  kind        TEXT NOT NULL CHECK (kind IN ('signin_failed', 'signup')),
  email       TEXT,
  ip          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Each signed-in user's cart, shared by the website and the mobile app.
CREATE TABLE IF NOT EXISTS cart_items (
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

-- Bumped on every cart change, so clients can cheaply check whether their copy is stale.
ALTER TABLE users ADD COLUMN IF NOT EXISTS cart_version BIGINT NOT NULL DEFAULT 0;

-- Sign-in tokens for the mobile app (the website uses Auth.js cookies). Only a SHA-256 hash is stored.
CREATE TABLE IF NOT EXISTS api_tokens (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS api_tokens_user_id_idx ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS auth_events_email_idx ON auth_events(kind, email, created_at);
CREATE INDEX IF NOT EXISTS auth_events_ip_idx ON auth_events(kind, ip, created_at);
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
