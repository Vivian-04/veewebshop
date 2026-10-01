import { AuthCard } from "../AuthCard";

export const metadata = { title: "Sign in · ShopWithVee" };

export default function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  return <AuthCard mode="signin" searchParams={searchParams} />;
}
