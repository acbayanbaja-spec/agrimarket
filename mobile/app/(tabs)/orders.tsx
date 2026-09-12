import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useStore, type Order } from '../../src/context/StoreContext';
import { formatPeso } from '../../src/lib/utils';

const statuses: Order['status'][] = ['Pending', 'Confirmed', 'Shipped', 'Out for delivery', 'Delivered'];

export default function OrdersScreen() {
  const { user, hasRole, isAuthenticated } = useAuth();
  const { orders, updateOrderStatus, sendSms, messages } = useStore();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState<Record<string, string>>({});

  const mine = useMemo(() => {
    if (!user) return [];
    if (hasRole('admin')) return orders;
    if (hasRole('delivery')) return orders.filter((order) => order.driverId === user.id);
    return orders.filter((order) => order.userId === user.id);
  }, [orders, user, hasRole]);

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
    if (order.status === 'Pending' || order.status === 'Confirmed' || order.status === 'Shipped') {
      updateOrderStatus(order.id, 'Out for delivery');
    }
    setFlash((current) => ({ ...current, [order.id]: `SMS ${sent.status} to ${order.buyerPhone}` }));
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.subtitle}>Log in to track crates and rider SMS.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{hasRole('delivery') ? 'Delivery desk' : 'My orders'}</Text>
      <Text style={styles.subtitle}>
        {hasRole('delivery') ? 'Update status and SMS buyers with ETAs.' : 'COD, GCash, and live delivery status.'}
      </Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {mine.length === 0 && <Text style={styles.subtitle}>No orders yet.</Text>}
        {mine.map((order) => {
          const last = messages.filter((item) => item.orderId === order.id).slice(-1)[0];
          return (
            <View key={order.id} style={styles.card}>
              <Text style={styles.orderId}>{order.id} · {order.status}</Text>
              <Text style={styles.meta}>{order.buyerName} · {order.address}</Text>
              <Text style={styles.meta}>{formatPeso(order.total)} · {order.payment}</Text>
              {order.items.map((item) => (
                <Text key={item.productId} style={styles.item}>
                  {item.quantity}× {item.name}
                </Text>
              ))}
              {last && <Text style={styles.sms}>Last SMS: {last.body}</Text>}
              {hasRole('delivery') && (
                <>
                  <View style={styles.statusRow}>
                    {statuses.map((status) => (
                      <Pressable
                        key={status}
                        onPress={() => updateOrderStatus(order.id, status)}
                        style={[styles.statusChip, order.status === status && styles.statusActive]}
                      >
                        <Text style={[styles.statusText, order.status === status && styles.statusTextActive]}>{status}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    value={notes[order.id] ?? 'Good day po! Your harvest is out for delivery.'}
                    onChangeText={(value) => setNotes((current) => ({ ...current, [order.id]: value }))}
                  />
                  <Pressable style={styles.smsBtn} onPress={() => pingBuyer(order)}>
                    <Text style={styles.smsBtnText}>SMS buyer</Text>
                  </Pressable>
                </>
              )}
              {flash[order.id] && <Text style={styles.flash}>{flash[order.id]}</Text>}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 6, marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  orderId: { fontWeight: '800', fontSize: 16 },
  meta: { color: '#6b7280', marginTop: 4 },
  item: { marginTop: 6, color: '#111827' },
  sms: { marginTop: 8, color: '#166534' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  statusChip: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusActive: { backgroundColor: '#14532d', borderColor: '#14532d' },
  statusText: { fontSize: 11, color: '#374151' },
  statusTextActive: { color: '#fff' },
  input: { marginTop: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10 },
  smsBtn: { marginTop: 8, backgroundColor: '#16a34a', borderRadius: 10, padding: 12, alignItems: 'center' },
  smsBtnText: { color: '#fff', fontWeight: '700' },
  flash: { marginTop: 8, color: '#166534' },
});
