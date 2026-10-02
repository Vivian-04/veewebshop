import Link from "next/link";
import { SITE } from "@/lib/site";
import { SHIPPING_ZONES } from "@/lib/shipping";

export const metadata = { title: "Privacy policy · ShopWithVee" };

export default function PrivacyPage() {
  return (
    <article className="legal panel">
      <h1>Privacy policy</h1>
      <p className="muted small">Last updated {SITE.lastUpdated}</p>

      <p>
        This policy explains what personal information {SITE.name} collects when you shop with us, why we collect it,
        and the choices you have. We follow the Nigeria Data Protection Act 2023.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email address and, if you sign up with a password, a securely scrambled (hashed) version of it. We never store or see your actual password.</li>
        <li><strong>If you sign in with Google:</strong> your name, email address and profile photo from your Google account. We don&apos;t get your Google password.</li>
        <li><strong>Delivery details:</strong> your phone number, delivery address and whether you&apos;re on Lagos Island or the Mainland.</li>
        <li><strong>Orders:</strong> what you bought, prices, delivery fee and order status.</li>
        <li><strong>Security information:</strong> the network (IP) address of failed sign-in attempts, kept for up to one day to protect accounts from password guessing.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To process and deliver your orders, and to call or message you about delivery.</li>
        <li>To send order confirmation emails.</li>
        <li>To run your account, so you can see your order history and check out faster.</li>
        <li>To keep the shop secure and prevent fraud.</li>
      </ul>
      <p>We don&apos;t sell your information, and we don&apos;t send marketing emails unless you ask us to.</p>

      <h2>Who we share it with</h2>
      <p>We use trusted service providers to run the shop. They only process your information on our behalf:</p>
      <ul>
        <li><strong>Neon</strong> stores our database (servers in the United States).</li>
        <li><strong>Mailgun</strong> sends our emails.</li>
        <li><strong>Google</strong>, only if you choose &quot;Continue with Google&quot;.</li>
        <li><strong>Our delivery riders</strong> receive your name, phone number and address to deliver your order.</li>
        <li><strong>Our website host</strong>, which runs the site.</li>
      </ul>
      <p>Some of these providers store data outside Nigeria. We only use providers that protect personal data to a recognised standard.</p>

      <h2>Cookies and storage</h2>
      <p>
        We use one essential cookie to keep you signed in. Your shopping cart is saved in your own browser (local
        storage) and isn&apos;t sent to us until you check out. We don&apos;t use advertising or tracking cookies.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your account and order history while your account is open, and order records for as long as needed for
        tax and accounting purposes. Security logs of failed sign-ins are deleted after one day.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see the information we hold about you, correct it, or delete your account. You can update your
        name, phone and address yourself on your <Link href="/profile" className="text-link">profile</Link>. For anything else,
        contact us at {SITE.contactEmail}. If you&apos;re unhappy with how we handle your data, you can complain to the
        Nigeria Data Protection Commission.
      </p>

      <h2>Contact</h2>
      <p>{SITE.name}: {SITE.contactEmail} · {SITE.contactPhone}</p>
      <p className="muted small">
        We deliver to {SHIPPING_ZONES.mainland.label} and {SHIPPING_ZONES.island.label}. See also our{" "}
        <Link href="/terms" className="text-link">terms &amp; returns</Link>.
      </p>
    </article>
  );
}
