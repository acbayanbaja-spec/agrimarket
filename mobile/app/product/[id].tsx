import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useStore } from '../../src/context/StoreContext';
import { useToast } from '../../src/context/ToastContext';
import { productPhoto } from '../../src/lib/images';
import { formatPeso, stockLabel } from '../../src/lib/utils';
import { harvestMeta } from '../../src/lib/commerce';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, addToCart } = useStore();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const product = products.find((item) => item.id === id);

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Listing not found</Text>
      </SafeAreaView>
    );
  }

  const out = product.stock <= 0;
  const meta = harvestMeta(product);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image source={productPhoto(product.image)} style={styles.hero} />
        <View style={styles.body}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
          <Text style={styles.category}>{product.category} · {stockLabel(product.stock)}</Text>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.meta}>{meta.origin} · {meta.sold}+ sold</Text>
          <Text style={styles.price}>{formatPeso(product.price)} / {product.unit}</Text>
          <Text style={styles.was}>{formatPeso(meta.originalPrice)}</Text>
          <Text style={styles.copy}>{product.description}</Text>
          <Text style={styles.points}>{meta.freshness} · {meta.eta} · +{meta.points * quantity} harvest pts</Text>
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} disabled={quantity <= 1} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
              <Text style={styles.stepText}>−</Text>
            </Pressable>
            <Text style={styles.qty}>{quantity}</Text>
            <Pressable style={styles.stepBtn} disabled={quantity >= product.stock} onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}>
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
          <Pressable
            style={[styles.add, out && styles.disabled]}
            disabled={out}
            onPress={() => {
              addToCart(product, quantity);
              toast(`Added to cart · ${product.name}`);
            }}
          >
            <Text style={styles.addText}>{out ? 'Sold out' : `Confirm add · ${formatPeso(product.price * quantity)}`}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  hero: { width: '100%', height: 280 },
  body: { padding: 20, gap: 8 },
  back: { color: '#15803d', fontWeight: '700', marginBottom: 8 },
  category: { color: '#15803d', fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  meta: { color: '#6b7280' },
  price: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  was: { color: '#9ca3af', textDecorationLine: 'line-through' },
  copy: { fontSize: 16, lineHeight: 24, color: '#374151' },
  points: { color: '#92400e', fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  stepBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 22, fontWeight: '700' },
  qty: { minWidth: 36, textAlign: 'center', fontWeight: '700' },
  add: { marginTop: 16, backgroundColor: '#16a34a', borderRadius: 12, padding: 16, alignItems: 'center' },
  disabled: { backgroundColor: '#9ca3af' },
  addText: { color: '#fff', fontWeight: '800' },
});
