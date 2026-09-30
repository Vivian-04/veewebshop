import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CheckoutForm } from "./CheckoutForm";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/checkout");
  }

  return (
    <>
      <h1>Checkout</h1>
      <CheckoutForm defaultName={session.user.name ?? ""} email={session.user.email ?? ""} />
    </>
  );
}
