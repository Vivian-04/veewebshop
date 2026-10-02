import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Alert, Button, Card, Row } from "@/components/ui";
import { api, type Order } from "@/lib/api";
import { SHIPPING_ZONES } from "@/lib/config";
import { formatDateTime, formatPrice, statusLabel } from "@/lib/format";
import { colors } from "@/lib/theme";

export default function OrderScreen() {
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}`)
      .then((d) => setOrder(d.order))
      .catch((err: Error) => setError(err.message));
  }, [id]);

  if (error) return <View style={{ padding: 16 }}><Alert message={error} /></View>;
  if (!order) return <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />;

  return (
    <>
      <Stack.Screen options={{ title: `Order #${order.id}` }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        {placed && (
          <Alert
            tone="success"
            message={`Thank you! Your order has been placed. We'll call ${order.shipping.phone} to arrange delivery. A confirmation email is on its way (check spam if you don't see it).`}
          />
        )}
        <Card style={{ gap: 4 }}>
          {order.items.map((i) => (
            <Row key={i.productId} left={`${i.name} × ${i.quantity}`} right={formatPrice(i.unitKobo * i.quantity)} />
          ))}
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
          <Row left="Subtotal" right={formatPrice(order.subtotalKobo)} />
          <Row left={`Delivery (${SHIPPING_ZONES[order.zone].label})`} right={formatPrice(order.shippingKobo)} />
          <Row left="Total" right={formatPrice(order.totalKobo)} bold />
        </Card>
        <Card style={{ gap: 4 }}>
          <Text style={{ fontWeight: "700", fontSize: 16, color: colors.text }}>Delivering to</Text>
          <Text style={{ color: colors.text }}>{order.shipping.name}</Text>
          <Text style={{ color: colors.text }}>{order.shipping.phone}</Text>
          <Text style={{ color: colors.text }}>{order.shipping.address}</Text>
          <Text style={{ color: colors.muted }}>{SHIPPING_ZONES[order.zone].label}</Text>
        </Card>
        <Text style={{ color: colors.muted }}>
          Placed {formatDateTime(order.createdAt)} · {statusLabel(order.status)} · Payment on delivery
        </Text>
        <Button title="Continue shopping" variant="secondary" onPress={() => router.navigate("/")} />
      </ScrollView>
    </>
  );
}
