# ShopWithVee

A Nigerian online shop built with Next.js (App Router): naira pricing, Lagos Island/Mainland delivery, email + password and Google sign-in, a Postgres database (Supabase **or** Neon), and Mailgun order-confirmation emails.

## Features

- 15 Nigerian-made products in naira (₦), with category filters
- Cart (kept in the browser's localStorage)
- Checkout (requires an account): choose **Lagos Island** or **Lagos Mainland** for a flat delivery fee, enter phone and address; the order is saved in one transaction, with stock locked and prices and fees re-read on the server
- Sign up / sign in with email and password (scrypt-hashed), plus Google once configured
- Profile page: your details, saved delivery address and zone (used to pre-fill checkout), and order history
- Order confirmation email via Mailgun
- Payment on delivery
- **Admin area** at `/admin` (only for emails listed in `ADMIN_EMAILS`): all orders with status filters, order details with customer phone/WhatsApp/address, status buttons (New → Confirmed → Out for delivery → Delivered, or Cancelled, which returns items to stock), and price/stock editing. Admins are emailed about every new order.
- Confirmation and new-order emails are sent after checkout responds, so email never slows down or breaks an order
- Sign-in protection: 5 failed passwords per email (or 20 per network) locks sign-in for 15 minutes; at most 5 sign-ups per network per hour
- Privacy policy (`/privacy`) and terms & returns (`/terms`). Fill in the contact placeholders in `lib/site.ts` and review the wording before launch.

Delivery fees are set in [`lib/shipping.ts`](lib/shipping.ts) (Mainland ₦3,000, Island ₦5,000). Money is stored in kobo (₦1 = 100 kobo).

## Quick local test (no accounts needed)

Runs everything on your machine: an embedded Postgres (PGlite) and email previews saved to `.emails/`.

1. Create `.env.local` with:
   ```
   DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/postgres"
   AUTH_SECRET="<output of: npx auth secret>"
   ```
2. In one terminal: `npm run db:local` (creates tables and the products; data is kept in `.pglite/`, delete that folder to reset)
3. In another: `npm run dev`, then open http://localhost:3000 and create an account.

Google sign-in appears automatically once `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are set, and real emails go out once the Mailgun variables are set.

## Setup

```bash
npm install
cp .env.example .env.local
```

Then fill in `.env.local`:

### 1. Database: Supabase or Neon

Pick one; the code works with any Postgres URL.

- **Neon (this project's setup)**: install the CLI (`npm i -g neon`), `neon login`, then `neon link --project-id <project-id> --branch production -y`. This writes a git-ignored `.neon` file and pulls `DATABASE_URL` (pooled) into `.env.local`. `neon.ts` declares the project's Neon services (a private `uploads` bucket); apply it with `neon deploy`.
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
auth.ts                  Auth.js config: email/password + Google
app/(auth)/              Sign-in and sign-up pages and actions
app/profile/             Profile page, details form, order history
app/checkout/            Checkout form and placeOrder action (transaction + email)
lib/shipping.ts          Island/Mainland delivery fees, phone validation
lib/password.ts          scrypt password hashing
lib/db.ts                Postgres client + row types
lib/mailgun.ts           Mailgun REST client + confirmation email template
db/schema.sql, seed.sql  Tables and products
```

## Notes

- Payment is collected on delivery; no payment processor is wired in yet. Paystack or Flutterwave would plug into `placeOrder`.
- To manage products, edit the `products` table in the Supabase/Neon dashboard (prices are in kobo).
- `db/schema.sql` creates tables only if they don't exist. If you created the tables with an earlier version of this project, drop them first (or start a fresh database).
