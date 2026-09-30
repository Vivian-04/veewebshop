"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="cart-link">
      Cart{count > 0 && <span className="badge">{count}</span>}
    </Link>
  );
}
