import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { colors, radius } from "@/lib/theme";

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const primary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primary : styles.secondary,
        variant === "danger" && { borderColor: colors.danger },
        (disabled || loading) && { opacity: 0.55 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? "#fff" : colors.accent} />
      ) : (
        <Text style={[styles.buttonText, { color: primary ? "#fff" : variant === "danger" ? colors.danger : colors.text }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.multiline && { minHeight: 80, textAlignVertical: "top" }]} />
    </View>
  );
}

export function Alert({ message, tone = "error" }: { message: string; tone?: "error" | "info" | "success" }) {
  const bg = tone === "error" ? colors.dangerSoft : tone === "success" ? colors.accentSoft : colors.warningSoft;
  const fg = tone === "error" ? colors.danger : tone === "success" ? colors.accent : colors.text;
  return (
    <View accessibilityRole="alert" style={[styles.alert, { backgroundColor: bg }]}>
      <Text style={{ color: fg, lineHeight: 20 }}>{message}</Text>
    </View>
  );
}

export function QtyStepper({ quantity, onChange, max }: { quantity: number; onChange: (q: number) => void; max: number }) {
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityLabel="Decrease" onPress={() => onChange(quantity - 1)} style={styles.stepBtn} hitSlop={6}>
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <Text style={styles.qty}>{quantity}</Text>
      <Pressable
        accessibilityLabel="Increase"
        onPress={() => onChange(quantity + 1)}
        disabled={quantity >= max}
        style={[styles.stepBtn, quantity >= max && { opacity: 0.35 }]}
        hitSlop={6}
      >
        <Text style={styles.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ left, right, bold, muted }: { left: string; right: string; bold?: boolean; muted?: boolean }) {
  const s = [bold && { fontWeight: "700" as const, fontSize: 16 }, muted && { color: colors.muted }];
  return (
    <View style={styles.row}>
      <Text style={[{ color: colors.text, flexShrink: 1 }, ...s]}>{left}</Text>
      <Text style={[{ color: colors.text }, ...s]}>{right}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  button: { borderRadius: radius, paddingVertical: 14, paddingHorizontal: 18, alignItems: "center", borderWidth: 1 },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  buttonText: { fontSize: 16, fontWeight: "600" },
  label: { fontSize: 14, fontWeight: "600", color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  alert: { borderRadius: radius, padding: 12 },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius },
  stepBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  stepText: { fontSize: 18, color: colors.text },
  qty: { minWidth: 24, textAlign: "center", fontSize: 16, fontWeight: "600", color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 4 },
});
