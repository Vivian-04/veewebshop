import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { currentUser } from "@/auth";
import { sql, type User } from "./db";

// Helpers for the JSON API in app/api, used by both the website and the mobile app.
// The website authenticates with its Auth.js session cookie; the app sends `Authorization: Bearer <token>`.

const TOKEN_TTL_DAYS = 90;
const USER_COLUMNS = sql`u.id, u.email, u.name, u.image, u.phone, u.address, u.zone, u.created_at`;

// The app authenticates with a header token, never cookies, so allowing any origin is safe.
// (Native apps don't need CORS at all; this lets the app also run in a browser for development.)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { ...CORS_HEADERS, "Cache-Control": "no-store" } });
}

export function apiError(message: string, status: number) {
  return json({ error: message }, status);
}

/** Answer CORS preflight requests. Export as `OPTIONS` from each route. */
export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function bearerToken(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

/** Issues a new app sign-in token. Only its hash is stored, so a database leak doesn't expose usable tokens. */
export async function createApiToken(userId: number) {
  const token = randomBytes(32).toString("base64url");
  await sql`
    INSERT INTO api_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${hashToken(token)}, now() + ${`${TOKEN_TTL_DAYS} days`}::interval)`;
  // Opportunistic cleanup of expired tokens.
  await sql`DELETE FROM api_tokens WHERE expires_at < now()`;
  return token;
}

export async function revokeApiToken(req: Request) {
  const token = bearerToken(req);
  if (token) await sql`DELETE FROM api_tokens WHERE token_hash = ${hashToken(token)}`;
}

/** The signed-in user for an API request (app token first, then website session), or null. */
export async function apiUser(req: Request): Promise<User | null> {
  const token = bearerToken(req);
  if (token) {
    const [user] = await sql<User[]>`
      UPDATE api_tokens t SET last_used_at = now()
      FROM users u
      WHERE t.token_hash = ${hashToken(token)} AND t.expires_at > now() AND u.id = t.user_id
      RETURNING ${USER_COLUMNS}`;
    return user ?? null;
  }
  return currentUser();
}

/** Runs `handler` for a signed-in user, answering 401 otherwise and 500 on unexpected errors. */
export async function withUser(req: Request, handler: (user: User) => Promise<Response>) {
  try {
    const user = await apiUser(req);
    if (!user) return apiError("Please sign in.", 401);
    return await handler(user);
  } catch (err) {
    console.error(`API ${req.method} ${new URL(req.url).pathname} failed`, err);
    return apiError("Something went wrong. Please try again.", 500);
  }
}

/** Parses a JSON body, returning null if it's missing or malformed. */
export async function readJson<T = Record<string, unknown>>(req: Request): Promise<Partial<T> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Partial<T>) : null;
  } catch {
    return null;
  }
}

/** The public shape of a user returned by the API. */
export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    phone: user.phone,
    address: user.address,
    zone: user.zone,
  };
}
