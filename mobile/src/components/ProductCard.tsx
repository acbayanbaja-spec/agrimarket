import React from 'react'
import { Image, Pressable, Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { Link } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { Product } from '../data/catalog'
import { productPhoto } from '../lib/images'
import { formatPeso, stockLabel } from '../lib/utils'
import { harvestMeta } from '../lib/commerce'
import { useCartSheet } from '../context/CartSheetContext'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'

export default function ProductCard({
  product,
  compact = false,
}: {
  product: Product
  compact?: boolean
}) {
  const { openSheet } = useCartSheet()
  const { hasRole } = useAuth()
  const { toggleWishlist, isWishlisted } = useStore()
  const isAdmin = hasRole('admin')
  const out = product.stock <= 0
  const meta = harvestMeta(product)
  const favorited = isWishlisted(product.id)

  const discountPercent = Math.max(10, Math.round(((meta.originalPrice - product.price) / meta.originalPrice) * 100))

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      {/* Product Image & Badges */}
      <Link href={`/product/${product.id}`} asChild>
        <Pressable style={styles.imageContainer}>
          <Image source={productPhoto(product.image)} style={styles.image} resizeMode="cover" />

          {/* Stock Badge */}
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>{stockLabel(product.stock)}</Text>
          </View>

          {/* Shopee Discount Tag */}
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>

          {/* Wishlist Heart Icon */}
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={(e) => {
              e.stopPropagation()
              toggleWishlist(product.id)
            }}
          >
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={18}
              color={favorited ? '#ef4444' : '#ffffff'}
            />
          </TouchableOpacity>
        </Pressable>
      </Link>

      {/* Body Information */}
      <View style={styles.body}>
        {/* Mall / Preferred Seller + Category */}
        <View style={styles.tagRow}>
          <View style={styles.mallBadge}>
            <Text style={styles.mallText}>MALL</Text>
          </View>
          {product.organic && (
            <View style={styles.organicBadge}>
              <Text style={styles.organicText}>🌿 Organic</Text>
            </View>
          )}
          <Text style={styles.category} numberOfLines={1}>{product.category}</Text>
        </View>

        {/* Product Title */}
        <Link href={`/product/${product.id}`} asChild>
          <Pressable>
            <Text style={styles.name} numberOfLines={compact ? 1 : 2}>
              {product.name}
            </Text>
          </Pressable>
        </Link>

        {/* Description */}
        {!compact && (
          <Text style={styles.copy} numberOfLines={2}>
            {product.description}
          </Text>
        )}

        {/* Rating, Sold Count & Location */}
        <View style={styles.metaRow}>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={13} color="#f59e0b" />
            <Text style={styles.ratingText}>{product.rating}</Text>
          </View>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.soldText}>{meta.sold}+ sold</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {product.location.split(',')[0]}
          </Text>
        </View>

        {/* Free Shipping Pill */}
        <View style={styles.freeShipPill}>
          <Ionicons name="car-outline" size={12} color="#059669" />
          <Text style={styles.freeShipText}>Free Ship ₱300+</Text>
        </View>

        {/* Price & Action Row */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.price}>
              {formatPeso(product.price)}
              <Text style={styles.unit}> / {product.unit}</Text>
            </Text>
            <Text style={styles.wasPrice}>{formatPeso(meta.originalPrice)}</Text>
          </View>

          {isAdmin ? (
            <View style={styles.manageBtn}>
              <Text style={styles.manageBtnText}>Manage</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addBtn, out && styles.addBtnDisabled]}
              disabled={out}
              onPress={() => openSheet(product)}
            >
              <Text style={styles.addBtnText}>{out ? 'Sold out' : '+ Cart'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  compactCard: {
    marginBottom: 10,
  },
  imageContainer: {
    width: '100%',
    height: 168,
    position: 'relative',
    backgroundColor: '#f3f4f6',
  },
  image: { width: '100%', height: '100%' },
  stockBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stockBadgeText: { fontSize: 11, fontWeight: '700', color: '#166534' },
  discountBadge: {
    position: 'absolute',
    top: 10,
    right: 48,
    backgroundColor: '#ea580c',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  discountText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { padding: 12, gap: 5 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'nowrap' },
  mallBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  mallText: { color: '#ffffff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  organicBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  organicText: { color: '#059669', fontSize: 10, fontWeight: '700' },
  category: { fontSize: 11, fontWeight: '700', color: '#15803d', textTransform: 'uppercase' },
  name: { fontSize: 16, fontWeight: '800', color: '#111827', lineHeight: 21 },
  copy: { fontSize: 12, color: '#6b7280', lineHeight: 17 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  dot: { color: '#9ca3af', fontSize: 12 },
  soldText: { fontSize: 12, color: '#4b5563', fontWeight: '500' },
  locationText: { fontSize: 11, color: '#6b7280', flexShrink: 1 },
  freeShipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  freeShipText: { fontSize: 10, fontWeight: '700', color: '#059669' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f9fafb',
  },
  price: { fontSize: 17, fontWeight: '900', color: '#ea580c' },
  unit: { fontSize: 12, fontWeight: '500', color: '#6b7280' },
  wasPrice: { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' },
  addBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addBtnDisabled: { backgroundColor: '#9ca3af' },
  addBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  manageBtn: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  manageBtnText: { color: '#6b7280', fontWeight: '700', fontSize: 12 },
})
