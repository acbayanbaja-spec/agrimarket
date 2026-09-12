import { Image, Pressable, Text, View, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import type { Product } from '../data/catalog'
import { productPhoto } from '../lib/images'
import { formatPeso, stockLabel } from '../lib/utils'
import { harvestMeta } from '../lib/commerce'
import { useCartSheet } from '../context/CartSheetContext'

export default function ProductCard({ product }: { product: Product }) {
  const { openSheet } = useCartSheet()
  const out = product.stock <= 0
  const meta = harvestMeta(product)

  return (
    <View style={styles.card}>
      <Link href={`/product/${product.id}`} asChild>
        <Pressable>
          <Image source={productPhoto(product.image)} style={styles.image} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{stockLabel(product.stock)}</Text>
          </View>
        </Pressable>
      </Link>
      <View style={styles.body}>
        <Text style={styles.category}>{product.category}</Text>
        <Link href={`/product/${product.id}`} asChild>
          <Pressable>
            <Text style={styles.name}>{product.name}</Text>
          </Pressable>
        </Link>
        <Text style={styles.copy} numberOfLines={2}>{product.description}</Text>
        <Text style={styles.meta}>
          {product.rating} ★ · {meta.sold}+ sold · {product.location}
        </Text>
        <Text style={styles.points}>+{meta.points} harvest pts · {meta.eta}</Text>
        <View style={styles.row}>
          <View>
            <Text style={styles.price}>
              {formatPeso(product.price)}
              <Text style={styles.unit}> / {product.unit}</Text>
            </Text>
            <Text style={styles.was}>{formatPeso(meta.originalPrice)}</Text>
          </View>
          <Pressable
            style={[styles.add, out && styles.addDisabled]}
            disabled={out}
            onPress={() => openSheet(product)}
          >
            <Text style={styles.addText}>{out ? 'Sold out' : 'Add'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: { width: '100%', height: 160 },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#166534' },
  body: { padding: 12, gap: 4 },
  category: { fontSize: 11, fontWeight: '700', color: '#15803d', textTransform: 'uppercase' },
  name: { fontSize: 17, fontWeight: '700', color: '#111827' },
  copy: { fontSize: 12, color: '#6b7280' },
  meta: { fontSize: 13, color: '#6b7280' },
  points: { fontSize: 12, color: '#92400e', fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  price: { fontSize: 16, fontWeight: '800', color: '#111827' },
  unit: { fontSize: 12, fontWeight: '500', color: '#6b7280' },
  was: { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' },
  add: { backgroundColor: '#16a34a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addDisabled: { backgroundColor: '#9ca3af' },
  addText: { color: '#fff', fontWeight: '700' },
})
