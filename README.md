# Hearth & Co. — shop

Next.js (App Router) storefront with Google sign-in, a Postgres database (Supabase **or** Neon), and Mailgun order-confirmation emails.

## Features

- Product catalogue and product pages (read from Postgres)
- Cart (kept in the browser's localStorage)
- Checkout page (requires Google sign-in): shipping details → order saved in one transaction, with stock locked and decremented and prices re-read from the DB
- Order confirmation email via Mailgun
- Order history and order detail pages, scoped to the signed-in user

## Quick local test (no accounts needed)

Runs everything on your machine: an embedded Postgres (PGlite), a dev-only email login, and email previews saved to `.emails/`.

1. Create `.env.local` with:
   ```
   DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/postgres"
   AUTH_SECRET="<output of: npx auth secret>"
   AUTH_DEV_LOGIN=true
   ```
2. In one terminal: `npm run db:local` (creates tables and sample products; data is kept in `.pglite/`, delete that folder to reset)
3. In another: `npm run dev`, then open http://localhost:3000 and sign in with any email.

The dev login only works when `AUTH_DEV_LOGIN=true` **and** the app is not a production build. Google sign-in appears automatically once `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are set, and real emails go out once the Mailgun variables are set.

## Setup

```bash
npm install
cp .env.example .env.local
```

Then fill in `.env.local`:

### 1. Database: Supabase or Neon

Pick one; the code works with any Postgres URL.

- **Supabase**: create a project → **Project Settings → Database → Connection string** → copy the **Transaction pooler** URI.
- **Neon**: create a project → **Connection Details** → copy the **pooled** connection string.

Put it in `DATABASE_URL`, then create the tables and seed the sample products:

```bash
npm run db:setup
```

### 2. Google auth (Google Cloud Console)

1. Go to https://console.cloud.google.com/ → create or select a project.
2. **APIs & Services → OAuth consent screen**: configure it (External, app name, support email). Add yourself as a test user while in testing mode.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** → *Web application*.
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - In production, add your real domain for both.
4. Copy the Client ID/Secret into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.
5. Generate `AUTH_SECRET` with `npx auth secret` (or `openssl rand -base64 32`).

### 3. Mailgun

1. In Mailgun, add and verify a sending domain (or use the sandbox domain; it can only send to authorized recipients).
2. **API Keys** → create a key and put it in `MAILGUN_API_KEY`.
3. Set `MAILGUN_DOMAIN` (e.g. `mg.yourdomain.com`) and `MAIL_FROM`.
4. If your Mailgun account is in the EU region, set `MAILGUN_API_BASE=https://api.eu.mailgun.net`.

If an email fails to send, the order is still saved. The failure is logged and `orders.email_sent_at` stays `NULL`.

## Run

```bash
npm run dev
```

Open http://localhost:3000.

## Deploying (e.g. Vercel)

Set the same environment variables in your host, set `APP_URL` to your public URL, and add the production redirect URI (`https://yourdomain.com/api/auth/callback/google`) in Google Cloud Console.

## Project layout

```
auth.ts                  Auth.js config (Google), upserts users into the DB
lib/db.ts                Postgres client + row types
lib/mailgun.ts           Mailgun REST client + confirmation email template
db/schema.sql, seed.sql  Tables and sample products
app/checkout/actions.ts  placeOrder server action (transaction + email)
app/                     Pages: /, /products/[slug], /cart, /checkout, /orders, /orders/[id]
components/              Cart context and client components
```

## Notes

- Payment is "collect on delivery"; no payment processor is wired in. Stripe Checkout would plug into `placeOrder`.
- To manage products, edit the `products` table in the Supabase/Neon dashboard.
