import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Product } from '../data/catalog'

export type CartItem = {
  product: Product
  quantity: number
  selected?: boolean
}

type CartContextType = {
  items: CartItem[]
  count: number
  selectedCount: number
  subtotal: number
  selectedSubtotal: number
  selectedItems: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  removeItems: (productIds: string[]) => void
  removeSelectedItems: () => void
  toggleSelect: (productId: string) => void
  selectAll: (selected: boolean) => void
  clear: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)
const STORAGE_KEY = 'agrimarket.cart'

function normalizeCartItem(raw: any): CartItem | null {
  if (!raw || typeof raw !== 'object') return null
  const selected = raw.selected !== undefined ? Boolean(raw.selected) : true
  if (raw.product && typeof raw.product === 'object' && raw.product.id) {
    return {
      product: raw.product,
      quantity: Math.max(1, Number(raw.quantity) || 1),
      selected,
    }
  }
  const id = raw.id || raw.productId
  if (id) {
    return {
      product: {
        id: String(id),
        name: String(raw.name || 'Produce Item'),
        price: Number(raw.price) || 0,
        image: String(raw.image || '/images/fallback.svg'),
        seller: String(raw.seller || 'Farm Seller'),
        sellerId: String(raw.sellerId || 'seller-1'),
        sellerUserId: Number(raw.sellerUserId || 2),
        location: String(raw.location || raw.pickupLocation || 'SOCCSKSARGEN'),
        category: String(raw.category || 'Vegetables'),
        stock: Number(raw.stock) || 99,
        unit: String(raw.unit || 'kg'),
        rating: Number(raw.rating) || 5,
        reviews: Number(raw.reviews) || 0,
        photos: Array.isArray(raw.photos) ? raw.photos : [],
        description: String(raw.description || ''),
        organic: Boolean(raw.organic),
        tradeable: Boolean(raw.tradeable),
        lat: Number(raw.lat) || 6.5,
        lng: Number(raw.lng) || 124.8,
        priceHistory: Array.isArray(raw.priceHistory) ? raw.priceHistory : [],
      },
      quantity: Math.max(1, Number(raw.quantity) || 1),
      selected,
    }
  }
  return null
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          const valid = parsed.map(normalizeCartItem).filter((i): i is CartItem => i !== null)
          setItems(valid)
        }
      }
    } catch {
      setItems([])
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const valid = items.filter((item): item is CartItem => Boolean(item && item.product && item.product.id))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(valid))
  }, [items, hydrated])

  const addItem = (product: Product, quantity = 1) => {
    if (!product || !product.id) return
    setItems((current) => {
      const valid = current.filter((item): item is CartItem => Boolean(item && item.product && item.product.id))
      const existing = valid.find((item) => item.product.id === product.id)
      if (existing) {
        return valid.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock || 99), selected: true }
            : item
        )
      }
      return [...valid, { product, quantity: Math.max(1, quantity), selected: true }]
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((current) =>
      current
        .filter((item): item is CartItem => Boolean(item && item.product && item.product.id))
        .map((item) => (item.product.id === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    )
  }

  const removeItem = (productId: string) => {
    setItems((current) =>
      current
        .filter((item): item is CartItem => Boolean(item && item.product && item.product.id))
        .filter((item) => item.product.id !== productId)
    )
  }

  const removeItems = (productIds: string[]) => {
    const idSet = new Set(productIds)
    setItems((current) =>
      current
        .filter((item): item is CartItem => Boolean(item && item.product && item.product.id))
        .filter((item) => !idSet.has(item.product.id))
    )
  }

  const removeSelectedItems = () => {
    setItems((current) =>
      current
        .filter((item): item is CartItem => Boolean(item && item.product && item.product.id))
        .filter((item) => item.selected === false)
    )
  }

  const toggleSelect = (productId: string) => {
    setItems((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, selected: !(item.selected !== false) } : item
      )
    )
  }

  const selectAll = (selected: boolean) => {
    setItems((current) => current.map((item) => ({ ...item, selected })))
  }

  const clear = () => setItems([])

  const value = useMemo(() => {
    const valid = items.filter((item): item is CartItem => Boolean(item && item.product && item.product.id))
    const subtotal = valid.reduce((sum, item) => sum + (Number(item.product.price) || 0) * (Number(item.quantity) || 1), 0)
    const count = valid.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)

    const selectedItems = valid.filter((item) => item.selected !== false)
    const selectedCount = selectedItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
    const selectedSubtotal = selectedItems.reduce(
      (sum, item) => sum + (Number(item.product.price) || 0) * (Number(item.quantity) || 1),
      0
    )

    return {
      items: valid,
      count,
      selectedCount,
      subtotal,
      selectedSubtotal,
      selectedItems,
      addItem,
      updateQuantity,
      removeItem,
      removeItems,
      removeSelectedItems,
      toggleSelect,
      selectAll,
      clear,
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
