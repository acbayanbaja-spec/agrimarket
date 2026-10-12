import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '../../src/context/StoreContext';
import { useToast } from '../../src/context/ToastContext';
import { productPhoto } from '../../src/lib/images';
import { formatPeso, stockLabel } from '../../src/lib/utils';
import { harvestMeta } from '../../src/lib/commerce';
import { useAuth } from '../../src/context/AuthContext';
import mobileApi from '../../src/services/api';
import type { Product } from '../../src/data/catalog';
import ProductCard from '../../src/components/ProductCard';
import AiAssistantModal from '../../src/components/AiAssistantModal';
import VouchersModal from '../../src/components/VouchersModal';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, addToCart, posts, toggleWishlist, isWishlisted, recommendations } = useStore();
  const { isAuthenticated, hasRole } = useAuth();
  const { toast } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showVouchers, setShowVouchers] = useState(false);
  const [relatedRemote, setRelatedRemote] = useState<Product[]>([]);
  const [remoteProduct, setRemoteProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const catalogProduct = products.find((item) => item.id === id);
  const product = catalogProduct || remoteProduct;

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setQuantity(1);
    if (!id) return
    mobileApi
      .get<any>(`/products/${id}/related`)
      .then((res) => setRelatedRemote(res?.data?.products || res?.products || []))
      .catch(() => setRelatedRemote([]))
  }, [id]);

  useEffect(() => {
    if (!id || catalogProduct) {
      setRemoteProduct(null);
      setProductLoading(false);
      return;
    }
    let cancelled = false;
    setProductLoading(true);
    mobileApi
      .get<any>(`/products/${id}`)
      .then((res) => {
        if (!cancelled) setRemoteProduct(res?.data?.product || res?.product || null);
      })
      .catch(() => {
        if (!cancelled) setRemoteProduct(null);
      })
      .finally(() => {
        if (!cancelled) setProductLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, catalogProduct]);

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>🌾</Text>
          <Text style={styles.title}>{productLoading ? 'Loading harvest…' : 'Listing not found'}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go back to Marketplace</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const out = product.stock <= 0;
  const meta = harvestMeta(product);
  const favorited = isWishlisted(product.id);
  const canShop = isAuthenticated && (hasRole('buyer') || hasRole('seller') || hasRole('admin'));
  const sellerFeed = posts.filter((post) => post.productId === product.id || post.sellerName === product.seller);

  // 4 Related recommendations
  const related =
    relatedRemote.length > 0
      ? relatedRemote
      : recommendations
          .filter((p) => p.id !== product.id && (p.category === product.category || p.location === product.location))
          .slice(0, 4);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please log in to add items to your cart.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log In', onPress: () => router.push('/login') },
      ]);
      return;
    }
    addToCart(product, quantity);
    toast(`Added ${quantity}× ${product.name} to cart!`);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    addToCart(product, quantity);
    router.push('/cart');
  };

  const discountPercent = Math.max(12, Math.round(((meta.originalPrice - product.price) / meta.originalPrice) * 100));

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navIconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>

        <View style={styles.navActions}>
          <TouchableOpacity style={styles.navIconBtn} onPress={() => toggleWishlist(product.id)}>
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={22}
              color={favorited ? '#ef4444' : '#374151'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navIconBtn} onPress={() => router.push('/cart')}>
            <Ionicons name="cart-outline" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.heroContainer}>
          <Image source={productPhoto(product.image)} style={styles.hero} resizeMode="cover" />
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{discountPercent}% OFF</Text>
          </View>
          {product.organic && (
            <View style={styles.organicTag}>
              <Text style={styles.organicTagText}>🌿 100% Organic</Text>
            </View>
          )}
        </View>

        {/* Product Information Body */}
        <View style={styles.body}>
          {/* Price & Sold Counter */}
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.priceSymbol}>₱</Text>
              <Text style={styles.price}>{product.price}</Text>
              <Text style={styles.unit}> / {product.unit}</Text>
              <Text style={styles.wasPrice}>{formatPeso(meta.originalPrice)}</Text>
            </View>
            <Text style={styles.soldBadge}>{meta.sold}+ sold in SOCCSKSARGEN</Text>
          </View>

          {/* Title & Category */}
          <Text style={styles.title}>{product.name}</Text>

          <View style={styles.ratingBar}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text style={styles.ratingText}>{product.rating} ({product.reviews} reviews)</Text>
            </View>
            <Text style={styles.dot}>·</Text>
            <View style={styles.stockBadge}>
              <Text style={styles.stockBadgeText}>{stockLabel(product.stock)} ({product.stock} available)</Text>
            </View>
          </View>

          {/* Shopee Voucher Banner */}
          <TouchableOpacity style={styles.voucherPill} onPress={() => setShowVouchers(true)}>
            <View style={styles.voucherPillLeft}>
              <Ionicons name="ticket" size={16} color="#ea580c" />
              <Text style={styles.voucherPillText}>Shop Vouchers: ₱50 OFF Free Shipping</Text>
            </View>
            <Text style={styles.voucherPillClaim}>Claim &gt;</Text>
          </TouchableOpacity>

          {/* Shipping & Location Assurance */}
          <View style={styles.shippingCard}>
            <View style={styles.shippingRow}>
              <Ionicons name="car" size={18} color="#15803d" />
              <View style={{ flex: 1 }}>
                <Text style={styles.shippingTitle}>Farm-to-Door Delivery</Text>
                <Text style={styles.shippingDesc}>Dispatched within 24 hours · {meta.eta}</Text>
              </View>
            </View>
            <View style={styles.shippingRow}>
              <Ionicons name="location" size={18} color="#15803d" />
              <View style={{ flex: 1 }}>
                <Text style={styles.shippingTitle}>Origin: {product.location}</Text>
                <Text style={styles.shippingDesc}>Zero middleman markups · Direct farm gate</Text>
              </View>
            </View>
          </View>

          {/* Quantity Stepper */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionLabel}>Select Quantity:</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                disabled={quantity <= 1}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={styles.stepText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                disabled={quantity >= product.stock}
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
              >
                <Text style={styles.stepText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.sectionHeading}>Product Details</Text>
            <Text style={styles.descCopy}>{product.description}</Text>
          </View>

          {/* Seller / Farmer Profile Card */}
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>{product.seller[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.sellerTitleRow}>
                <Text style={styles.sellerName}>{product.seller}</Text>
                <View style={styles.preferredBadge}>
                  <Text style={styles.preferredBadgeText}>Preferred</Text>
                </View>
              </View>
              <Text style={styles.sellerMeta}>Verified Agricultural Producer · {product.location}</Text>
            </View>
            <TouchableOpacity style={styles.chatSellerBtn} onPress={() => setShowAiModal(true)}>
              <Ionicons name="chatbubbles-outline" size={16} color="#15803d" />
              <Text style={styles.chatSellerText}>Chat</Text>
            </TouchableOpacity>
          </View>

          {/* Seller Feed Posts */}
          {sellerFeed.map((post) => (
            <View key={post.id} style={styles.feedPostBox}>
              <Text style={styles.feedPostTitle}>📢 Farmer Live Update</Text>
              <Text style={styles.feedPostBody}>{post.body}</Text>
            </View>
          ))}

          {/* Related Recommendations (4 items) */}
          {related.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedHeading}>⭐ You May Also Like</Text>
              <View style={styles.relatedGrid}>
                {related.map((item) => (
                  <ProductCard key={item.id} product={item} compact />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Shopee Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomIconAction} onPress={() => setShowAiModal(true)}>
          <Ionicons name="sparkles" size={20} color="#15803d" />
          <Text style={styles.bottomIconText}>Ask AI</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomIconAction} onPress={() => toggleWishlist(product.id)}>
          <Ionicons name={favorited ? 'heart' : 'heart-outline'} size={20} color={favorited ? '#ef4444' : '#6b7280'} />
          <Text style={styles.bottomIconText}>{favorited ? 'Liked' : 'Favorite'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomAddBtn, out && styles.bottomBtnDisabled]}
          disabled={out}
          onPress={handleAddToCart}
        >
          <Text style={styles.bottomAddText}>{out ? 'Out of Stock' : 'Add to Cart'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomBuyBtn, out && styles.bottomBtnDisabled]}
          disabled={out}
          onPress={handleBuyNow}
        >
          <Text style={styles.bottomBuyText}>{out ? 'Sold Out' : `Buy Now (${formatPeso(product.price * quantity)})`}</Text>
        </TouchableOpacity>
      </View>

      <AiAssistantModal visible={showAiModal} onClose={() => setShowAiModal(false)} />
      <VouchersModal visible={showVouchers} onClose={() => setShowVouchers(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scrollContent: { paddingBottom: 100 },
  heroContainer: { width: '100%', height: 320, position: 'relative', backgroundColor: '#f3f4f6' },
  hero: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ea580c',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  discountBadgeText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  organicTag: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  organicTagText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  body: { padding: 18, gap: 12 },
  priceContainer: { gap: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  priceSymbol: { fontSize: 22, fontWeight: '900', color: '#ea580c' },
  price: { fontSize: 32, fontWeight: '900', color: '#ea580c' },
  unit: { fontSize: 16, color: '#6b7280', fontWeight: '600' },
  wasPrice: { fontSize: 15, color: '#9ca3af', textDecorationLine: 'line-through', marginLeft: 8 },
  soldBadge: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', lineHeight: 30 },
  ratingBar: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  dot: { color: '#9ca3af' },
  stockBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  stockBadgeText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  voucherPill: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voucherPillLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voucherPillText: { fontSize: 13, color: '#9a3412', fontWeight: '700' },
  voucherPillClaim: { fontSize: 12, color: '#ea580c', fontWeight: '800' },
  shippingCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  shippingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shippingTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  shippingDesc: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
  },
  stepBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  stepText: { fontSize: 20, fontWeight: '700', color: '#374151' },
  qtyText: { minWidth: 40, textAlign: 'center', fontWeight: '800', fontSize: 16 },
  descSection: { marginTop: 4, gap: 6 },
  sectionHeading: { fontSize: 17, fontWeight: '800', color: '#111827' },
  descCopy: { fontSize: 15, lineHeight: 22, color: '#4b5563' },
  sellerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerAvatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sellerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sellerName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  preferredBadge: { backgroundColor: '#ea580c', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  preferredBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  sellerMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  chatSellerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  chatSellerText: { color: '#15803d', fontWeight: '800', fontSize: 13 },
  feedPostBox: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  feedPostTitle: { fontSize: 12, fontWeight: '800', color: '#166534' },
  feedPostBody: { fontSize: 13, color: '#374151', marginTop: 4 },
  relatedSection: { marginTop: 16, gap: 10 },
  relatedHeading: { fontSize: 18, fontWeight: '800', color: '#111827' },
  relatedGrid: { gap: 6 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorEmoji: { fontSize: 48, marginBottom: 10 },
  backBtn: { marginTop: 14, backgroundColor: '#16a34a', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: '700' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  bottomIconAction: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  bottomIconText: { fontSize: 10, color: '#6b7280', fontWeight: '600', marginTop: 2 },
  bottomAddBtn: {
    flex: 1,
    backgroundColor: '#fef3c7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  bottomAddText: { color: '#b45309', fontWeight: '800', fontSize: 13 },
  bottomBuyBtn: {
    flex: 1.2,
    backgroundColor: '#ea580c',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  bottomBuyText: { color: '#ffffff', fontWeight: '900', fontSize: 13 },
  bottomBtnDisabled: { backgroundColor: '#9ca3af' },
});
