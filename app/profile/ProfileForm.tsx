"use client";

import { startTransition, useActionState } from "react";
import { SHIPPING_ZONES, type ShippingZone } from "@/lib/shipping";
import { updateProfile, type ProfileFormState } from "./actions";

type Props = { name: string; phone: string; address: string; zone: ShippingZone | null };

export function ProfileForm({ name, phone, address, zone }: Props) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, {});

  // Submit manually rather than via `<form action>`, which resets the fields to their old values after saving.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <form onSubmit={onSubmit} className="fields">
      {state.error && <div className="alert error" role="alert">{state.error}</div>}
      {state.saved && <div className="alert success" role="status">Profile saved.</div>}
      <label>
        Full name
        <input name="name" defaultValue={name} required autoComplete="name" />
      </label>
      <label>
        Phone number
        <input name="phone" type="tel" defaultValue={phone} autoComplete="tel" placeholder="0803 123 4567" />
      </label>
      <label>
        Delivery address
        <textarea name="address" defaultValue={address} rows={3} autoComplete="street-address" placeholder="House number, street, area and a nearby landmark" />
      </label>
      <label>
        Delivery zone
        <select name="zone" defaultValue={zone ?? ""}>
          <option value="">Not set</option>
          {(Object.keys(SHIPPING_ZONES) as ShippingZone[]).map((key) => (
            <option key={key} value={key}>{SHIPPING_ZONES[key].label}</option>
          ))}
        </select>
      </label>
      <button className="btn primary" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
    </form>
  );
}
