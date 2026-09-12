import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useStore } from '../src/context/StoreContext';
import { formatPeso } from '../src/lib/utils';

export default function CheckoutScreen() {
  const { isAuthenticated } = useAuth();
  const { cart, cartTotal, placeOrder } = useStore();
  const [address, setAddress] = useState('12 Mabini St, Quezon City');
  const [payment, setPayment] = useState<'GCash' | 'Cash on delivery'>('Cash on delivery');
  const [notice, setNotice] = useState('');

  const submit = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const order = placeOrder({ address, payment });
    if (order) {
      setNotice(`${order.id} placed. A rider can SMS you on the way.`);
      setTimeout(() => router.replace('/(tabs)/orders'), 600);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
      <Text style={styles.title}>Checkout</Text>
      <Text style={styles.meta}>{cart.length} items · {formatPeso(cartTotal)} + shipping if under ₱300</Text>
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
      <Pressable style={styles.submit} onPress={submit} disabled={cart.length === 0}>
        <Text style={styles.submitText}>{isAuthenticated ? 'Place order' : 'Login to place order'}</Text>
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
  row: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  chip: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  chipText: { fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#fff' },
  submit: { backgroundColor: '#16a34a', borderRadius: 12, padding: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '800' },
  notice: { marginTop: 12, color: '#166534' },
});
