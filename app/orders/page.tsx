import { redirect } from "next/navigation";

// Order history now lives on the profile page.
export default function OrdersPage() {
  redirect("/profile#orders");
}
