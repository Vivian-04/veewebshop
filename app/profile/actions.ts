"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/auth";
import { sql } from "@/lib/db";
import { isShippingZone, normalizeNigerianPhone } from "@/lib/shipping";

export type ProfileFormState = { error?: string; saved?: boolean };

export async function updateProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const user = await currentUser();
  if (!user) return { error: "Please sign in again." };

  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  const rawPhone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim().slice(0, 500);
  const zoneValue = formData.get("zone");

  if (!name) return { error: "Please enter your name." };
  const phone = rawPhone ? normalizeNigerianPhone(rawPhone) : null;
  if (rawPhone && !phone) return { error: "Please enter a valid Nigerian phone number, e.g. 0803 123 4567." };
  const zone = isShippingZone(zoneValue) ? zoneValue : null;

  await sql`
    UPDATE users SET name = ${name}, phone = ${phone}, address = ${address || null}, zone = ${zone}
    WHERE id = ${user.id}`;
  revalidatePath("/", "layout");
  return { saved: true };
}
