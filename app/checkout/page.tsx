import { redirect } from "next/navigation";
import { currentUser } from "@/auth";
import { CheckoutForm } from "./CheckoutForm";

export default async function CheckoutPage() {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=/checkout");

  return (
    <>
      <h1>Checkout</h1>
      <CheckoutForm
        profile={{
          name: user.name ?? "",
          email: user.email,
          image: user.image,
          phone: user.phone ?? "",
          address: user.address ?? "",
          zone: user.zone,
        }}
      />
    </>
  );
}
