import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { categories, type Product } from '../../src/data/catalog';
import { soccsksargenPlaces } from '../../src/data/locations';
import { useStore } from '../../src/context/StoreContext';
import { useAuth } from '../../src/context/AuthContext';
import ProductCard from '../../src/components/ProductCard';
import { matchProduct } from '../../src/lib/commerce';
import AiAssistantModal from '../../src/components/AiAssistantModal';
import mobileApi from '../../src/services/api';

type SortOption = 'relevance' | 'sales' | 'price_asc' | 'price_desc' | 'rating' | 'organic';

export default function MarketplaceScreen() {
  const { products, cartCount, posts, refreshCatalog, isOnline, newProductAlert, dismissNewProductAlert } = useStore();
  const { isAuthenticated, hasRole } = useAuth();
  const params = useLocalSearchParams<{ category?: string }>();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState(params.category || 'All');
  const [location, setLocation] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [refreshing, setRefreshing] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [remoteProducts, setRemoteProducts] = useState<Product[] | null>(null);
  const [remoteTotal, setRemoteTotal] = useState<number | null>(null);
  const listRef = useRef<ScrollView>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ y: 0, animated: false });
  }, [category, location, sortBy]);

  useEffect(() => {
    if (params.category) setCategory(params.category);
  }, [params.category]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCatalog();
    setRefreshing(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 280);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set('search', debouncedQuery.trim());
    if (category && category !== 'All') params.set('category', category);
    if (location) params.set('location', location);
    if (sortBy === 'organic') params.set('organic', 'true');
    else if (sortBy === 'price_asc') params.set('sort', 'price-asc');
    else if (sortBy === 'price_desc') params.set('sort', 'price-desc');
    else if (sortBy === 'sales') params.set('sort', 'sales');
    else if (sortBy === 'rating') params.set('sort', 'rating');
    else params.set('sort', 'featured');
    params.set('page', '1');
    params.set('pageSize', '24');
    let cancelled = false;
    mobileApi
      .get<any>(`/products?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        const list = res?.data?.products || res?.products;
        if (Array.isArray(list)) {
          setRemoteProducts(list);
          setRemoteTotal(res?.data?.total ?? list.length);
        }
      })
      .catch(() => {
        if (!cancelled) setRemoteProducts(null);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, category, location, sortBy]);

  const filtered = useMemo(() => {
    let list = products.filter((product) => {
      const matchesCategory = category === 'All' || product.category.toLowerCase() === category.toLowerCase();
      const matchesLocation = !location || product.location.includes(location);
      return matchesCategory && matchesLocation && matchProduct(product, query);
    });

    switch (sortBy) {
      case 'price_asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return list.sort((a, b) => b.price - a.price);
      case 'rating':
        return list.sort((a, b) => b.rating - a.rating);
      case 'sales':
        return list.sort((a, b) => b.reviews - a.reviews);
      case 'organic':
        return list.sort((a, b) => (b.organic ? 1 : 0) - (a.organic ? 1 : 0));
      default:
        return list;
    }
  }, [products, category, query, location, sortBy]);

  const visibleProducts = remoteProducts || filtered;
  const resultCount = remoteTotal ?? filtered.length;

  const canShop = isAuthenticated && (hasRole('buyer') || hasRole('seller') || hasRole('admin'));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Marketplace</Text>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#16a34a' : '#f59e0b' }]} />
          </View>
          <Text style={styles.subtitle}>{resultCount} farm harvests across SOCCSKSARGEN</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.aiHeaderBtn} onPress={() => setShowAiModal(true)}>
            <Ionicons name="sparkles" size={18} color="#15803d" />
          </TouchableOpacity>
          <Pressable
            style={styles.cartBtn}
            onPress={() => (canShop ? router.push('/cart') : router.push('/login'))}
          >
            <Ionicons name="cart" size={18} color="#fff" />
            <Text style={styles.cartText}>{cartCount}</Text>
          </Pressable>
        </View>
      </View>

      {/* Guest notice banner */}
      {!isAuthenticated && (
        <View style={styles.guestBanner}>
          <Text style={styles.guestBannerText}>
            👋 Browsing as guest. <Text style={styles.guestLoginLink} onPress={() => router.push('/login')}>Log in</Text> to place orders & claim vouchers.
          </Text>
        </View>
      )}

      {/* Live online alert banner */}
      {newProductAlert && (
        <View style={styles.newAlertCard}>
          <Text style={styles.newAlertText}>
            🌱 <Text style={{ fontWeight: '800' }}>New Harvest:</Text> {newProductAlert.name} from {newProductAlert.seller}
          </Text>
          <TouchableOpacity onPress={dismissNewProductAlert}>
            <Ionicons name="close" size={16} color="#065f46" />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.search}
          placeholder="Search harvests, sellers, varieties, cities..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Shopee-style Sort Bar */}
      <View style={styles.sortBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortBarScroll}>
          {[
            { id: 'relevance', label: 'Relevance' },
            { id: 'sales', label: 'Top Sales' },
            { id: 'rating', label: 'Top Rated ★' },
            { id: 'price_asc', label: 'Price: Low ⭡' },
            { id: 'price_desc', label: 'Price: High ⭣' },
            { id: 'organic', label: '🌿 Organic' },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.sortTab, sortBy === item.id && styles.sortTabActive]}
              onPress={() => setSortBy(item.id as SortOption)}
            >
              <Text style={[styles.sortTabText, sortBy === item.id && styles.sortTabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Location Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationScroll} contentContainerStyle={styles.chipRow}>
        <Pressable onPress={() => setLocation('')} style={[styles.chip, !location && styles.chipActive]}>
          <Text style={[styles.chipText, !location && styles.chipTextActive]}>📍 All cities</Text>
        </Pressable>
        {soccsksargenPlaces.map((place) => (
          <Pressable
            key={place.label}
            onPress={() => setLocation(place.city)}
            style={[styles.chip, location === place.city && styles.chipActive]}
          >
            <Text style={[styles.chipText, location === place.city && styles.chipTextActive]}>
              {place.city}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Category Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.chipRow}>
        {['All', ...categories.map((item) => item.name)].map((name) => (
          <Pressable
            key={name}
            onPress={() => setCategory(name)}
            style={[styles.catChip, category.toLowerCase() === name.toLowerCase() && styles.catChipActive]}
          >
            <Text style={[styles.catChipText, category.toLowerCase() === name.toLowerCase() && styles.catChipTextActive]}>
              {name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Product List */}
      <ScrollView
        ref={listRef}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />}
      >
        {posts.slice(0, 1).map((post) => (
          <View key={post.id} style={styles.feedCard}>
            <View style={styles.feedHeader}>
              <Text style={styles.feedBadge}>COMMUNITY HARVEST POST</Text>
              <Text style={styles.feedDate}>Today</Text>
            </View>
            <Text style={styles.feedTitle}>
              {post.sellerName}
              {post.productName ? ` · ${post.productName}` : ''}
            </Text>
            <Text style={styles.feedBody}>{post.body}</Text>
          </View>
        ))}

        {visibleProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌾</Text>
            <Text style={styles.emptyTitle}>No matching harvests found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search query, filters, or city selection.</Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setQuery('');
                setCategory('All');
                setLocation('');
                setSortBy('relevance');
              }}
            >
              <Text style={styles.resetBtnText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)
        )}
      </ScrollView>

      {/* Floating AI Assistant FAB */}
      <TouchableOpacity
        style={styles.floatingAiButton}
        activeOpacity={0.88}
        onPress={() => setShowAiModal(true)}
      >
        <Ionicons name="sparkles" size={18} color="#fff" />
        <Text style={styles.floatingAiText}>Ask AI</Text>
      </TouchableOpacity>

      <AiAssistantModal visible={showAiModal} onClose={() => setShowAiModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f4ef' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 24, fontWeight: '900', color: '#111827' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  cartBtn: {
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cartText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  guestBanner: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  guestBannerText: { color: '#92400e', fontSize: 12, fontWeight: '600' },
  guestLoginLink: { textDecorationLine: 'underline', fontWeight: '800' },
  newAlertCard: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#86efac',
  },
  newAlertText: { color: '#14532d', fontSize: 12, fontWeight: '600', flex: 1 },
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  search: { flex: 1, fontSize: 14, color: '#111827' },
  sortBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 6,
  },
  sortBarScroll: { paddingHorizontal: 16, gap: 8 },
  sortTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sortTabActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  sortTabText: { fontSize: 12, fontWeight: '700', color: '#4b5563' },
  sortTabTextActive: { color: '#ffffff' },
  locationScroll: { maxHeight: 42, marginTop: 8 },
  categoryScroll: { maxHeight: 42, marginTop: 4, marginBottom: 4 },
  chipRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: '#065f46', borderColor: '#065f46' },
  chipText: { color: '#374151', fontWeight: '600', fontSize: 12 },
  chipTextActive: { color: '#ffffff' },
  catChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  catChipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  catChipText: { color: '#374151', fontWeight: '600', fontSize: 12 },
  catChipTextActive: { color: '#ffffff', fontWeight: '800' },
  list: { padding: 16, paddingBottom: 80 },
  feedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  feedBadge: { fontSize: 10, fontWeight: '900', color: '#16a34a', letterSpacing: 0.5 },
  feedDate: { fontSize: 11, color: '#9ca3af' },
  feedTitle: { fontWeight: '800', color: '#14532d', fontSize: 15 },
  feedBody: { color: '#4b5563', marginTop: 4, fontSize: 13, lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1f2937' },
  emptySubtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 4 },
  resetBtn: {
    marginTop: 16,
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resetBtnText: { color: '#fff', fontWeight: '700' },
  floatingAiButton: {
    position: 'absolute',
    bottom: 20,
    right: 18,
    backgroundColor: '#15803d',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 6,
    shadowColor: '#15803d',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: '#86efac',
  },
  floatingAiText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
});
