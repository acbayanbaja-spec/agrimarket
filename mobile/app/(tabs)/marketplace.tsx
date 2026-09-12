import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { categories } from '../../src/data/catalog';
import { useStore } from '../../src/context/StoreContext';
import ProductCard from '../../src/components/ProductCard';
import { BUDGET_PRESETS, filterByBudget, matchProduct, parseSearchQuery } from '../../src/lib/commerce';
import { formatPeso } from '../../src/lib/utils';

export default function MarketplaceScreen() {
  const { products, cartCount } = useStore();
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState<number | undefined>();
  const [category, setCategory] = useState(params.category || 'All');

  useEffect(() => {
    if (params.category) setCategory(params.category);
  }, [params.category]);

  const parsed = parseSearchQuery(query);
  const activeBudget = parsed.budget || budget;

  const filtered = useMemo(() => {
    let list = products.filter((product) => {
      const matchesCategory = category === 'All' || product.category === category;
      return matchesCategory && matchProduct(product, parsed.text);
    });
    if (activeBudget) list = filterByBudget(list, activeBudget);
    return list;
  }, [products, category, parsed.text, activeBudget]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Marketplace</Text>
          <Text style={styles.subtitle}>
            {filtered.length} listings{activeBudget ? ` · under ${formatPeso(activeBudget)}` : ''}
          </Text>
        </View>
        <Pressable style={styles.cartBtn} onPress={() => router.push('/cart')}>
          <Text style={styles.cartText}>Cart {cartCount}</Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search or type a budget like 200 pesos"
        value={query}
        onChangeText={setQuery}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {BUDGET_PRESETS.map((amount) => (
          <Pressable
            key={amount}
            onPress={() => setBudget(amount === budget ? undefined : amount)}
            style={[styles.chip, budget === amount && styles.chipActive]}
          >
            <Text style={[styles.chipText, budget === amount && styles.chipTextActive]}>{formatPeso(amount)}</Text>
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
      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
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
});
