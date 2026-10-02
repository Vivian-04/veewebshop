import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { Alert, Button, Field } from "@/components/ui";
import { useAuth } from "@/context/auth";
import { colors } from "@/lib/theme";

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      // Return to wherever sign-in was opened from (or the Account tab if opened directly).
      if (router.canGoBack()) router.back();
      else router.replace("/account");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text }}>Welcome back</Text>
        <Text style={{ color: colors.muted }}>Use the same email and password as on the website.</Text>
        {error && <Alert message={error} />}
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" onSubmitEditing={submit} />
        <Button title="Sign in" onPress={submit} loading={loading} />
        <Button title="New here? Create an account" variant="secondary" onPress={() => router.replace("/signup")} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
