import { AuthCard } from "../AuthCard";

export const metadata = { title: "Create account · ShopWithVee" };

export default function SignUpPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  return <AuthCard mode="signup" searchParams={searchParams} />;
}
