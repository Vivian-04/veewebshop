"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/Avatar";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";
import { SHIPPING_ZONES, type ShippingZone } from "@/lib/shipping";
import { placeOrder } from "./actions";

type Profile = {
  name: string;
  email: string;
  image: string | null;
  phone: string;
  address: string;
  zone: ShippingZone | null;
};

export function CheckoutForm({ profile }: { profile: Profile }) {
  const { items, subtotalKobo, clear, ready } = useCart();
  const router = useRouter();
  const [zone, setZone] = useState<ShippingZone | null>(profile.zone);
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

  const shippingKobo = zone ? SHIPPING_ZONES[zone].feeKobo : 0;
  const totalKobo = subtotalKobo + shippingKobo;

  // A plain submit handler (not a form `action`) so React doesn't reset the form and wipe what was typed on error.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    if (!zone) {
      setError("Please choose Lagos Island or Mainland for delivery.");
      return;
    }
    startTransition(async () => {
      const result = await placeOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        zone,
        shipping: {
          name: String(formData.get("name") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          address: String(formData.get("address") ?? ""),
        },
        saveToProfile: formData.get("saveToProfile") === "on",
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
      <form onSubmit={onSubmit} className="fields">
        <Link href="/profile" className="panel profile-card">
          <Avatar name={profile.name} email={profile.email} image={profile.image} size={44} />
          <div>
            <strong>{profile.name || "Your profile"}</strong>
            <div className="muted small">{profile.email}</div>
          </div>
          <span className="muted small push-right">View profile →</span>
        </Link>

        <div className="panel fields">
          {error && <div className="alert error" role="alert">{error}</div>}

          <fieldset className="zones">
            <legend>Where should we deliver?</legend>
            {(Object.keys(SHIPPING_ZONES) as ShippingZone[]).map((key) => (
              <label key={key} className={`zone-option${zone === key ? " selected" : ""}`}>
                <input type="radio" name="zone" value={key} checked={zone === key} onChange={() => setZone(key)} />
                <span className="zone-text">
                  <strong>{SHIPPING_ZONES[key].label}</strong>
                  <span className="muted small">{SHIPPING_ZONES[key].examples}</span>
                </span>
                <span className="zone-fee">{formatPrice(SHIPPING_ZONES[key].feeKobo)}</span>
              </label>
            ))}
          </fieldset>

          <label>
            Full name
            <input name="name" defaultValue={profile.name} required autoComplete="name" />
          </label>
          <label>
            Phone number
            <input
              name="phone"
              type="tel"
              defaultValue={profile.phone}
              required
              autoComplete="tel"
              placeholder="0803 123 4567"
            />
          </label>
          <label>
            Delivery address
            <textarea
              name="address"
              defaultValue={profile.address}
              required
              rows={3}
              autoComplete="street-address"
              placeholder="House number, street, area and a nearby landmark"
            />
          </label>
          <label className="checkbox">
            <input type="checkbox" name="saveToProfile" defaultChecked />
            Save these details to my profile
          </label>
          <p className="muted small" style={{ margin: 0 }}>Payment is collected on delivery (cash or transfer).</p>
          <button className="btn primary block" disabled={pending}>
            {pending ? "Placing order…" : `Place order · ${formatPrice(totalKobo)}`}
          </button>
        </div>
      </form>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Order summary</h3>
        {items.map((i) => (
          <div key={i.productId} className="line compact">
            <Link href={`/products/${i.slug}`} className="line-img" aria-label={`View ${i.name}`}>
              {i.imageUrl && <Image src={i.imageUrl} alt={i.name} fill sizes="48px" />}
            </Link>
            <Link href={`/products/${i.slug}`} className="line-info">{i.name} × {i.quantity}</Link>
            <span>{formatPrice(i.priceKobo * i.quantity)}</span>
          </div>
        ))}
        <div className="summary-row" style={{ marginTop: 8 }}><span>Subtotal</span><span>{formatPrice(subtotalKobo)}</span></div>
        <div className="summary-row">
          <span>Delivery{zone ? ` (${SHIPPING_ZONES[zone].label})` : ""}</span>
          <span>{zone ? formatPrice(shippingKobo) : "Choose zone"}</span>
        </div>
        <div className="summary-row total"><span>Total</span><span>{formatPrice(totalKobo)}</span></div>
      </div>
    </div>
  );
}
