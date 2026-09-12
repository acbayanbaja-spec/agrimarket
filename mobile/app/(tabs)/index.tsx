import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { categories } from '../../src/data/catalog';
import { useStore } from '../../src/context/StoreContext';
import { productPhoto } from '../../src/lib/images';
import ProductCard from '../../src/components/ProductCard';

export default function HomeScreen() {
  const { products, cartCount } = useStore();
  const featured = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>AgriMarket</Text>
            <Text style={styles.subtitle}>Fresh harvests from Filipino farms</Text>
          </View>
          <Pressable style={styles.cartBtn} onPress={() => router.push('/cart')}>
            <Text style={styles.cartText}>Cart {cartCount}</Text>
          </Pressable>
        </View>

        <Image source={productPhoto('/images/hero.jpg')} style={styles.hero} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <Pressable
                key={category.name}
                style={styles.categoryCard}
                onPress={() => router.push({ pathname: '/(tabs)/marketplace', params: { category: category.name } })}
              >
                <Image source={productPhoto(category.image)} style={styles.categoryImage} />
                <Text style={styles.categoryText}>{category.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>Featured harvests</Text>
            <Link href="/marketplace" style={styles.link}>See all</Link>
          </View>
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#16a34a' },
  subtitle: { fontSize: 15, color: '#6b7280', marginTop: 4, maxWidth: 220 },
  cartBtn: { backgroundColor: '#14532d', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  cartText: { color: '#fff', fontWeight: '700' },
  hero: { width: '100%', height: 160, borderRadius: 16, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: { width: '47%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  categoryImage: { width: '100%', height: 72 },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#1f2937', padding: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: '#15803d', fontWeight: '700' },
});
