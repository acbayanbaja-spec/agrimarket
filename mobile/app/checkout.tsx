import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useStore } from '../src/context/StoreContext';
import { formatPeso } from '../src/lib/utils';
import { pointsFromSpend } from '../src/lib/commerce';

export default function CheckoutScreen() {
  const { isAuthenticated } = useAuth();
  const { cart, cartTotal, placeOrder, loyaltyPoints } = useStore();
  const [address, setAddress] = useState('12 Mabini St, Quezon City');
  const [payment, setPayment] = useState<'GCash' | 'Cash on delivery'>('Cash on delivery');
  const [usePoints, setUsePoints] = useState(true);
  const [notice, setNotice] = useState('');

  const shippingFee = cartTotal >= 300 ? 0 : 50;
  const redeemed = usePoints ? Math.min(loyaltyPoints, shippingFee) : 0;
  const total = cartTotal + Math.max(0, shippingFee - redeemed);
  const earned = pointsFromSpend(cartTotal);

  const submit = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const order = placeOrder({ address, payment, usePoints });
    if (order) {
      setNotice(`${order.id} placed. +${order.pointsEarned} pts, used ${order.pointsRedeemed} on shipping.`);
      setTimeout(() => router.replace('/(tabs)/orders'), 700);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
      <Text style={styles.title}>Checkout</Text>
      <Text style={styles.meta}>{cart.length} items · {formatPeso(total)}</Text>
      <Text style={styles.label}>Drop-off address</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} />
      <Text style={styles.label}>Payment</Text>
      <View style={styles.row}>
        {(['Cash on delivery', 'GCash'] as const).map((method) => (
          <Pressable
            key={method}
            onPress={() => setPayment(method)}
            style={[styles.chip, payment === method && styles.chipActive]}
          >
            <Text style={[styles.chipText, payment === method && styles.chipTextActive]}>{method}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.pointsBox} onPress={() => setUsePoints((value) => !value)}>
        <Text style={styles.pointsTitle}>{usePoints ? '✓' : '○'} Apply harvest points to shipping</Text>
        <Text style={styles.pointsCopy}>Wallet {loyaltyPoints} pts · use {redeemed} now · earn {earned} after this order</Text>
      </Pressable>
      <Pressable style={styles.submit} onPress={submit} disabled={cart.length === 0}>
        <Text style={styles.submitText}>{isAuthenticated ? `Place order · ${formatPeso(total)}` : 'Login to place order'}</Text>
      </Pressable>
      {!!notice && <Text style={styles.notice}>{notice}</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  back: { color: '#15803d', fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800' },
  meta: { color: '#6b7280', marginBottom: 16 },
  label: { fontWeight: '700', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  chipText: { fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#fff' },
  pointsBox: { backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, marginBottom: 16 },
  pointsTitle: { fontWeight: '800', color: '#92400e' },
  pointsCopy: { color: '#78350f', marginTop: 4 },
  submit: { backgroundColor: '#16a34a', borderRadius: 12, padding: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '800' },
  notice: { marginTop: 12, color: '#166534' },
});
