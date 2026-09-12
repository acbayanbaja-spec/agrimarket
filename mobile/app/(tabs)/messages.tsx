import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useStore } from '../../src/context/StoreContext';

export default function MessagesScreen() {
  const { user, hasRole, isAuthenticated } = useAuth();
  const { messages, orders, sendSms } = useStore();
  const [body, setBody] = useState('On the way po. Please prepare payment.');
  const [notice, setNotice] = useState('');

  const relevantOrders = useMemo(() => {
    if (!user) return orders;
    if (hasRole('admin')) return orders;
    return orders.filter((order) => order.userId === user.id || order.driverId === user.id);
  }, [orders, user, hasRole]);

  const [orderId, setOrderId] = useState(relevantOrders[0]?.id || '');
  const activeOrder = relevantOrders.find((order) => order.id === orderId) || relevantOrders[0];
  const thread = messages.filter((item) => (activeOrder ? item.orderId === activeOrder.id : true));

  const send = () => {
    if (!user || !activeOrder || !body.trim()) return;
    const toBuyer = hasRole('delivery') || hasRole('admin');
    const phone = toBuyer ? activeOrder.buyerPhone : user.phone;
    const sent = sendSms({
      orderId: activeOrder.id,
      fromRole: toBuyer ? 'delivery' : 'buyer',
      fromName: `${user.firstName} ${user.lastName}`,
      fromUserId: user.id,
      toUserId: toBuyer ? activeOrder.userId : activeOrder.driverId || 4,
      phone,
      body: body.trim(),
    });
    setNotice(phone ? `SMS ${sent.status} to ${phone}` : 'Saved in-app. Add a mobile number for carrier SMS.');
    setBody('');
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>SMS inbox</Text>
        <Text style={styles.subtitle}>Log in as a buyer or rider to text about deliveries.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>SMS inbox</Text>
      <Text style={styles.subtitle}>Riders can ping the buyer’s mobile. A copy stays on this thread.</Text>
      <ScrollView horizontal style={styles.chips} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
        {relevantOrders.map((order) => (
          <Pressable
            key={order.id}
            onPress={() => setOrderId(order.id)}
            style={[styles.chip, activeOrder?.id === order.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, activeOrder?.id === order.id && styles.chipTextActive]}>
              {order.id} · {order.status}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {activeOrder && (
        <Text style={styles.meta}>
          {activeOrder.buyerName} · {activeOrder.buyerPhone || 'no phone'} · {activeOrder.address}
        </Text>
      )}
      <ScrollView style={styles.thread}>
        {thread.map((item) => (
          <View key={item.id} style={[styles.bubble, item.fromRole === 'delivery' ? styles.delivery : styles.buyer]}>
            <Text style={styles.bubbleMeta}>
              {item.fromName} · {item.channel} · {item.status}
            </Text>
            <Text>{item.body}</Text>
          </View>
        ))}
      </ScrollView>
      <TextInput style={styles.input} value={body} onChangeText={setBody} multiline />
      <Pressable style={styles.send} onPress={send}>
        <Text style={styles.sendText}>{hasRole('delivery') ? 'SMS the buyer' : 'Reply to rider'}</Text>
      </Pressable>
      {!!notice && <Text style={styles.notice}>{notice}</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 6, marginBottom: 8 },
  chips: { maxHeight: 48 },
  chip: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  chipText: { color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  meta: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  thread: { flex: 1, marginBottom: 8 },
  bubble: { borderRadius: 16, padding: 12, marginBottom: 8 },
  delivery: { backgroundColor: '#dcfce7' },
  buyer: { backgroundColor: '#fff' },
  bubbleMeta: { fontSize: 11, color: '#6b7280', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderRadius: 12, minHeight: 72, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  send: { backgroundColor: '#16a34a', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  sendText: { color: '#fff', fontWeight: '700' },
  notice: { marginTop: 8, color: '#166534' },
});
