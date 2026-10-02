import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/context/auth";
import { colors, radius } from "@/lib/theme";

/** "Continue with Google", then an "or" divider. Reports errors through `onError`. */
export function GoogleButton({ onError }: { onError: (message: string | null) => void }) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  async function press() {
    onError(null);
    setLoading(true);
    try {
      if (await signInWithGoogle()) {
        if (router.canGoBack()) router.back();
        else router.replace("/account");
      }
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={press}
        disabled={loading}
        style={({ pressed }) => [s.button, (pressed || loading) && { opacity: 0.7 }]}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <Ionicons name="logo-google" size={18} color={colors.text} />
            <Text style={s.text}>Continue with Google</Text>
          </>
        )}
      </Pressable>
      <View style={s.divider}>
        <View style={s.line} />
        <Text style={{ color: colors.muted }}>or</Text>
        <View style={s.line} />
      </View>
    </>
  );
}

const s = StyleSheet.create({
  button: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  text: { fontSize: 16, fontWeight: "600", color: colors.text },
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
});
