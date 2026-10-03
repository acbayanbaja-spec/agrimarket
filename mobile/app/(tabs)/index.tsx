import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { categories } from '../../src/data/catalog';
import { useStore } from '../../src/context/StoreContext';
import { useAuth } from '../../src/context/AuthContext';
import { productPhoto } from '../../src/lib/images';
import ProductCard from '../../src/components/ProductCard';

export default function HomeScreen() {
  const { products, cartCount } = useStore();
  const { isAuthenticated, hasRole } = useAuth();
  const featured = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const canShop = isAuthenticated && (hasRole('buyer') || hasRole('seller') || hasRole('admin'));

  const shopNow = () => {
    if (canShop) router.push('/(tabs)/marketplace');
    else if (hasRole('delivery')) router.push('/(tabs)/orders');
    else router.push('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>AgriMarket</Text>
            <Text style={styles.subtitle}>Fresh harvests across SOCCSKSARGEN</Text>
          </View>
          <Pressable style={styles.cartBtn} onPress={() => canShop ? router.push('/cart') : shopNow()}>
            <Text style={styles.cartText}>Cart {cartCount}</Text>
          </Pressable>
        </View>

        <Image source={productPhoto('/images/hero.jpg')} style={styles.hero} />
        <Pressable style={styles.shopNow} onPress={shopNow}>
          <Text style={styles.shopNowText}>Shop Now</Text>
        </Pressable>
        <Text style={styles.note}>Buyers and sellers must log in before opening products or placing an order.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <Pressable
                key={category.name}
                style={styles.categoryCard}
                onPress={shopNow}
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
            <Link href="/marketplace" style={styles.link} onPress={(event) => {
              if (!canShop) {
                event.preventDefault();
                shopNow();
              }
            }}>See all</Link>
          </View>
          {canShop
            ? featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
            : (
              <Text style={styles.note}>Log in as a buyer or seller to see harvests and add them to your cart.</Text>
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f4ef' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#16a34a' },
  subtitle: { fontSize: 15, color: '#6b7280', marginTop: 4, maxWidth: 220 },
  cartBtn: { backgroundColor: '#14532d', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  cartText: { color: '#fff', fontWeight: '700' },
  hero: { width: '100%', height: 160, borderRadius: 16, marginBottom: 16 },
  shopNow: { backgroundColor: '#16a34a', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 8 },
  shopNowText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  note: { color: '#6b7280', marginBottom: 20, fontSize: 13 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: { width: '47%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  categoryImage: { width: '100%', height: 72 },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#1f2937', padding: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: '#15803d', fontWeight: '700' },
});
