import React, { createContext, useContext, useMemo, useState } from 'react'
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import type { Product } from '../data/catalog'
import { harvestMeta } from '../lib/commerce'
import { formatPeso } from '../lib/utils'
import { productPhoto } from '../lib/images'
import { useStore } from './StoreContext'
import { useToast } from './ToastContext'

type CartSheetContextType = {
  openSheet: (product: Product) => void
}

const CartSheetContext = createContext<CartSheetContextType | undefined>(undefined)

function Stepper({ value, max, onChange }: { value: number; max: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepBtn} disabled={value <= 1} onPress={() => onChange(Math.max(1, value - 1))}>
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <Text style={styles.qty}>{value}</Text>
      <Pressable style={styles.stepBtn} disabled={value >= max} onPress={() => onChange(Math.min(max, value + 1))}>
        <Text style={styles.stepText}>+</Text>
      </Pressable>
    </View>
  )
}

export const CartSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToCart } = useStore()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)

  const openSheet = (next: Product) => {
    if (next.stock <= 0) return
    setProduct(next)
    setQuantity(1)
  }

  const meta = product ? harvestMeta(product) : null

  const confirm = () => {
    if (!product) return
    addToCart(product, quantity)
    toast(`Added to cart · ${product.name}`)
    setProduct(null)
  }

  const value = useMemo(() => ({ openSheet }), [])

  return (
    <CartSheetContext.Provider value={value}>
      {children}
      <Modal visible={!!product} transparent animationType="slide" onRequestClose={() => setProduct(null)}>
        <Pressable style={styles.backdrop} onPress={() => setProduct(null)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            {product && meta && (
              <>
                <View style={styles.row}>
                  <Image source={productPhoto(product.image)} style={styles.thumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.category}>{product.category}</Text>
                    <Text style={styles.name}>{product.name}</Text>
                    <Text style={styles.origin}>{meta.origin}</Text>
                    <Text style={styles.price}>{formatPeso(product.price)} / {product.unit}</Text>
                  </View>
                </View>
                <Text style={styles.copy}>{product.description}</Text>
                <Text style={styles.meta}>{meta.sold}+ sold · +{meta.points * quantity} pts · {meta.eta}</Text>
                <View style={styles.footer}>
                  <Stepper value={quantity} max={product.stock} onChange={setQuantity} />
                  <Text style={styles.total}>{formatPeso(product.price * quantity)}</Text>
                </View>
                <Pressable style={styles.confirm} onPress={confirm}>
                  <Text style={styles.confirmText}>Confirm add to cart</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </CartSheetContext.Provider>
  )
}

export const useCartSheet = () => {
  const context = useContext(CartSheetContext)
  if (!context) throw new Error('useCartSheet must be used within a CartSheetProvider')
  return context
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 10 },
  row: { flexDirection: 'row', gap: 12 },
  thumb: { width: 96, height: 96, borderRadius: 16 },
  category: { color: '#15803d', fontWeight: '800', textTransform: 'uppercase', fontSize: 11 },
  name: { fontSize: 20, fontWeight: '800', color: '#111827' },
  origin: { color: '#6b7280', marginTop: 4 },
  price: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  copy: { color: '#374151', lineHeight: 20 },
  meta: { color: '#92400e', fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden' },
  stepBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 20, fontWeight: '700' },
  qty: { minWidth: 32, textAlign: 'center', fontWeight: '700' },
  total: { fontSize: 20, fontWeight: '800' },
  confirm: { backgroundColor: '#16a34a', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  confirmText: { color: '#fff', fontWeight: '800' },
})
