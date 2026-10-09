import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { categories } from '../../src/data/catalog';
import { soccsksargenPlaces } from '../../src/data/locations';
import { useStore } from '../../src/context/StoreContext';
import { useAuth } from '../../src/context/AuthContext';
import ProductCard from '../../src/components/ProductCard';
import { matchProduct } from '../../src/lib/commerce';

export default function MarketplaceScreen() {
  const { products, cartCount, posts } = useStore();
  const { isAuthenticated, hasRole } = useAuth();
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(params.category || 'All');
  const [location, setLocation] = useState('');
  const listRef = useRef<ScrollView>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ y: 0, animated: false });
  }, [category, location]);

  const canShop = isAuthenticated && (hasRole('buyer') || hasRole('seller') || hasRole('admin'));

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
    else if (hasRole('delivery') && !hasRole('buyer') && !hasRole('admin')) router.replace('/(tabs)/orders');
  }, [isAuthenticated, hasRole]);

  useEffect(() => {
    if (params.category) setCategory(params.category);
  }, [params.category]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = category === 'All' || product.category === category;
      const matchesLocation = !location || product.location === location;
      return matchesCategory && matchesLocation && matchProduct(product, query);
    });
  }, [products, category, query, location]);

  if (!canShop) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Log in to shop</Text>
        <Text style={styles.subtitle}>Only buyers and sellers can open the product catalog.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Marketplace</Text>
          <Text style={styles.subtitle}>{filtered.length} listings in SOCCSKSARGEN</Text>
        </View>
        <Pressable style={styles.cartBtn} onPress={() => router.push('/cart')}>
          <Text style={styles.cartText}>Cart {cartCount}</Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search harvests, sellers, cities"
        value={query}
        onChangeText={setQuery}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Pressable onPress={() => setLocation('')} style={[styles.chip, !location && styles.chipActive]}>
          <Text style={[styles.chipText, !location && styles.chipTextActive]}>All cities</Text>
        </Pressable>
        {soccsksargenPlaces.map((place) => (
          <Pressable key={place.label} onPress={() => setLocation(place.label)} style={[styles.chip, location === place.label && styles.chipActive]}>
            <Text style={[styles.chipText, location === place.label && styles.chipTextActive]}>{place.city}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipRow}>
        {['All', ...categories.map((item) => item.name)].map((name) => (
          <Pressable
            key={name}
            onPress={() => setCategory(name)}
            style={[styles.chip, category === name && styles.chipActive]}
          >
            <Text style={[styles.chipText, category === name && styles.chipTextActive]}>{name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView ref={listRef} contentContainerStyle={styles.list}>
        {posts.slice(0, 2).map((post) => (
          <View key={post.id} style={styles.feedCard}>
            <Text style={styles.feedTitle}>{post.sellerName}{post.productName ? ` · ${post.productName}` : ''}</Text>
            <Text style={styles.feedBody}>{post.body}</Text>
          </View>
        ))}
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f4ef' },
  header: { paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  cartBtn: { backgroundColor: '#14532d', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  cartText: { color: '#fff', fontWeight: '700' },
  search: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chips: { maxHeight: 48, marginBottom: 8 },
  chipRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  chipText: { color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 40 },
  feedCard: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 12 },
  feedTitle: { fontWeight: '800', color: '#14532d' },
  feedBody: { color: '#4b5563', marginTop: 4 },
});
