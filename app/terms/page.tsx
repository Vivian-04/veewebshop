import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";
import { SHIPPING_ZONES } from "@/lib/shipping";

export const metadata = { title: "Terms & returns · ShopWithVee" };

export default function TermsPage() {
  return (
    <article className="legal panel">
      <h1>Terms &amp; returns</h1>
      <p className="muted small">Last updated {SITE.lastUpdated}</p>

      <p>By placing an order with {SITE.name}, you agree to these terms.</p>

      <h2>Orders and prices</h2>
      <ul>
        <li>All prices are in Nigerian naira (₦) and include any applicable taxes.</li>
        <li>Placing an order is an offer to buy. We&apos;ll confirm it by phone or message before delivery. If an item becomes unavailable, we&apos;ll let you know and you won&apos;t be charged for it.</li>
        <li>We may correct obvious pricing mistakes before your order is confirmed.</li>
      </ul>

      <h2>Delivery</h2>
      <ul>
        <li>We currently deliver within Lagos only, for a flat fee: {SHIPPING_ZONES.mainland.label} {formatPrice(SHIPPING_ZONES.mainland.feeKobo)}, {SHIPPING_ZONES.island.label} {formatPrice(SHIPPING_ZONES.island.feeKobo)}.</li>
        <li>We&apos;ll call the phone number on your order to arrange a delivery time. Please make sure it&apos;s correct and that someone is available to receive the order.</li>
        <li>If we can&apos;t reach you after several attempts, we may cancel the order.</li>
      </ul>

      <h2>Payment</h2>
      <p>Payment is collected on delivery, by cash or bank transfer. Please check your items when they arrive.</p>

      <h2>Cancellations</h2>
      <p>
        You can cancel free of charge any time before your order is dispatched. Contact us at {SITE.contactEmail} or{" "}
        {SITE.contactPhone} with your order number.
      </p>

      <h2>Returns and refunds</h2>
      <ul>
        <li>If an item arrives damaged, faulty or isn&apos;t what you ordered, tell us within 48 hours of delivery and we&apos;ll replace it or refund you.</li>
        <li>For other returns, unused items in their original condition can be returned within 7 days of delivery. Return delivery is at your cost.</li>
        <li>For hygiene reasons, opened beauty products (shea butter, soap, oils) and food items can&apos;t be returned unless faulty.</li>
        <li>Refunds are paid by bank transfer within 7 working days of us receiving the returned item.</li>
      </ul>

      <h2>Your account</h2>
      <p>
        Keep your password private. You&apos;re responsible for orders placed from your account. Read how we handle your
        information in our <Link href="/privacy" className="text-link">privacy policy</Link>.
      </p>

      <h2>Contact</h2>
      <p>{SITE.name}: {SITE.contactEmail} · {SITE.contactPhone}</p>
    </article>
  );
}
