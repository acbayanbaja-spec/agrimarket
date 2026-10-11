import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { categories, type Product } from '../../src/data/catalog';
import { useStore } from '../../src/context/StoreContext';
import { useAuth } from '../../src/context/AuthContext';
import { productPhoto } from '../../src/lib/images';
import ProductCard from '../../src/components/ProductCard';
import FlashSaleSection from '../../src/components/FlashSaleSection';
import VouchersModal from '../../src/components/VouchersModal';
import CoinsCheckinModal from '../../src/components/CoinsCheckinModal';
import AiAssistantModal from '../../src/components/AiAssistantModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BANNERS = [
  {
    id: 1,
    title: '🌾 SOCCSKSARGEN Harvest Fair',
    subtitle: 'Up to 35% OFF direct from registered farmers',
    tag: 'MEGA DEAL',
    bg: '#14532d',
    image: '/images/hero.jpg',
  },
  {
    id: 2,
    title: '🚚 Free Shipping Voucher',
    subtitle: 'Zero shipping on orders ₱300+ with code FREESHIP',
    tag: 'CODE: FREESHIP',
    bg: '#065f46',
    image: '/images/farm.jpg',
  },
  {
    id: 3,
    title: '🪙 Claim Daily AgriCoins',
    subtitle: 'Check in every day to get ₱1 discount per coin',
    tag: 'DAILY REWARDS',
    bg: '#92400e',
    image: '/images/mango.jpg',
  },
  {
    id: 4,
    title: '🤖 AgriKaibigan AI Assistant',
    subtitle: 'Ask about fair prices, crop disease, and recipes',
    tag: 'POWERED BY GEMINI',
    bg: '#1e3a8a',
    image: '/images/tomato.jpg',
  },
];

export default function HomeScreen() {
  const {
    products,
    cartCount,
    refreshCatalog,
    isOnline,
    lastSyncTime,
    newProductAlert,
    dismissNewProductAlert,
    recommendations,
    agriCoins,
  } = useStore();
  const { isAuthenticated, hasRole } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showVouchers, setShowVouchers] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Pulse animation for live online indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Banner auto-rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % BANNERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCatalog();
    setRefreshing(false);
  };

  const canShop = isAuthenticated && (hasRole('buyer') || hasRole('seller') || hasRole('admin'));

  const navigateToMarketplace = (categoryName?: string) => {
    if (categoryName && categoryName !== 'All') {
      router.push({ pathname: '/(tabs)/marketplace', params: { category: categoryName } });
    } else {
      router.push('/(tabs)/marketplace');
    }
  };

  // Filter recommendations (20+ recommendations)
  const filteredRecommendations = useMemo(() => {
    let list = recommendations;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.seller.toLowerCase().includes(q)
      );
    }

    if (selectedFilter === 'All') return list;
    if (selectedFilter === '🌿 Organic') return list.filter((p) => p.organic);
    if (selectedFilter === '🔥 Best Sellers') return list.filter((p) => p.rating >= 4.8);
    return list.filter((p) => p.category.toLowerCase().includes(selectedFilter.toLowerCase()));
  }, [recommendations, selectedFilter, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Shopee Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Ionicons name="leaf" size={16} color="#fff" />
            <Text style={styles.brandText}>AgriMarket</Text>
          </View>
          <View style={styles.mallTag}>
            <Text style={styles.mallTagText}>MALL</Text>
          </View>

          {/* Real-time online status */}
          <View style={styles.statusPill}>
            <Animated.View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isOnline ? '#22c55e' : '#f59e0b',
                  transform: [{ scale: isOnline ? pulseAnim : 1 }],
                },
              ]}
            />
            <Text style={styles.statusPillText}>
              {isOnline ? `Live (${products.length} Items)` : 'Offline Cache'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* AgriCoins quick shortcut */}
          <TouchableOpacity style={styles.coinsBadge} onPress={() => setShowCoins(true)}>
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={styles.coinsCount}>{agriCoins}</Text>
          </TouchableOpacity>

          {/* Vouchers shortcut */}
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowVouchers(true)}>
            <Ionicons name="ticket-outline" size={22} color="#15803d" />
          </TouchableOpacity>

          {/* Cart Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => (canShop ? router.push('/cart') : router.push('/login'))}
          >
            <Ionicons name="cart-outline" size={22} color="#15803d" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Shopee Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search 28+ fresh harvests, farms, cities..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setShowAiModal(true)}>
              <Ionicons name="sparkles" size={18} color="#15803d" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />}
      >
        {/* 3. New Online Harvest Alert Banner (Real-time Broadcast) */}
        {newProductAlert && (
          <View style={styles.newAlertCard}>
            <View style={styles.newAlertLeft}>
              <Text style={styles.newAlertSparkle}>🌱</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.newAlertTitle}>NEW HARVEST JUST LISTED ONLINE!</Text>
                <Text style={styles.newAlertDesc}>
                  {newProductAlert.name} · ₱{newProductAlert.price}/{newProductAlert.unit} from {newProductAlert.seller}
                </Text>
              </View>
            </View>
            <View style={styles.newAlertActions}>
              <TouchableOpacity
                style={styles.newAlertViewBtn}
                onPress={() => {
                  dismissNewProductAlert();
                  router.push(`/product/${newProductAlert.id}` as any);
                }}
              >
                <Text style={styles.newAlertViewText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={dismissNewProductAlert} style={styles.newAlertCloseBtn}>
                <Ionicons name="close" size={18} color="#065f46" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 4. Shopee Hero Banner Carousel */}
        <View style={styles.carouselContainer}>
          {BANNERS.map((banner, index) => {
            if (index !== activeBanner) return null;
            return (
              <TouchableOpacity
                key={banner.id}
                style={[styles.bannerSlide, { backgroundColor: banner.bg }]}
                activeOpacity={0.92}
                onPress={() => {
                  if (banner.id === 2) setShowVouchers(true);
                  else if (banner.id === 3) setShowCoins(true);
                  else if (banner.id === 4) setShowAiModal(true);
                  else navigateToMarketplace();
                }}
              >
                <View style={styles.bannerInfo}>
                  <View style={styles.bannerTagBadge}>
                    <Text style={styles.bannerTagText}>{banner.tag}</Text>
                  </View>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                </View>
                <Image source={productPhoto(banner.image)} style={styles.bannerImage} />
              </TouchableOpacity>
            );
          })}

          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {BANNERS.map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, activeBanner === idx ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>
        </View>

        {/* 5. Shopee 8-Icon Circular Quick Action Grid */}
        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigateToMarketplace()}>
            <View style={[styles.gridIconCircle, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="flash" size={24} color="#dc2626" />
            </View>
            <Text style={styles.gridLabel}>Flash Deals</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => setShowCoins(true)}>
            <View style={[styles.gridIconCircle, { backgroundColor: '#fef3c7' }]}>
              <Text style={{ fontSize: 22 }}>🪙</Text>
            </View>
            <Text style={styles.gridLabel}>AgriCoins</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => setShowVouchers(true)}>
            <View style={[styles.gridIconCircle, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="ticket" size={24} color="#15803d" />
            </View>
            <Text style={styles.gridLabel}>Vouchers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => setShowAiModal(true)}>
            <View style={[styles.gridIconCircle, { backgroundColor: '#e0e7ff' }]}>
              <Ionicons name="sparkles" size={24} color="#4338ca" />
            </View>
            <Text style={styles.gridLabel}>AgriKaibigan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => setSelectedFilter('🌿 Organic')}>
            <View style={[styles.gridIconCircle, { backgroundColor: '#ecfdf5' }]}>
              <Text style={{ fontSize: 22 }}>🌿</Text>
            </View>
            <Text style={styles.gridLabel}>100% Organic</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigateToMarketplace('Fruits')}>
            <View style={[styles.gridIconCircle, { backgroundColor: '#ffedd5' }]}>
              <Text style={{ fontSize: 22 }}>🥭</Text>
            </View>
            <Text style={styles.gridLabel}>Fresh Fruits</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigateToMarketplace('Vegetables')}>
            <View style={[styles.gridIconCircle, { backgroundColor: '#f0fdf4' }]}>
              <Text style={{ fontSize: 22 }}>🥬</Text>
            </View>
            <Text style={styles.gridLabel}>Vegetables</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigateToMarketplace('Rice & Grains')}>
            <View style={[styles.gridIconCircle, { backgroundColor: '#fef9c3' }]}>
              <Text style={{ fontSize: 22 }}>🌾</Text>
            </View>
            <Text style={styles.gridLabel}>Rice & Grains</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Shopee Flash Deals Section */}
        <FlashSaleSection />

        {/* 7. Category Horizontal Tiles */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse Harvests by Category</Text>
          <TouchableOpacity onPress={() => navigateToMarketplace()}>
            <Text style={styles.seeAllText}>See all &gt;</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={styles.categoryTile}
              onPress={() => navigateToMarketplace(category.name)}
            >
              <Image source={productPhoto(category.image)} style={styles.categoryTileImage} />
              <View style={styles.categoryTileOverlay}>
                <Text style={styles.categoryTileEmoji}>{category.emoji}</Text>
                <Text style={styles.categoryTileName}>{category.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 8. Shopee "Daily Discover" / "20+ Recommendations For You" */}
        <View style={styles.recommendationsSection}>
          <View style={styles.discoverHeader}>
            <View style={styles.discoverTitleRow}>
              <Text style={styles.discoverEmoji}>⭐</Text>
              <Text style={styles.discoverTitle}>DAILY DISCOVER</Text>
            </View>
            <Text style={styles.discoverSubtitle}>
              {filteredRecommendations.length} Smart Recommendations across SOCCSKSARGEN
            </Text>
          </View>

          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsScroll}
          >
            {[
              'All',
              '🔥 Best Sellers',
              '🌿 Organic',
              'Vegetables',
              'Fruits',
              'Rice & Grains',
              'Fish',
              'Poultry',
              'Farm Supplies',
            ].map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.filterChip, selectedFilter === tag && styles.filterChipActive]}
                onPress={() => setSelectedFilter(tag)}
              >
                <Text
                  style={[styles.filterChipText, selectedFilter === tag && styles.filterChipTextActive]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 20+ Recommendations Grid */}
          <View style={styles.productsGrid}>
            {filteredRecommendations.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) for AI Chatbot */}
      <TouchableOpacity
        style={styles.floatingAiButton}
        activeOpacity={0.88}
        onPress={() => setShowAiModal(true)}
      >
        <View style={styles.floatingAiContent}>
          <Ionicons name="sparkles" size={20} color="#fff" />
          <Text style={styles.floatingAiText}>Ask AI</Text>
        </View>
      </TouchableOpacity>

      {/* Shopee Vouchers Modal */}
      <VouchersModal visible={showVouchers} onClose={() => setShowVouchers(false)} />

      {/* Shopee Coins Checkin Modal */}
      <CoinsCheckinModal visible={showCoins} onClose={() => setShowCoins(false)} />

      {/* Universal Gemini AI Assistant Modal */}
      <AiAssistantModal visible={showAiModal} onClose={() => setShowAiModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f4ef' },
  topBar: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  brandText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  mallTag: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mallTagText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusPillText: { fontSize: 11, fontWeight: '700', color: '#4b5563' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 3,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  coinEmoji: { fontSize: 12 },
  coinsCount: { fontSize: 12, fontWeight: '800', color: '#b45309' },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#dc2626',
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  searchBarContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  scrollContent: { paddingBottom: 80 },
  newAlertCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#dcfce7',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#86efac',
    elevation: 3,
    shadowColor: '#16a34a',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  newAlertLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  newAlertSparkle: { fontSize: 24 },
  newAlertTitle: { fontSize: 11, fontWeight: '900', color: '#166534', letterSpacing: 0.5 },
  newAlertDesc: { fontSize: 13, color: '#14532d', fontWeight: '600', marginTop: 1 },
  newAlertActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  newAlertViewBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newAlertViewText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  newAlertCloseBtn: { padding: 4 },
  carouselContainer: { marginHorizontal: 16, marginTop: 12, marginBottom: 16 },
  bannerSlide: {
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  bannerInfo: { flex: 1, paddingRight: 10 },
  bannerTagBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  bannerTagText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  bannerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900', lineHeight: 22 },
  bannerSubtitle: { color: 'rgba(255,255,255,0.88)', fontSize: 12, marginTop: 4 },
  bannerImage: { width: 90, height: 90, borderRadius: 14 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { height: 4, borderRadius: 2 },
  dotActive: { width: 20, backgroundColor: '#16a34a' },
  dotInactive: { width: 6, backgroundColor: '#d1d5db' },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  gridItem: { width: '25%', alignItems: 'center', paddingVertical: 8 },
  gridIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridLabel: { fontSize: 11, fontWeight: '700', color: '#374151', textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  seeAllText: { fontSize: 13, fontWeight: '700', color: '#15803d' },
  categoryScroll: { paddingHorizontal: 16, gap: 10, paddingBottom: 16 },
  categoryTile: {
    width: 110,
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e5e7eb',
  },
  categoryTileImage: { width: '100%', height: '100%' },
  categoryTileOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  categoryTileEmoji: { fontSize: 24, marginBottom: 2 },
  categoryTileName: { color: '#ffffff', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  recommendationsSection: { marginHorizontal: 16, marginTop: 8 },
  discoverHeader: {
    backgroundColor: '#16a34a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  discoverTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  discoverEmoji: { fontSize: 20 },
  discoverTitle: { color: '#ffffff', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  discoverSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },
  filterPillsScroll: { gap: 8, paddingBottom: 12 },
  filterChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  filterChipActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  filterChipText: { fontSize: 13, color: '#4b5563', fontWeight: '600' },
  filterChipTextActive: { color: '#ffffff', fontWeight: '800' },
  productsGrid: { gap: 4 },
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
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 2,
    borderColor: '#86efac',
  },
  floatingAiContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  floatingAiText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
});
