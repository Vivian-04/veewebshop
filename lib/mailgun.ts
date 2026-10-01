import { mkdir, writeFile } from "node:fs/promises";
import { formatPrice } from "./format";
import type { Order, OrderItem } from "./db";

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
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${esc(i.product_name)} &times; ${i.quantity}</td>` +
        `<td style="padding:6px 0;text-align:right">${formatPrice(i.unit_cents * i.quantity)}</td></tr>`,
    )
    .join("");

  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#222">
    <h2>Thanks for your order, ${esc(order.shipping_name)}!</h2>
    <p>Order <strong>#${order.id}</strong> has been received.</p>
    <table style="width:100%;border-collapse:collapse">${rows}
      <tr><td style="padding-top:10px;border-top:1px solid #ddd"><strong>Total</strong></td>
      <td style="padding-top:10px;border-top:1px solid #ddd;text-align:right"><strong>${formatPrice(order.total_cents)}</strong></td></tr>
    </table>
    <p style="margin-top:20px">Shipping to:<br>${esc(order.shipping_address)}<br>
      ${esc(order.shipping_city)} ${esc(order.shipping_postal)}<br>${esc(order.shipping_country)}</p>
    <p><a href="${url}">View your order</a></p>
  </div>`;

  const text =
    `Thanks for your order, ${order.shipping_name}!\n\nOrder #${order.id}\n` +
    items.map((i) => `- ${i.product_name} x ${i.quantity}: ${formatPrice(i.unit_cents * i.quantity)}`).join("\n") +
    `\n\nTotal: ${formatPrice(order.total_cents)}\n\nView your order: ${url}`;

  return sendEmail(to, `Order #${order.id} confirmed`, html, text);
}
