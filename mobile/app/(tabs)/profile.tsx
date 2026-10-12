import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../src/context/AuthContext';
import { useStore } from '../../src/context/StoreContext';
import { setCustomApiBaseUrl, getApiBaseUrl } from '../../src/services/api';
import VouchersModal from '../../src/components/VouchersModal';
import CoinsCheckinModal from '../../src/components/CoinsCheckinModal';
import AiAssistantModal from '../../src/components/AiAssistantModal';

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  const { loyaltyPoints, agriCoins, claimedVouchers, orders, isOnline, apiLatency } = useStore();

  const [showVouchers, setShowVouchers] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState('');

  const openServerModal = async () => {
    const current = await getApiBaseUrl();
    setCustomServerUrl(current);
    setShowServerModal(true);
  };

  const saveServerUrl = async () => {
    await setCustomApiBaseUrl(customServerUrl);
    setShowServerModal(false);
    Alert.alert('Server Updated', 'Mobile app will now connect to: ' + customServerUrl);
  };

  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
  const shippingOrders = orders.filter((o) => o.status === 'Confirmed' || o.status === 'Shipped').length;
  const deliveryOrders = orders.filter((o) => o.status === 'Out for delivery').length;
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.guestContainer}>
          <View style={styles.guestHero}>
            <View style={styles.guestIconCircle}>
              <Ionicons name="person" size={40} color="#15803d" />
            </View>
            <Text style={styles.guestTitle}>Welcome to AgriMarket!</Text>
            <Text style={styles.guestSubtitle}>
              Log in or create an account to track deliveries, earn AgriCoins, and connect with direct farm producers across SOCCSKSARGEN.
            </Text>
            <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
              <Text style={styles.loginBtnText}>Log In / Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card Header */}
        <View style={styles.userCard}>
          <View style={styles.userTopRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <View style={styles.memberTag}>
                  <Text style={styles.memberTagText}>⭐ GOLD MEMBER</Text>
                </View>
              </View>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={styles.userRoles}>{user?.roles.join(' · ').toUpperCase()} · {user?.phone || 'No phone set'}</Text>
            </View>
          </View>

          {/* Connection Status Pill */}
          <TouchableOpacity style={styles.networkStatusPill} onPress={openServerModal}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22c55e' : '#f59e0b' }]} />
            <Text style={styles.networkStatusText}>
              {isOnline ? `Online Backend (Latency: ${apiLatency}ms)` : 'Offline Local Cache'} · Tap to configure server
            </Text>
          </TouchableOpacity>
        </View>

        {/* Financial Wallets (Shopee-Style Grid) */}
        <View style={styles.walletsRow}>
          <TouchableOpacity style={styles.walletItem} onPress={() => setShowCoins(true)}>
            <View style={styles.walletIconCircle}>
              <Text style={{ fontSize: 20 }}>🪙</Text>
            </View>
            <Text style={styles.walletNum}>{agriCoins}</Text>
            <Text style={styles.walletLabel}>AgriCoins</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.walletItem} onPress={() => setShowVouchers(true)}>
            <View style={[styles.walletIconCircle, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="ticket" size={20} color="#15803d" />
            </View>
            <Text style={styles.walletNum}>{claimedVouchers.length}</Text>
            <Text style={styles.walletLabel}>Vouchers</Text>
          </TouchableOpacity>

          <View style={styles.walletItem}>
            <View style={[styles.walletIconCircle, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="sparkles" size={20} color="#d97706" />
            </View>
            <Text style={styles.walletNum}>{loyaltyPoints}</Text>
            <Text style={styles.walletLabel}>Harvest Pts</Text>
          </View>
        </View>

        {/* My Orders Stepper (Shopee Signature) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Purchases</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
              <Text style={styles.sectionAction}>View Order History &gt;</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.orderStepsRow}>
            <TouchableOpacity style={styles.orderStepItem} onPress={() => router.push('/(tabs)/orders')}>
              <View style={styles.orderIconWrap}>
                <Ionicons name="wallet-outline" size={24} color="#374151" />
                {pendingOrders > 0 && (
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>{pendingOrders}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.orderStepLabel}>To Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.orderStepItem} onPress={() => router.push('/(tabs)/orders')}>
              <View style={styles.orderIconWrap}>
                <Ionicons name="cube-outline" size={24} color="#374151" />
                {shippingOrders > 0 && (
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>{shippingOrders}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.orderStepLabel}>To Ship</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.orderStepItem} onPress={() => router.push('/(tabs)/orders')}>
              <View style={styles.orderIconWrap}>
                <Ionicons name="car-outline" size={24} color="#374151" />
                {deliveryOrders > 0 && (
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>{deliveryOrders}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.orderStepLabel}>To Receive</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.orderStepItem} onPress={() => router.push('/(tabs)/orders')}>
              <View style={styles.orderIconWrap}>
                <Ionicons name="star-outline" size={24} color="#374151" />
                {deliveredOrders > 0 && (
                  <View style={[styles.orderBadge, { backgroundColor: '#15803d' }]}>
                    <Text style={styles.orderBadgeText}>{deliveredOrders}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.orderStepLabel}>Completed</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => setShowAiModal(true)}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="sparkles" size={18} color="#4338ca" />
              </View>
              <Text style={styles.menuTitle}>AgriKaibigan AI (Gemini Universal Chat)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/seller')}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="storefront" size={18} color="#15803d" />
              </View>
              <Text style={styles.menuTitle}>Seller Desk / Post New Harvest</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/analytics' as any)}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="bar-chart" size={18} color="#15803d" />
              </View>
              <Text style={styles.menuTitle}>Marketplace Analytics & Reports</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/become-seller')}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#d97706" />
              </View>
              <Text style={styles.menuTitle}>Verified Farmer Producer Application</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={openServerModal}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#f3f4f6' }]}>
                <Ionicons name="server" size={18} color="#4b5563" />
              </View>
              <Text style={styles.menuTitle}>Server Network & Online API Config</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={async () => {
              await logout();
              router.replace('/login');
            }}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="log-out" size={18} color="#dc2626" />
              </View>
              <Text style={[styles.menuTitle, { color: '#dc2626' }]}>Log Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Server Config Modal */}
      <Modal visible={showServerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.serverCard}>
            <Text style={styles.serverTitle}>Server & Network Config</Text>
            <Text style={styles.serverSubtitle}>
              Specify your central backend API host (e.g., http://192.168.1.15:5000 or production URL).
            </Text>
            <TextInput
              style={styles.serverInput}
              value={customServerUrl}
              onChangeText={setCustomServerUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://localhost:5000"
            />
            <View style={styles.serverBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowServerModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveServerUrl}>
                <Text style={styles.modalSaveText}>Save & Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <VouchersModal visible={showVouchers} onClose={() => setShowVouchers(false)} />
      <CoinsCheckinModal visible={showCoins} onClose={() => setShowCoins(false)} />
      <AiAssistantModal visible={showAiModal} onClose={() => setShowAiModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f4ef' },
  scrollContent: { padding: 16, paddingBottom: 80, gap: 14 },
  guestContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  guestHero: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 3,
  },
  guestIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  guestSubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  loginBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  userTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  userName: { fontSize: 18, fontWeight: '800', color: '#111827' },
  memberTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  memberTagText: { color: '#b45309', fontSize: 9, fontWeight: '900' },
  userEmail: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  userRoles: { fontSize: 11, color: '#15803d', fontWeight: '700', marginTop: 2 },
  networkStatusPill: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  networkStatusText: { fontSize: 12, color: '#4b5563', fontWeight: '600', flex: 1 },
  walletsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  walletItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  walletIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  walletNum: { fontSize: 16, fontWeight: '800', color: '#111827' },
  walletLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  sectionAction: { fontSize: 12, color: '#15803d', fontWeight: '700' },
  orderStepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  orderStepItem: { alignItems: 'center', flex: 1 },
  orderIconWrap: { position: 'relative', marginBottom: 6 },
  orderBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#dc2626',
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  orderBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  orderStepLabel: { fontSize: 11, fontWeight: '600', color: '#4b5563' },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  menuIconCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  menuTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  serverCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  serverTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  serverSubtitle: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  serverInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  serverBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  modalCancelText: { color: '#6b7280', fontWeight: '600' },
  modalSaveBtn: { backgroundColor: '#16a34a', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  modalSaveText: { color: '#fff', fontWeight: '700' },
});
