import type postgres from "postgres";
import { sql } from "./db";

// The signed-in user's cart, stored in the database so the website and the app share it.
// Every change bumps users.cart_version, which clients poll to know when to refresh.

export const MAX_LINE_QUANTITY = 99;

export type CartLine = {
  productId: number;
  slug: string;
  name: string;
  priceKobo: number;
  imageUrl: string | null;
  stock: number;
  quantity: number;
};

export type Cart = { version: number; items: CartLine[]; count: number; subtotalKobo: number };

export class CartError extends Error {}

// Accepts the main client or a transaction from sql.begin().
type Tx = postgres.Sql | postgres.TransactionSql;

async function bumpVersion(tx: Tx, userId: number) {
  const [row] = await tx<{ cart_version: number }[]>`
    UPDATE users SET cart_version = cart_version + 1 WHERE id = ${userId} RETURNING cart_version`;
  return row.cart_version;
}

export async function getCartVersion(userId: number) {
  const [row] = await sql<{ cart_version: number }[]>`SELECT cart_version FROM users WHERE id = ${userId}`;
  return row?.cart_version ?? 0;
}

export async function getCart(userId: number, tx: Tx = sql): Promise<Cart> {
  const [[user], items] = await Promise.all([
    tx<{ cart_version: number }[]>`SELECT cart_version FROM users WHERE id = ${userId}`,
    tx<CartLine[]>`
      SELECT p.id AS "productId", p.slug, p.name, p.price_kobo AS "priceKobo", p.image_url AS "imageUrl",
             p.stock, c.quantity
      FROM cart_items c JOIN products p ON p.id = c.product_id
      WHERE c.user_id = ${userId}
      ORDER BY c.added_at, p.id`,
  ]);
  return {
    version: user?.cart_version ?? 0,
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    subtotalKobo: items.reduce((n, i) => n + i.quantity * i.priceKobo, 0),
  };
}

function validQuantity(n: unknown): n is number {
  return Number.isInteger(n) && (n as number) >= 0 && (n as number) <= MAX_LINE_QUANTITY;
}

/** Cap a quantity at what's in stock (and the per-line maximum). */
function capped(quantity: number, stock: number) {
  return Math.min(quantity, stock, MAX_LINE_QUANTITY);
}

async function productStock(tx: Tx, productId: number) {
  const [p] = await tx<{ stock: number; name: string }[]>`SELECT stock, name FROM products WHERE id = ${productId}`;
  if (!p) throw new CartError("That product no longer exists.");
  return p;
}

/** Add `quantity` of a product to the cart (on top of what's already there). */
export async function addToCart(userId: number, productId: number, quantity = 1) {
  if (!Number.isInteger(productId) || !validQuantity(quantity) || quantity < 1) throw new CartError("Invalid item.");
  return sql.begin(async (tx) => {
    const p = await productStock(tx, productId);
    if (p.stock <= 0) throw new CartError(`"${p.name}" is sold out.`);
    const [existing] = await tx<{ quantity: number }[]>`
      SELECT quantity FROM cart_items WHERE user_id = ${userId} AND product_id = ${productId} FOR UPDATE`;
    const next = capped((existing?.quantity ?? 0) + quantity, p.stock);
    await tx`
      INSERT INTO cart_items (user_id, product_id, quantity) VALUES (${userId}, ${productId}, ${next})
      ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`;
    await bumpVersion(tx, userId);
    return getCart(userId, tx);
  });
}

/** Set a product's quantity exactly; 0 removes it. */
export async function setCartQuantity(userId: number, productId: number, quantity: number) {
  if (!Number.isInteger(productId) || !validQuantity(quantity)) throw new CartError("Invalid item.");
  return sql.begin(async (tx) => {
    if (quantity === 0) {
      await tx`DELETE FROM cart_items WHERE user_id = ${userId} AND product_id = ${productId}`;
    } else {
      const p = await productStock(tx, productId);
      const next = capped(quantity, p.stock);
      if (next <= 0) {
        await tx`DELETE FROM cart_items WHERE user_id = ${userId} AND product_id = ${productId}`;
      } else {
        await tx`
          INSERT INTO cart_items (user_id, product_id, quantity) VALUES (${userId}, ${productId}, ${next})
          ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`;
      }
    }
    await bumpVersion(tx, userId);
    return getCart(userId, tx);
  });
}

/**
 * Merge a signed-out (browser) cart into the account's cart, e.g. right after signing in.
 * Quantities add up; unknown or sold-out products are skipped.
 */
export async function mergeIntoCart(userId: number, lines: { productId: unknown; quantity: unknown }[]) {
  const wanted = new Map<number, number>();
  for (const l of lines.slice(0, 100)) {
    const productId = Number(l.productId);
    const quantity = Number(l.quantity);
    if (Number.isInteger(productId) && Number.isInteger(quantity) && quantity > 0) {
      wanted.set(productId, Math.min((wanted.get(productId) ?? 0) + quantity, MAX_LINE_QUANTITY));
    }
  }
  return sql.begin(async (tx) => {
    if (wanted.size > 0) {
      const products = await tx<{ id: number; stock: number }[]>`
        SELECT id, stock FROM products WHERE id IN ${tx([...wanted.keys()])}`;
      for (const p of products) {
        if (p.stock <= 0) continue;
        await tx`
          INSERT INTO cart_items (user_id, product_id, quantity)
          VALUES (${userId}, ${p.id}, ${capped(wanted.get(p.id)!, p.stock)})
          ON CONFLICT (user_id, product_id) DO UPDATE
            SET quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, ${p.stock}, ${MAX_LINE_QUANTITY})`;
      }
      await bumpVersion(tx, userId);
    }
    return getCart(userId, tx);
  });
}

export async function clearCart(userId: number, tx: Tx = sql) {
  await tx`DELETE FROM cart_items WHERE user_id = ${userId}`;
  await bumpVersion(tx, userId);
}
