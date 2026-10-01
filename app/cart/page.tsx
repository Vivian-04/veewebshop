"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, subtotalCents, setQuantity, remove, ready } = useCart();

  if (!ready) return null;

  if (items.length === 0) {
    return (
      <div className="empty">
        <h1>Your cart is empty</h1>
        <Link href="/" className="btn primary">Continue shopping</Link>
      </div>
    );
  }

  return (
    <>
      <h1>Cart</h1>
      <div className="two-col">
        <div className="panel">
          {items.map((i) => (
            <div key={i.productId} className="line">
              <Link href={`/products/${i.slug}`} className="line-img" aria-label={`View ${i.name}`}>
                {i.imageUrl && <Image src={i.imageUrl} alt={i.name} fill sizes="64px" />}
              </Link>
              <div className="line-info">
                <Link href={`/products/${i.slug}`}><strong>{i.name}</strong></Link>
                <div className="muted">{formatPrice(i.priceCents)}</div>
              </div>
              <div className="qty">
                <button aria-label="Decrease" onClick={() => setQuantity(i.productId, i.quantity - 1)}>−</button>
                <span>{i.quantity}</span>
                <button aria-label="Increase" onClick={() => setQuantity(i.productId, i.quantity + 1)}>+</button>
              </div>
              <button className="link-btn" onClick={() => remove(i.productId)}>Remove</button>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotalCents)}</span></div>
          <div className="summary-row muted"><span>Shipping</span><span>Free</span></div>
          <div className="summary-row total"><span>Total</span><span>{formatPrice(subtotalCents)}</span></div>
          <Link href="/checkout" className="btn primary block" style={{ marginTop: 16 }}>Checkout</Link>
        </div>
      </div>
    </>
  );
}
