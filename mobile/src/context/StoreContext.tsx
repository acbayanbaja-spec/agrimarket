import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { products as catalogProducts, type Product } from '../data/catalog'
import { useAuth } from './AuthContext'
import { pointsFromSpend } from '../lib/commerce'

export type CartItem = {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  seller: string
  unit: string
  stock: number
}

export type Order = {
  id: string
  userId: number
  buyerName: string
  buyerPhone?: string
  items: CartItem[]
  subtotal: number
  shippingFee: number
  pointsEarned: number
  pointsRedeemed: number
  total: number
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Out for delivery' | 'Delivered'
  createdAt: string
  address: string
  payment: 'GCash' | 'Cash on delivery'
  driverId?: number
}

export type SmsMessage = {
  id: string
  orderId: string
  fromRole: 'delivery' | 'buyer' | 'system'
  fromName: string
  fromUserId?: number
  toUserId: number
  phone?: string
  body: string
  createdAt: string
  channel: 'sms' | 'in-app'
  status: 'queued' | 'sent' | 'delivered'
}

type StoreContextType = {
  products: Product[]
  cart: CartItem[]
  cartCount: number
  cartTotal: number
  addToCart: (product: Product, quantity?: number) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  orders: Order[]
  messages: SmsMessage[]
  loyaltyPoints: number
  placeOrder: (payload: { address: string; payment: Order['payment']; usePoints?: boolean }) => Order | null
  updateOrderStatus: (id: string, status: Order['status']) => void
  sendSms: (payload: Omit<SmsMessage, 'id' | 'createdAt' | 'channel' | 'status'>) => SmsMessage
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)
const DRIVER_ID = 4

const seedOrders: Order[] = [
  {
    id: 'ORD-1002',
    userId: 3,
    buyerName: 'Juan Cruz',
    buyerPhone: '+639189998877',
    items: [{ productId: 'p-eggs', name: 'Free-Range Eggs', price: 220, quantity: 2, image: '/images/eggs.jpg', seller: 'Sunrise Poultry', unit: 'tray', stock: 60 }],
    subtotal: 440,
    shippingFee: 50,
    pointsEarned: 44,
    pointsRedeemed: 0,
    total: 490,
    status: 'Out for delivery',
    createdAt: new Date().toISOString(),
    address: '12 Mabini St, Quezon City',
    payment: 'Cash on delivery',
    driverId: DRIVER_ID,
  },
]

const seedMessages: SmsMessage[] = [
  {
    id: 'sms-1',
    orderId: 'ORD-1002',
    fromRole: 'delivery',
    fromName: 'Rico Driver',
    fromUserId: DRIVER_ID,
    toUserId: 3,
    phone: '+639189998877',
    body: 'Good day po! Eggs are out for delivery, ETA 4:20 PM. Please keep GCash or cash ready.',
    createdAt: new Date().toISOString(),
    channel: 'sms',
    status: 'delivered',
  },
]

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>(seedOrders)
  const [messages, setMessages] = useState<SmsMessage[]>(seedMessages)
  const [hydrated, setHydrated] = useState(false)
  const [loyaltyPoints, setLoyaltyPoints] = useState(40)

  useEffect(() => {
    ;(async () => {
      setCart(await readJson('agrimarket.mobile.cart', []))
      const storedOrders = await readJson<Order[] | null>('agrimarket.mobile.orders', null)
      setOrders(storedOrders && storedOrders.length ? storedOrders : seedOrders)
      const storedSms = await readJson<SmsMessage[] | null>('agrimarket.mobile.sms', null)
      setMessages(storedSms && storedSms.length ? storedSms : seedMessages)
      const pts = await AsyncStorage.getItem('agrimarket.mobile.loyalty')
      if (pts) setLoyaltyPoints(Number(pts))
      setHydrated(true)
    })()
  }, [])

  useEffect(() => {
    if (!hydrated) return
    AsyncStorage.setItem('agrimarket.mobile.cart', JSON.stringify(cart))
  }, [cart, hydrated])

  useEffect(() => {
    if (!hydrated) return
    AsyncStorage.setItem('agrimarket.mobile.orders', JSON.stringify(orders))
  }, [orders, hydrated])

  useEffect(() => {
    if (!hydrated) return
    AsyncStorage.setItem('agrimarket.mobile.sms', JSON.stringify(messages))
  }, [messages, hydrated])

  useEffect(() => {
    if (!hydrated) return
    AsyncStorage.setItem('agrimarket.mobile.loyalty', String(loyaltyPoints))
  }, [loyaltyPoints, hydrated])

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) return
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id)
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
            : item
        )
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.image,
          seller: product.seller,
          unit: product.unit,
          stock: product.stock,
        },
      ]
    })
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart((current) =>
      current
        .map((item) => (item.productId === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((current) => current.filter((item) => item.productId !== productId))
  }

  const clearCart = () => setCart([])

  const placeOrder: StoreContextType['placeOrder'] = ({ address, payment, usePoints = true }) => {
    if (!user || cart.length === 0) return null
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const shippingFee = subtotal >= 300 ? 0 : 50
    const earned = pointsFromSpend(subtotal)
    const redeemed = usePoints ? Math.min(loyaltyPoints, shippingFee) : 0
    const order: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      buyerName: `${user.firstName} ${user.lastName}`,
      buyerPhone: user.phone,
      items: cart,
      subtotal,
      shippingFee,
      pointsEarned: earned,
      pointsRedeemed: redeemed,
      total: subtotal + Math.max(0, shippingFee - redeemed),
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
      address,
      payment,
      driverId: DRIVER_ID,
    }
    setOrders((current) => [order, ...current])
    setLoyaltyPoints((current) => Math.max(0, current - redeemed + earned))
    setCart([])
    return order
  }

  const updateOrderStatus: StoreContextType['updateOrderStatus'] = (id, status) => {
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)))
  }

  const sendSms: StoreContextType['sendSms'] = (payload) => {
    const next: SmsMessage = {
      ...payload,
      id: `sms-${Date.now()}`,
      createdAt: new Date().toISOString(),
      channel: payload.phone ? 'sms' : 'in-app',
      status: payload.phone ? 'sent' : 'delivered',
    }
    setMessages((current) => [...current, next])
    return next
  }

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])

  const value: StoreContextType = {
    products: catalogProducts,
    cart,
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    cartTotal,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    orders,
    messages,
    loyaltyPoints,
    placeOrder,
    updateOrderStatus,
    sendSms,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within a StoreProvider')
  return context
}
