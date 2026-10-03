import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useStore } from '../src/context/StoreContext';
import { formatPeso } from '../src/lib/utils';

export default function SellerScreen() {
  const { user, hasRole } = useAuth();
  const { orders, confirmOrder, markShipped, addPost, products } = useStore();
  const [body, setBody] = useState('');
  const mine = orders.filter((order) => order.items.some((item) => item.sellerUserId === user?.id || (user?.email === 'seller@agrimarket.com' && item.sellerId === 'seller-1')));
  const listings = products.filter((product) => product.sellerUserId === user?.id || (user?.email === 'seller@agrimarket.com' && product.sellerId === 'seller-1'));

  if (!hasRole('seller') && !hasRole('admin')) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Seller desk</Text>
        <Text style={styles.copy}>Apply with a valid ID first.</Text>
        <Pressable style={styles.primary} onPress={() => router.push('/become-seller')}><Text style={styles.primaryText}>Become a seller</Text></Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
        <Text style={styles.title}>Seller desk</Text>
        <Text style={styles.copy}>Confirm orders to notify the rider. Mark shipped when they collect the crate.</Text>
        <TextInput style={styles.input} placeholder="Share a harvest feed post" value={body} onChangeText={setBody} />
        <Pressable
          style={styles.primary}
          onPress={() => {
            if (!body.trim()) return;
            addPost({ body: body.trim(), category: listings[0]?.category || 'Vegetables', productId: listings[0]?.id, productName: listings[0]?.name });
            setBody('');
          }}
        >
          <Text style={styles.primaryText}>Post to product feed</Text>
        </Pressable>
        {listings.map((product) => (
          <Text key={product.id} style={styles.listing}>{product.name} · {product.location}</Text>
        ))}
        {mine.map((order) => (
          <View key={order.id} style={styles.card}>
            <Text style={styles.orderId}>{order.id} · {order.status}</Text>
            <Text style={styles.meta}>{order.buyerName} · {order.buyerPhone} · {order.address}</Text>
            {order.items.map((item) => (
              <Text key={item.productId} style={styles.meta}>{item.quantity}× {item.name} · pickup {item.pickupLocation}</Text>
            ))}
            <Text style={styles.meta}>{formatPeso(order.total)}</Text>
            {order.status === 'Pending' && (
              <Pressable style={styles.primary} onPress={() => confirmOrder(order.id)}>
                <Text style={styles.primaryText}>Confirm & notify rider</Text>
              </Pressable>
            )}
            {order.status === 'Confirmed' && (
              <Pressable style={styles.primary} onPress={() => markShipped(order.id)}>
                <Text style={styles.primaryText}>Rider collected · mark shipped</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f4ef', padding: 16 },
  back: { color: '#15803d', fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#14532d' },
  copy: { color: '#6b7280', marginVertical: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 8 },
  primary: { backgroundColor: '#16a34a', borderRadius: 12, padding: 14, alignItems: 'center', marginVertical: 8 },
  primaryText: { color: '#fff', fontWeight: '800' },
  listing: { color: '#374151', marginBottom: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginTop: 10 },
  orderId: { fontWeight: '800' },
  meta: { color: '#6b7280', marginTop: 4 },
});
