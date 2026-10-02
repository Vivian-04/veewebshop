import { Redirect, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Alert, Button, Card, Field, Row } from "@/components/ui";
import { useAuth } from "@/context/auth";
import { useCart } from "@/context/cart";
import { api } from "@/lib/api";
import { SHIPPING_ZONES, type ShippingZone } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { colors, radius } from "@/lib/theme";

export default function CheckoutScreen() {
  const { user, refreshUser } = useAuth();
  const { items, subtotalKobo, refresh } = useCart();
  const [zone, setZone] = useState<ShippingZone | null>(user?.zone ?? null);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) return <Redirect href="/signin" />;

  const shippingKobo = zone ? SHIPPING_ZONES[zone].feeKobo : 0;

  async function placeOrder() {
    setError(null);
    if (!zone) {
      setError("Please choose Lagos Island or Mainland for delivery.");
      return;
    }
    setLoading(true);
    try {
      // Same endpoint as the website: the server checks out the saved cart and empties it.
      const { orderId } = await api<{ orderId: number }>("/api/orders", {
        method: "POST",
        body: { zone, shipping: { name, phone, address }, saveToProfile },
      });
      await Promise.all([refresh(), refreshUser()]);
      router.replace({ pathname: "/orders/[id]", params: { id: String(orderId), placed: "1" } });
    } catch (err) {
      setError((err as Error).message);
      void refresh();
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <View style={{ padding: 24, gap: 12 }}>
        <Text style={{ color: colors.text, fontSize: 18 }}>Your cart is empty.</Text>
        <Button title="Browse products" onPress={() => router.navigate("/")} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
        {error && <Alert message={error} />}

        <Text style={s.section}>Where should we deliver?</Text>
        {(Object.keys(SHIPPING_ZONES) as ShippingZone[]).map((key) => (
          <Pressable
            key={key}
            onPress={() => setZone(key)}
            accessibilityRole="radio"
            accessibilityState={{ checked: zone === key }}
            style={[s.zone, zone === key && s.zoneSelected]}
          >
            <View style={[s.radio, zone === key && s.radioOn]} />
            <View style={{ flex: 1 }}>
              <Text style={s.zoneTitle}>{SHIPPING_ZONES[key].label}</Text>
              <Text style={s.muted}>{SHIPPING_ZONES[key].examples}</Text>
            </View>
            <Text style={s.zoneTitle}>{formatPrice(SHIPPING_ZONES[key].feeKobo)}</Text>
          </Pressable>
        ))}

        <Field label="Full name" value={name} onChangeText={setName} textContentType="name" />
        <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0803 123 4567" textContentType="telephoneNumber" />
        <Field label="Delivery address" value={address} onChangeText={setAddress} multiline placeholder="House number, street, area and a nearby landmark" textContentType="fullStreetAddress" />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: colors.text }}>Save these details to my profile</Text>
          <Switch value={saveToProfile} onValueChange={setSaveToProfile} trackColor={{ true: colors.accent }} />
        </View>

        <Card style={{ gap: 4 }}>
          <Text style={s.section}>Order summary</Text>
          {items.map((i) => (
            <Row key={i.productId} left={`${i.name} × ${i.quantity}`} right={formatPrice(i.priceKobo * i.quantity)} />
          ))}
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
          <Row left="Subtotal" right={formatPrice(subtotalKobo)} />
          <Row left={zone ? `Delivery (${SHIPPING_ZONES[zone].label})` : "Delivery"} right={zone ? formatPrice(shippingKobo) : "Choose zone"} muted={!zone} />
          <Row left="Total" right={formatPrice(subtotalKobo + shippingKobo)} bold />
        </Card>

        <Text style={s.muted}>Payment is collected on delivery (cash or transfer).</Text>
        <Button title={`Place order · ${formatPrice(subtotalKobo + shippingKobo)}`} onPress={placeOrder} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  section: { fontSize: 17, fontWeight: "700", color: colors.text },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  zone: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  zoneSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  zoneTitle: { fontWeight: "600", color: colors.text, fontSize: 15 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border },
  radioOn: { borderColor: colors.accent, borderWidth: 6 },
});
