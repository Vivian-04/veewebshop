"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";
import { placeOrder } from "./actions";

export function CheckoutForm({ defaultName, email }: { defaultName: string; email: string }) {
  const { items, subtotalCents, clear, ready } = useCart();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);

  if (!ready) return null;

  // The cart is cleared once the order is placed; don't flash the empty-cart state while redirecting.
  if (placedOrderId) {
    return <div className="empty"><p>Order #{placedOrderId} placed. Taking you to your confirmation…</p></div>;
  }

  if (items.length === 0) {
    return (
      <div className="empty">
        <p>Your cart is empty.</p>
        <Link href="/" className="btn primary">Browse products</Link>
      </div>
    );
  }

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await placeOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shipping: {
          name: String(formData.get("name") ?? ""),
          address: String(formData.get("address") ?? ""),
          city: String(formData.get("city") ?? ""),
          postal: String(formData.get("postal") ?? ""),
          country: String(formData.get("country") ?? ""),
        },
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setPlacedOrderId(result.orderId);
      clear();
      router.push(`/orders/${result.orderId}?placed=1`);
    });
  }

  return (
    <div className="two-col">
      <form action={onSubmit} className="panel fields">
        {error && <div className="alert error">{error}</div>}
        <label>
          Email
          <input value={email} disabled />
        </label>
        <label>
          Full name
          <input name="name" defaultValue={defaultName} required autoComplete="name" />
        </label>
        <label>
          Address
          <input name="address" required autoComplete="street-address" />
        </label>
        <div className="field-row">
          <label>
            City
            <input name="city" required autoComplete="address-level2" />
          </label>
          <label>
            Postal code
            <input name="postal" required autoComplete="postal-code" />
          </label>
        </div>
        <label>
          Country
          <input name="country" required autoComplete="country-name" />
        </label>
        <p className="muted" style={{ margin: 0 }}>Payment is collected on delivery.</p>
        <button className="btn primary block" disabled={pending}>
          {pending ? "Placing order…" : `Place order · ${formatPrice(subtotalCents)}`}
        </button>
      </form>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Order summary</h3>
        {items.map((i) => (
          <div key={i.productId} className="line compact">
            <Link href={`/products/${i.slug}`} className="line-img" aria-label={`View ${i.name}`}>
              {i.imageUrl && <Image src={i.imageUrl} alt={i.name} fill sizes="48px" />}
            </Link>
            <Link href={`/products/${i.slug}`} className="line-info">{i.name} × {i.quantity}</Link>
            <span>{formatPrice(i.priceCents * i.quantity)}</span>
          </div>
        ))}
        <div className="summary-row total"><span>Total</span><span>{formatPrice(subtotalCents)}</span></div>
      </div>
    </div>
  );
}
