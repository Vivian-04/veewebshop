import { Image } from "expo-image";
import { Link, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Alert, Button, Card, QtyStepper, Row } from "@/components/ui";
import { useAuth } from "@/context/auth";
import { useCart } from "@/context/cart";
import { SHIPPING_ZONES } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { colors, radius } from "@/lib/theme";

export default function CartScreen() {
  const { user } = useAuth();
  const { items, subtotalKobo, setQuantity, remove, refresh, error } = useCart();
  const [refreshing, setRefreshing] = useState(false);

  // Always show the latest cart when this tab is opened (on top of the background sync).
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (items.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTitle}>Your cart is empty</Text>
        {!user && <Text style={s.muted}>Sign in to see the cart from your account on the website.</Text>}
        <Button title="Browse products" onPress={() => router.navigate("/")} />
        {!user && <Button title="Sign in" variant="secondary" onPress={() => router.push("/signin")} />}
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => String(i.productId)}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      refreshControl={user ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} /> : undefined}
      ListHeaderComponent={error ? <Alert message={error} /> : null}
      renderItem={({ item }) => (
        <View style={s.line}>
          <Link href={{ pathname: "/product/[slug]", params: { slug: item.slug } }} asChild>
            <Pressable>
              <Image source={item.imageUrl ?? undefined} style={s.thumb} contentFit="cover" />
            </Pressable>
          </Link>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={s.name} numberOfLines={2}>{item.name}</Text>
            <Text style={s.muted}>{formatPrice(item.priceKobo)}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <QtyStepper quantity={item.quantity} max={Math.min(item.stock, 99)} onChange={(q) => setQuantity(item.productId, q)} />
              <Pressable onPress={() => remove(item.productId)} hitSlop={8}>
                <Text style={{ color: colors.danger }}>Remove</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      ListFooterComponent={
        <Card style={{ gap: 6, marginTop: 4 }}>
          <Row left="Subtotal" right={formatPrice(subtotalKobo)} bold />
          <Row
            left="Delivery"
            right={`${formatPrice(SHIPPING_ZONES.mainland.feeKobo)} – ${formatPrice(SHIPPING_ZONES.island.feeKobo)}`}
            muted
          />
          <Text style={[s.muted, { fontSize: 13 }]}>Mainland or Island, chosen at checkout.</Text>
          <Button
            title={user ? "Checkout" : "Sign in to check out"}
            onPress={() => router.push(user ? "/checkout" : "/signin")}
            style={{ marginTop: 10 }}
          />
        </Card>
      }
    />
  );
}

const s = StyleSheet.create({
  empty: { flex: 1, padding: 24, gap: 12, justifyContent: "center" },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: colors.text, textAlign: "center" },
  muted: { color: colors.muted, textAlign: "left" },
  line: { flexDirection: "row", gap: 12, backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12 },
  thumb: { width: 72, height: 72, borderRadius: 8, backgroundColor: colors.border },
  name: { fontSize: 15, fontWeight: "600", color: colors.text },
});
