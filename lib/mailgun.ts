import { mkdir, writeFile } from "node:fs/promises";
import { formatPrice } from "./format";
import type { Order, OrderItem } from "./db";
import { SHIPPING_ZONES } from "./shipping";

/** Sends via Mailgun. Returns false if the email was only previewed locally (Mailgun not configured in dev). */
async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAIL_FROM } = process.env;
  const base = process.env.MAILGUN_API_BASE ?? "https://api.mailgun.net";
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !MAIL_FROM) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Mailgun is not configured (MAILGUN_API_KEY, MAILGUN_DOMAIN, MAIL_FROM)");
    }
    const file = `.emails/${Date.now()}-${subject.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.html`;
    await mkdir(".emails", { recursive: true });
    await writeFile(file, `<!-- To: ${to} | Subject: ${subject} -->\n${html}`);
    console.log(`[mail] Mailgun not configured; email to ${to} saved to ${file}`);
    return false;
  }

  const res = await fetch(`${base}/v3/${MAILGUN_DOMAIN}/messages`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64") },
    body: new URLSearchParams({ from: MAIL_FROM, to, subject, html, text }),
  });
  if (!res.ok) throw new Error(`Mailgun error ${res.status}: ${await res.text()}`);
  return true;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

export async function sendOrderConfirmation(to: string, order: Order, items: OrderItem[]) {
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/orders/${order.id}`;
  const zone = SHIPPING_ZONES[order.shipping_zone].label;
  const cell = "padding:6px 0";
  const rows = items
    .map(
      (i) =>
        `<tr><td style="${cell}">${esc(i.product_name)} &times; ${i.quantity}</td>` +
        `<td style="${cell};text-align:right">${formatPrice(i.unit_kobo * i.quantity)}</td></tr>`,
    )
    .join("");

  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#222">
    <h1 style="font-size:20px;color:#0f6b3f">ShopWithVee</h1>
    <h2>Thanks for your order, ${esc(order.shipping_name)}!</h2>
    <p>Order <strong>#${order.id}</strong> has been received. We'll call you on ${esc(order.shipping_phone)} to arrange delivery.</p>
    <table style="width:100%;border-collapse:collapse">${rows}
      <tr><td style="padding-top:10px;border-top:1px solid #ddd">Subtotal</td>
      <td style="padding-top:10px;border-top:1px solid #ddd;text-align:right">${formatPrice(order.subtotal_kobo)}</td></tr>
      <tr><td style="${cell}">Delivery (${esc(zone)})</td><td style="${cell};text-align:right">${formatPrice(order.shipping_kobo)}</td></tr>
      <tr><td style="${cell}"><strong>Total</strong></td><td style="${cell};text-align:right"><strong>${formatPrice(order.total_kobo)}</strong></td></tr>
    </table>
    <p style="margin-top:20px">Delivering to:<br>${esc(order.shipping_address)}<br>${esc(zone)}</p>
    <p>Payment is collected on delivery.</p>
    <p><a href="${url}">View your order</a></p>
  </div>`;

  const text =
    `ShopWithVee: thanks for your order, ${order.shipping_name}!\n\nOrder #${order.id}\n` +
    items.map((i) => `- ${i.product_name} x ${i.quantity}: ${formatPrice(i.unit_kobo * i.quantity)}`).join("\n") +
    `\n\nSubtotal: ${formatPrice(order.subtotal_kobo)}\nDelivery (${zone}): ${formatPrice(order.shipping_kobo)}\nTotal: ${formatPrice(order.total_kobo)}` +
    `\n\nDelivering to: ${order.shipping_address}, ${zone}\nPayment is collected on delivery.\n\nView your order: ${url}`;

  return sendEmail(to, `ShopWithVee order #${order.id} confirmed`, html, text);
}

