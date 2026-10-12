import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../src/context/AuthContext';
import { useStore, type Order } from '../../src/context/StoreContext';
import { formatPeso } from '../../src/lib/utils';
import { productPhoto } from '../../src/lib/images';
import OrderTimeline from '../../src/components/OrderTimeline';

const orderTabs = [
  'All',
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Shipped',
  'Out for delivery',
  'Delivered',
] as const;

export default function OrdersScreen() {
  const { user, hasRole, isAuthenticated } = useAuth();
  const { orders, updateOrderStatus, confirmOrder, markShipped, sendSms, messages, applications, reviewApplication } = useStore();
  const [selectedTab, setSelectedTab] = useState<string>('All');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState<Record<string, string>>({});

  const mine = useMemo(() => {
    if (!user) return [];
    let list = orders;
    if (hasRole('delivery')) {
      list = orders.filter((order) => order.driverId === user.id && order.status !== 'Pending');
    } else if (hasRole('seller') && !hasRole('admin')) {
      list = orders.filter((order) =>
        order.items.some((item) => item.sellerUserId === user.id || item.sellerId === 'seller-1')
      );
    } else if (!hasRole('admin')) {
      list = orders.filter((order) => order.userId === user.id);
    }

    if (selectedTab !== 'All') {
      list = list.filter((o) => o.status.toLowerCase() === selectedTab.toLowerCase());
    }
    return list;
  }, [orders, user, hasRole, selectedTab]);

  const pingBuyer = (order: Order) => {
    const body = notes[order.id] || 'Good day po! Your harvest is out for delivery.';
    if (!order.buyerPhone) {
      setFlash((current) => ({ ...current, [order.id]: 'No buyer mobile on this order.' }));
      return;
    }
    const sent = sendSms({
      orderId: order.id,
      fromRole: 'delivery',
      fromName: user ? `${user.firstName} ${user.lastName}` : 'Rider',
      fromUserId: user?.id,
      toUserId: order.userId,
      phone: order.buyerPhone,
      body,
    });
    if (order.status === 'Confirmed' || order.status === 'Shipped') {
      updateOrderStatus(order.id, 'Out for delivery');
    }
    setFlash((current) => ({ ...current, [order.id]: `SMS ${sent.status} to ${order.buyerPhone}` }));
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestBox}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>📦</Text>
          <Text style={styles.title}>Track Your Harvest Orders</Text>
          <Text style={styles.subtitle}>Please log in to track deliveries, view receipts, and communicate with riders.</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
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
        <View>
          <Text style={styles.title}>
            {hasRole('delivery') ? 'Courier Delivery Desk' : hasRole('seller') ? 'Farmer Orders Desk' : 'My Harvest Orders'}
          </Text>
          <Text style={styles.subtitle}>
            {hasRole('delivery')
              ? 'Pick up confirmed crates & notify buyers via SMS.'
              : hasRole('seller')
              ? 'Confirm harvest orders to trigger courier dispatch.'
              : 'Direct farm orders across SOCCSKSARGEN.'}
          </Text>
        </View>
      </View>

      {/* Shopee-style Status Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
        {orderTabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabChip, selectedTab === tab && styles.tabChipActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabChipText, selectedTab === tab && styles.tabChipTextActive]}>
              {tab === 'All' ? 'All Orders' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Admin Pending Farmer Applications */}
      {hasRole('admin') &&
        applications.filter((item) => item.status === 'Pending').map((application) => (
          <View key={application.id} style={styles.adminCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminTitle}>🚜 Seller Application: {application.farmName}</Text>
              <Text style={styles.adminMeta}>Location: {application.location} · {application.idType} #{application.idNumber}</Text>
            </View>
            <TouchableOpacity style={styles.approveBtn} onPress={() => reviewApplication(application.id, 'Approved')}>
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          </View>
        ))}

      {/* Orders List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {mine.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🧺</Text>
            <Text style={styles.emptyTitle}>No orders found in this tab</Text>
            <Text style={styles.emptySubtitle}>Browse the marketplace to discover fresh harvests today!</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/marketplace')}>
              <Text style={styles.shopBtnText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          mine.map((order) => {
            const last = messages.filter((item) => item.orderId === order.id).slice(-1)[0];
            const isDelivered = order.status === 'Delivered';
            const isTransit = order.status === 'Out for delivery';
            const isShipped = order.status === 'Shipped';
            const isConfirmed = order.status === 'Confirmed';

            return (
              <View key={order.id} style={styles.orderCard}>
                {/* Card Top: Order ID & Status Badge */}
                <View style={styles.orderCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="receipt-outline" size={16} color="#15803d" />
                    <Text style={styles.orderId}>{order.id}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      isDelivered ? styles.statusDelivered : isTransit ? styles.statusTransit : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isDelivered ? styles.statusTextDelivered : isTransit ? styles.statusTextTransit : styles.statusTextPending,
                      ]}
                    >
                      {order.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Order Timeline with 6 milestones and audit trail */}
                <OrderTimeline order={order} />

                {/* Order Items */}
                <View style={styles.itemsList}>
                  {order.items.map((item) => (
                    <View key={item.productId} style={styles.itemRow}>
                      <Image source={productPhoto(item.image)} style={styles.itemImage} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemSeller}>Seller: {item.seller}</Text>
                        <Text style={styles.itemQtyPrice}>{item.quantity}× {formatPeso(item.price)}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Delivery & Payment Meta */}
                <View style={styles.orderFooter}>
                  <View>
                    <Text style={styles.deliveryAddr} numberOfLines={1}>📍 {order.address}</Text>
                    <Text style={styles.paymentMethod}>Payment: {order.payment}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.totalLabel}>Order Total:</Text>
                    <Text style={styles.totalAmount}>{formatPeso(order.total)}</Text>
                  </View>
                </View>

                {/* Last SMS alert */}
                {last && (
                  <View style={styles.smsBox}>
                    <Ionicons name="chatbubble" size={14} color="#15803d" />
                    <Text style={styles.smsText}>Rider SMS: "{last.body}"</Text>
                  </View>
                )}

                {/* Seller Actions */}
                {hasRole('seller') && order.status === 'Pending' && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => confirmOrder(order.id)}>
                    <Text style={styles.actionBtnText}>Confirm Harvest & Notify Courier</Text>
                  </TouchableOpacity>
                )}
                {hasRole('seller') && order.status === 'Confirmed' && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => updateOrderStatus(order.id, 'Preparing')}>
                    <Text style={styles.actionBtnText}>Start Packing Crates (Preparing)</Text>
                  </TouchableOpacity>
                )}
                {hasRole('seller') && order.status === 'Preparing' && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => updateOrderStatus(order.id, 'Ready for Pickup')}>
                    <Text style={styles.actionBtnText}>Mark Ready for Courier Collection</Text>
                  </TouchableOpacity>
                )}
                {hasRole('seller') && order.status === 'Ready for Pickup' && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => markShipped(order.id)}>
                    <Text style={styles.actionBtnText}>Hand Over to Courier (Mark Shipped)</Text>
                  </TouchableOpacity>
                )}

                {/* Delivery Rider Actions */}
                {hasRole('delivery') && (
                  <View style={styles.deliveryActionBox}>
                    <TextInput
                      style={styles.notesInput}
                      value={notes[order.id] ?? 'Good day po! Your harvest is out for delivery.'}
                      onChangeText={(val) => setNotes((prev) => ({ ...prev, [order.id]: val }))}
                    />
                    <TouchableOpacity style={styles.actionBtn} onPress={() => pingBuyer(order)}>
                      <Text style={styles.actionBtnText}>Send SMS to Buyer ({order.buyerPhone || 'No Phone'})</Text>
                    </TouchableOpacity>
                    {order.status === 'Out for delivery' ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#15803d', marginTop: 6 }]}
                        onPress={() => updateOrderStatus(order.id, 'Delivered')}
                      >
                        <Text style={styles.actionBtnText}>✓ Confirm Delivered & Handover</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#0284c7', marginTop: 6 }]}
                        onPress={() => updateOrderStatus(order.id, 'Out for delivery')}
                      >
                        <Text style={styles.actionBtnText}>Pick Up & Depart (Out for Delivery)</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {flash[order.id] && <Text style={styles.flashNote}>{flash[order.id]}</Text>}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f4ef' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 22, fontWeight: '900', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  tabsScroll: { maxHeight: 50, backgroundColor: '#fff' },
  tabsRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  tabChipActive: { backgroundColor: '#15803d' },
  tabChipText: { fontSize: 13, fontWeight: '700', color: '#4b5563' },
  tabChipTextActive: { color: '#fff' },
  listContent: { padding: 16, paddingBottom: 80, gap: 14 },
  guestBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loginBtn: { marginTop: 16, backgroundColor: '#16a34a', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  adminCard: {
    margin: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  adminTitle: { fontSize: 14, fontWeight: '800', color: '#92400e' },
  adminMeta: { fontSize: 12, color: '#b45309', marginTop: 2 },
  approveBtn: { backgroundColor: '#16a34a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  approveBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#1f2937' },
  emptySubtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 4 },
  shopBtn: { marginTop: 16, backgroundColor: '#15803d', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  shopBtnText: { color: '#fff', fontWeight: '800' },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    gap: 12,
  },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 14, fontWeight: '800', color: '#111827' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusPending: { backgroundColor: '#fef3c7' },
  statusTransit: { backgroundColor: '#e0e7ff' },
  statusDelivered: { backgroundColor: '#dcfce7' },
  statusPillText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  statusTextPending: { color: '#b45309' },
  statusTextTransit: { color: '#4338ca' },
  statusTextDelivered: { color: '#15803d' },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#d1d5db' },
  stepDotActive: { backgroundColor: '#15803d' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e5e7eb' },
  stepLineActive: { backgroundColor: '#15803d' },
  stepperLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  stepperLabel: { fontSize: 10, color: '#6b7280', fontWeight: '600' },
  itemsList: { gap: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemImage: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#f3f4f6' },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  itemSeller: { fontSize: 11, color: '#6b7280' },
  itemQtyPrice: { fontSize: 12, fontWeight: '700', color: '#ea580c', marginTop: 2 },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  deliveryAddr: { fontSize: 11, color: '#6b7280', maxWidth: 180 },
  paymentMethod: { fontSize: 11, color: '#15803d', fontWeight: '700', marginTop: 2 },
  totalLabel: { fontSize: 11, color: '#6b7280' },
  totalAmount: { fontSize: 18, fontWeight: '900', color: '#ea580c' },
  smsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
  },
  smsText: { fontSize: 12, color: '#166534', flex: 1 },
  actionBtn: { backgroundColor: '#15803d', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  deliveryActionBox: { gap: 6, marginTop: 4 },
  notesInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
  },
  flashNote: { color: '#15803d', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
