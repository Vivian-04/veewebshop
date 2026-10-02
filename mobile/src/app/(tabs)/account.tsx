import { Link, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/context/auth";
import { api, type OrderSummary } from "@/lib/api";
import { SHIPPING_ZONES } from "@/lib/config";
import { formatDateTime, formatPrice, statusLabel } from "@/lib/format";
import { colors } from "@/lib/theme";

export default function AccountScreen() {
  const { user, ready, signOut } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      setOrders((await api<{ orders: OrderSummary[] }>("/api/orders")).orders);
    } catch {}
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders]),
  );

  if (!ready) return <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />;

  if (!user) {
    return (
      <View style={s.signedOut}>
        <Text style={s.title}>Your account</Text>
        <Text style={s.muted}>Sign in with the same email and password you use on the ShopWithVee website. Your cart follows you between the two.</Text>
        <Button title="Sign in" onPress={() => router.push("/signin")} />
        <Button title="Create an account" variant="secondary" onPress={() => router.push("/signup")} />
      </View>
    );
  }

  const initials = (user.name || user.email).split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.accent}
          onRefresh={async () => {
            setRefreshing(true);
            await loadOrders();
            setRefreshing(false);
          }}
        />
      }
    >
      <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{user.name || "Your profile"}</Text>
          <Text style={s.muted}>{user.email}</Text>
        </View>
      </Card>

      <Card style={{ gap: 4 }}>
        <Text style={s.section}>Delivery details</Text>
        {user.phone || user.address ? (
          <>
            {user.phone && <Text style={s.text}>{user.phone}</Text>}
            {user.address && <Text style={s.text}>{user.address}</Text>}
            {user.zone && <Text style={s.muted}>{SHIPPING_ZONES[user.zone].label}</Text>}
          </>
        ) : (
          <Text style={s.muted}>Saved automatically when you check out.</Text>
        )}
      </Card>

      <View style={{ gap: 8 }}>
        <Text style={s.section}>My orders</Text>
        {orders === null ? (
          <ActivityIndicator color={colors.accent} />
        ) : orders.length === 0 ? (
          <Text style={s.muted}>No orders yet.</Text>
        ) : (
          orders.map((o) => (
            <Link key={o.id} href={{ pathname: "/orders/[id]", params: { id: String(o.id) } }} asChild>
              <Pressable>
                <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ gap: 2 }}>
                    <Text style={s.name}>Order #{o.id}</Text>
                    <Text style={s.muted}>{formatDateTime(o.createdAt)} · {o.itemCount} item{o.itemCount === 1 ? "" : "s"}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={s.name}>{formatPrice(o.totalKobo)}</Text>
                    <Text style={s.status}>{statusLabel(o.status)}</Text>
                  </View>
                </Card>
              </Pressable>
            </Link>
          ))
        )}
      </View>

      <Button title="Sign out" variant="danger" onPress={() => void signOut()} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  signedOut: { flex: 1, padding: 24, gap: 12, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700", color: colors.text },
  muted: { color: colors.muted, lineHeight: 20 },
  text: { color: colors.text, lineHeight: 20 },
  name: { fontSize: 16, fontWeight: "600", color: colors.text },
  section: { fontSize: 17, fontWeight: "700", color: colors.text },
  status: { fontSize: 12, color: colors.accent, fontWeight: "600" },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 17 },
});
