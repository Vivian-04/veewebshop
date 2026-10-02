"use client";

import { startTransition, useActionState } from "react";
import { updateProduct, type AdminActionState } from "../actions";

export function ProductRow({ productId, priceNaira, stock }: { productId: number; priceNaira: number; stock: number }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(updateProduct.bind(null, productId), {});

  // Submit manually so React doesn't reset the inputs to their old values after saving.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <form onSubmit={onSubmit} className="admin-product-form">
      <label>
        <span className="muted small">Price (₦)</span>
        <input name="price" inputMode="decimal" defaultValue={priceNaira} required />
      </label>
      <label>
        <span className="muted small">In stock</span>
        <input name="stock" type="number" min={0} step={1} defaultValue={stock} required />
      </label>
      <button className="btn small" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
      {state.saved && !pending && <span className="saved-note">Saved ✓</span>}
      {state.error && <span className="error-note">{state.error}</span>}
    </form>
  );
}
