import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useStore } from '../../src/context/StoreContext';
import { productPhoto } from '../../src/lib/images';
import { formatPeso, stockLabel } from '../../src/lib/utils';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, addToCart } = useStore();
  const product = products.find((item) => item.id === id);

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Listing not found</Text>
      </SafeAreaView>
    );
  }

  const out = product.stock <= 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image source={productPhoto(product.image)} style={styles.hero} />
        <View style={styles.body}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
          <Text style={styles.category}>{product.category} · {stockLabel(product.stock)}</Text>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.meta}>{product.seller} · {product.location}</Text>
          <Text style={styles.price}>{formatPeso(product.price)} / {product.unit}</Text>
          <Text style={styles.copy}>{product.description}</Text>
          <Pressable
            style={[styles.add, out && styles.disabled]}
            disabled={out}
            onPress={() => addToCart(product)}
          >
            <Text style={styles.addText}>{out ? 'Sold out' : 'Add to cart'}</Text>
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
  price: { fontSize: 22, fontWeight: '800', marginVertical: 8 },
  copy: { fontSize: 16, lineHeight: 24, color: '#374151' },
  add: { marginTop: 16, backgroundColor: '#16a34a', borderRadius: 12, padding: 16, alignItems: 'center' },
  disabled: { backgroundColor: '#9ca3af' },
  addText: { color: '#fff', fontWeight: '800' },
});
