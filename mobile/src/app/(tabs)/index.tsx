import { Image } from "expo-image";
import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Alert } from "@/components/ui";
import { api, type Product } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { colors, radius } from "@/lib/theme";

export default function ShopScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const query = category ? `?category=${encodeURIComponent(category)}` : "";
      const data = await api<{ products: Product[]; categories: string[] }>(`/api/products${query}`);
      setProducts(data.products);
      setCategories(data.categories);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [category]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <FlatList
      data={products}
      keyExtractor={(p) => String(p.id)}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 4 }}>
          <Text style={s.hero}>Beautiful Nigerian-made goods, delivered across Lagos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {[null, ...categories].map((c) => (
              <Pressable
                key={c ?? "all"}
                onPress={() => setCategory(c)}
                style={[s.chip, category === c && s.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: category === c }}
              >
                <Text style={[s.chipText, category === c && { color: "#fff" }]}>{c ?? "All"}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {error && <Alert message={error} />}
          {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />}
        </View>
      }
      renderItem={({ item }) => (
        <Link href={{ pathname: "/product/[slug]", params: { slug: item.slug } }} asChild>
          <Pressable style={s.card}>
            <Image source={item.imageUrl ?? undefined} style={s.image} contentFit="cover" transition={150} />
            <View style={{ padding: 10, gap: 2 }}>
              <Text style={s.category}>{item.category}</Text>
              <Text style={s.name} numberOfLines={2}>{item.name}</Text>
              <Text style={s.price}>{formatPrice(item.priceKobo)}</Text>
              {item.stock <= 0 && <Text style={s.soldOut}>Sold out</Text>}
            </View>
          </Pressable>
        </Link>
      )}
    />
  );
}

const s = StyleSheet.create({
  hero: { fontSize: 22, fontWeight: "700", color: colors.text, lineHeight: 28 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontWeight: "500" },
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  image: { width: "100%", aspectRatio: 1, backgroundColor: colors.border },
  category: { fontSize: 12, color: colors.muted },
  name: { fontSize: 15, fontWeight: "600", color: colors.text },
  price: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 2 },
  soldOut: { fontSize: 12, color: colors.danger, fontWeight: "600" },
});
