"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";
import { SHIPPING_ZONES } from "@/lib/shipping";

export default function CartPage() {
  const { items, subtotalKobo, setQuantity, remove, ready } = useCart();

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
                <div className="muted">{formatPrice(i.priceKobo)}</div>
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
          <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotalKobo)}</span></div>
          <div className="summary-row muted">
            <span>Delivery</span>
            <span>{formatPrice(SHIPPING_ZONES.mainland.feeKobo)} – {formatPrice(SHIPPING_ZONES.island.feeKobo)}</span>
          </div>
          <p className="muted small" style={{ margin: "4px 0 0" }}>
            Mainland {formatPrice(SHIPPING_ZONES.mainland.feeKobo)} · Island {formatPrice(SHIPPING_ZONES.island.feeKobo)}. Choose at checkout.
          </p>
          <Link href="/checkout" className="btn primary block" style={{ marginTop: 16 }}>Checkout</Link>
        </div>
      </div>
    </>
  );
}
