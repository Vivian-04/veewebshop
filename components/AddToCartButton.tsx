"use client";

import { useState } from "react";
import { useCart, type CartItem } from "./CartProvider";

export function AddToCartButton({ item, stock }: { item: Omit<CartItem, "quantity">; stock: number }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  if (stock <= 0) return <button className="btn" disabled>Sold out</button>;

  return (
    <button
      className="btn primary"
      onClick={() => {
        add(item);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
    >
      {added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
