import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '../src/context/StoreContext';
import { useAuth } from '../src/context/AuthContext';
import { productPhoto } from '../src/lib/images';
import { formatPeso } from '../src/lib/utils';
import { pointsFromSpend } from '../src/lib/commerce';
import VouchersModal from '../src/components/VouchersModal';

export default function CartScreen() {
  const { cart, cartTotal, removeFromCart, updateCartQuantity, claimedVouchers, agriCoins } = useStore();
  const { isAuthenticated, hasRole } = useAuth();
  const [useCoins, setUseCoins] = useState(false);
  const [showVouchers, setShowVouchers] = useState(false);

  const canShop = isAuthenticated && (hasRole('buyer') || hasRole('seller'));

  const hasFreeShipVoucher = claimedVouchers.includes('FREESHIP');
  const baseShipping = cartTotal >= 300 || hasFreeShipVoucher ? 0 : 50;
  const coinsDiscount = useCoins ? Math.min(agriCoins, 50) : 0;
  const finalTotal = Math.max(0, cartTotal + baseShipping - coinsDiscount);
  const points = pointsFromSpend(cartTotal);
  const freeShipThreshold = 300;
  const awayFromFreeShip = Math.max(0, freeShipThreshold - cartTotal);

  if (hasRole('admin')) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#15803d" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>🛡️</Text>
          <Text style={styles.emptyTitle}>Admin Ordering Restricted</Text>
          <Text style={styles.emptySubtitle}>Administrators cannot place orders. The admin role is dedicated to platform moderation.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canShop) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#15803d" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>🧺</Text>
          <Text style={styles.emptyTitle}>Log in to View Cart</Text>
          <Text style={styles.emptySubtitle}>Please log in as a buyer to review harvests and place orders.</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.replace('/login')}>
            <Text style={styles.loginBtnText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart ({cart.length})</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/marketplace')}>
          <Ionicons name="add" size={24} color="#15803d" />
        </TouchableOpacity>
      </View>

      {/* Free Shipping Progress Bar */}
      <View style={styles.freeShipBar}>
        <Ionicons name="car" size={18} color="#15803d" />
        {baseShipping === 0 ? (
          <Text style={styles.freeShipBarText}>
            🎉 Congratulations! You have unlocked <Text style={{ fontWeight: '800' }}>FREE SHIPPING</Text>!
          </Text>
        ) : (
          <Text style={styles.freeShipBarText}>
            Add <Text style={{ fontWeight: '800', color: '#ea580c' }}>{formatPeso(awayFromFreeShip)}</Text> more to enjoy Free Shipping!
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {cart.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 44, marginBottom: 10 }}>🧺</Text>
            <Text style={styles.emptyTitle}>Your harvest crate is empty</Text>
            <Text style={styles.emptySubtitle}>Explore over 28+ fresh fruits, vegetables, and farm staples!</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)/marketplace')}>
              <Text style={styles.browseBtnText}>Explore Harvests</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cart.map((item) => (
            <View key={item.productId} style={styles.cartCard}>
              <View style={styles.sellerHeader}>
                <Ionicons name="storefront-outline" size={14} color="#15803d" />
                <Text style={styles.sellerName}>{item.seller}</Text>
              </View>

              <View style={styles.itemRow}>
                <Image source={productPhoto(item.image)} style={styles.thumb} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.priceRow}>
                    <Text style={styles.price}>{formatPeso(item.price)}</Text>
                    <Text style={styles.unit}> / {item.unit}</Text>
                  </Text>

                  <View style={styles.actionsRow}>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateCartQuantity(item.productId, item.quantity - 1)}
                      >
                        <Text style={styles.stepText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qty}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateCartQuantity(item.productId, Math.min(item.stock, item.quantity + 1))}
                      >
                        <Text style={styles.stepText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => removeFromCart(item.productId)}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Shopee Voucher Card */}
        {cart.length > 0 && (
          <TouchableOpacity style={styles.voucherSelectCard} onPress={() => setShowVouchers(true)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="ticket-outline" size={20} color="#ea580c" />
              <View>
                <Text style={styles.voucherSelectTitle}>Platform Vouchers</Text>
                <Text style={styles.voucherSelectSub}>
                  {claimedVouchers.length > 0 ? `${claimedVouchers.length} vouchers claimed` : 'Claim free vouchers'}
                </Text>
              </View>
            </View>
            <Text style={styles.voucherSelectAction}>Select &gt;</Text>
          </TouchableOpacity>
        )}

        {/* AgriCoins Deduction Toggle */}
        {cart.length > 0 && agriCoins > 0 && (
          <View style={styles.coinsDeductCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 20 }}>🪙</Text>
              <View>
                <Text style={styles.coinsDeductTitle}>Redeem AgriCoins</Text>
                <Text style={styles.coinsDeductSub}>
                  Available: {agriCoins} coins · Save up to ₱{Math.min(agriCoins, 50)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.coinsToggle, useCoins && styles.coinsToggleActive]}
              onPress={() => setUseCoins(!useCoins)}
            >
              <Text style={[styles.coinsToggleText, useCoins && styles.coinsToggleTextActive]}>
                {useCoins ? 'Applied ✓' : 'Use'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Order Summary breakdown */}
        {cart.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({cart.length} items)</Text>
              <Text style={styles.summaryVal}>{formatPeso(cartTotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping Fee</Text>
              <Text style={[styles.summaryVal, baseShipping === 0 && styles.freeShipHighlight]}>
                {baseShipping === 0 ? 'FREE' : formatPeso(baseShipping)}
              </Text>
            </View>
            {useCoins && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>AgriCoins Discount</Text>
                <Text style={[styles.summaryVal, { color: '#ea580c' }]}>-₱{coinsDiscount}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.summaryTotalLabel}>Total Amount</Text>
              <Text style={styles.summaryTotalVal}>{formatPeso(finalTotal)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Checkout Footer */}
      {cart.length > 0 && (
        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={styles.footerTotalLabel}>Total:</Text>
              <Text style={styles.footerTotalVal}>{formatPeso(finalTotal)}</Text>
            </View>
            <Text style={styles.footerPointsText}>+{points} harvest points earned</Text>
          </View>

          <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
            <Text style={styles.checkoutBtnText}>Checkout ({cart.reduce((s, i) => s + i.quantity, 0)})</Text>
          </TouchableOpacity>
        </View>
      )}

      <VouchersModal visible={showVouchers} onClose={() => setShowVouchers(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f4ef' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, margin: 16 },
  backText: { color: '#15803d', fontWeight: '700', fontSize: 16 },
  freeShipBar: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#d1fae5',
  },
  freeShipBarText: { fontSize: 12, color: '#065f46', fontWeight: '600', flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100, gap: 12 },
  cartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  sellerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 6 },
  sellerName: { fontSize: 12, fontWeight: '800', color: '#15803d' },
  itemRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#f3f4f6' },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: 16, fontWeight: '900', color: '#ea580c' },
  unit: { fontSize: 12, color: '#6b7280' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  stepText: { fontSize: 18, fontWeight: '700', color: '#374151' },
  qty: { minWidth: 32, textAlign: 'center', fontWeight: '800', fontSize: 14 },
  voucherSelectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  voucherSelectTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  voucherSelectSub: { fontSize: 11, color: '#6b7280' },
  voucherSelectAction: { fontSize: 13, color: '#ea580c', fontWeight: '700' },
  coinsDeductCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  coinsDeductTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  coinsDeductSub: { fontSize: 11, color: '#6b7280' },
  coinsToggle: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  coinsToggleActive: { backgroundColor: '#f59e0b' },
  coinsToggleText: { fontSize: 12, fontWeight: '700', color: '#4b5563' },
  coinsToggleTextActive: { color: '#ffffff' },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: '#6b7280' },
  summaryVal: { fontSize: 14, fontWeight: '700', color: '#111827' },
  freeShipHighlight: { color: '#15803d', fontWeight: '800' },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 8, marginTop: 4 },
  summaryTotalLabel: { fontSize: 15, fontWeight: '800', color: '#111827' },
  summaryTotalVal: { fontSize: 18, fontWeight: '900', color: '#ea580c' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 36, alignItems: 'center', margin: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  emptySubtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 4 },
  browseBtn: { marginTop: 16, backgroundColor: '#15803d', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  browseBtnText: { color: '#fff', fontWeight: '800' },
  loginBtn: { marginTop: 16, backgroundColor: '#16a34a', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontWeight: '800' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerTotalLabel: { fontSize: 13, color: '#6b7280' },
  footerTotalVal: { fontSize: 20, fontWeight: '900', color: '#ea580c' },
  footerPointsText: { fontSize: 11, color: '#15803d', fontWeight: '600' },
  checkoutBtn: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  checkoutBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
});
