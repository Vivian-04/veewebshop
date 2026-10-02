import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { GoogleButton } from "@/components/GoogleButton";
import { Alert, Button, Field } from "@/components/ui";
import { useAuth } from "@/context/auth";
import { colors } from "@/lib/theme";

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await signUp(name, email, password);
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
        <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text }}>Create your account</Text>
        <Text style={{ color: colors.muted }}>Works on the website too.</Text>
        {error && <Alert message={error} />}
        <GoogleButton onError={setError} />
        <Field label="Name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
        <Field label="Password (at least 8 characters)" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" />
        <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry textContentType="newPassword" onSubmitEditing={submit} />
        <Button title="Create account" onPress={submit} loading={loading} />
        <Button title="Already have an account? Sign in" variant="secondary" onPress={() => router.replace("/signin")} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
