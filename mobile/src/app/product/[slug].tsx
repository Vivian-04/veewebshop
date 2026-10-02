import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Alert, Button } from "@/components/ui";
import { useCart } from "@/context/cart";
import { api, type Product } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { colors } from "@/lib/theme";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { add, items } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api<{ product: Product }>(`/api/products/${encodeURIComponent(slug)}`)
      .then((d) => setProduct(d.product))
      .catch((err: Error) => setError(err.message));
  }, [slug]);

  if (error) return <View style={{ padding: 16 }}><Alert message={error} /></View>;
  if (!product) return <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />;

  const inCart = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const soldOut = product.stock <= 0;
  const atLimit = inCart >= product.stock;

  return (
    <>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Image source={product.imageUrl ?? undefined} style={s.image} contentFit="cover" transition={150} />
        <View style={{ padding: 16, gap: 10 }}>
          <Text style={s.category}>{product.category}</Text>
          <Text style={s.name}>{product.name}</Text>
          <Text style={s.price}>{formatPrice(product.priceKobo)}</Text>
          <Text style={s.description}>{product.description}</Text>
          <Text style={s.stock}>{soldOut ? "Sold out" : `${product.stock} in stock`}</Text>
          {soldOut ? (
            <Button title="Sold out" onPress={() => {}} disabled />
          ) : (
            <Button
              title={added ? "Added ✓" : atLimit ? "All in stock are in your cart" : "Add to cart"}
              disabled={atLimit}
              onPress={() => {
                add(product);
                setAdded(true);
                setTimeout(() => setAdded(false), 1500);
              }}
            />
          )}
          {inCart > 0 && <Button title={`View cart (${inCart} of this)`} variant="secondary" onPress={() => router.navigate("/cart")} />}
        </View>
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  image: { width: "100%", aspectRatio: 1, backgroundColor: colors.border },
  category: { color: colors.muted, fontSize: 14 },
  name: { fontSize: 24, fontWeight: "700", color: colors.text },
  price: { fontSize: 22, fontWeight: "700", color: colors.text },
  description: { fontSize: 16, lineHeight: 24, color: colors.text },
  stock: { color: colors.muted },
});
