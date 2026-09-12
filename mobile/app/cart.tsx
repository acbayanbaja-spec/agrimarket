import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '../src/context/StoreContext';
import { productPhoto } from '../src/lib/images';
import { formatPeso } from '../src/lib/utils';
import { pointsFromSpend } from '../src/lib/commerce';

export default function CartScreen() {
  const { cart, cartTotal, removeFromCart, updateCartQuantity } = useStore();
  const shipping = cartTotal >= 300 ? 0 : 50;
  const points = pointsFromSpend(cartTotal);

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
      <Text style={styles.title}>Cart</Text>
      <ScrollView>
        {cart.length === 0 && <Text style={styles.empty}>Your crate is empty. Browse the marketplace first.</Text>}
        {cart.map((item) => (
          <View key={item.productId} style={styles.row}>
            <Image source={productPhoto(item.image)} style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{formatPeso(item.price)} / {item.unit}</Text>
              <View style={styles.stepper}>
                <Pressable onPress={() => updateCartQuantity(item.productId, item.quantity - 1)}><Text style={styles.stepText}>−</Text></Pressable>
                <Text style={styles.qty}>{item.quantity}</Text>
                <Pressable onPress={() => updateCartQuantity(item.productId, Math.min(item.stock, item.quantity + 1))}><Text style={styles.stepText}>+</Text></Pressable>
              </View>
            </View>
            <Pressable onPress={() => removeFromCart(item.productId)}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
      {cart.length > 0 && (
        <View style={styles.footer}>
          <View>
            <Text style={styles.total}>{formatPeso(cartTotal + shipping)}</Text>
            <Text style={styles.points}>+{points} pts · shipping {shipping ? formatPeso(shipping) : 'free'}</Text>
          </View>
          <Pressable style={styles.checkout} onPress={() => router.push('/checkout')}>
            <Text style={styles.checkoutText}>Checkout</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  back: { color: '#15803d', fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16 },
  empty: { color: '#6b7280' },
  row: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  name: { fontWeight: '700' },
  meta: { color: '#6b7280', marginTop: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  stepText: { fontSize: 20, fontWeight: '700' },
  qty: { fontWeight: '700', minWidth: 18, textAlign: 'center' },
  remove: { color: '#dc2626', fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  total: { fontSize: 22, fontWeight: '800' },
  points: { color: '#92400e', fontWeight: '600', marginTop: 4 },
  checkout: { backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12 },
  checkoutText: { color: '#fff', fontWeight: '800' },
});
