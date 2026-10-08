import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { products as catalogProducts, type Product } from '../data/catalog'
import { useAuth } from './AuthContext'
import { pointsFromSpend } from '../lib/commerce'
import mobileApi from '../services/api'

export type CartItem = {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  seller: string
  sellerId: string
  sellerUserId: number
  pickupLocation: string
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

export type SellerApplication = {
  id: string
  userId: number
  farmName: string
  location: string
  idType: string
  idNumber: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

export type Post = {
  id: string
  sellerName: string
  productId?: string
  productName?: string
  body: string
  category: string
  createdAt: string
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
  refreshCatalog: () => Promise<void>
  cart: CartItem[]
  cartCount: number
  cartTotal: number
  addToCart: (product: Product, quantity?: number) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  orders: Order[]
  messages: SmsMessage[]
  posts: Post[]
  applications: SellerApplication[]
  loyaltyPoints: number
  placeOrder: (payload: { address: string; payment: Order['payment']; usePoints?: boolean }) => Order | null
  updateOrderStatus: (id: string, status: Order['status']) => void
  confirmOrder: (id: string) => void
  markShipped: (id: string) => void
  submitApplication: (payload: Omit<SellerApplication, 'id' | 'userId' | 'status'>) => void
  reviewApplication: (id: string, status: 'Approved' | 'Rejected') => void
  addPost: (payload: Omit<Post, 'id' | 'createdAt' | 'sellerName'>) => void
  sendSms: (payload: Omit<SmsMessage, 'id' | 'createdAt' | 'channel' | 'status'>) => SmsMessage
  myApplication?: SellerApplication
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)
const DRIVER_ID = 4

const seedOrders: Order[] = [
  {
    id: 'ORD-1002',
    userId: 3,
    buyerName: 'Juan Cruz',
    buyerPhone: '+639189998877',
    items: [{ productId: 'p-eggs', name: 'Free-Range Eggs', price: 220, quantity: 2, image: '/images/eggs.jpg', seller: 'Koronadal Sunrise Poultry', sellerId: 'seller-6', sellerUserId: 16, pickupLocation: 'Koronadal City, South Cotabato', unit: 'tray', stock: 60 }],
    subtotal: 440,
    shippingFee: 50,
    pointsEarned: 44,
    pointsRedeemed: 0,
    total: 490,
    status: 'Out for delivery',
    createdAt: new Date().toISOString(),
    address: 'Purok 3, Calumpang, General Santos City',
    payment: 'Cash on delivery',
    driverId: DRIVER_ID,
  },
  {
    id: 'ORD-1003',
    userId: 3,
    buyerName: 'Juan Cruz',
    buyerPhone: '+639189998877',
    items: [{ productId: 'p-tomato', name: 'Salad Tomatoes', price: 85, quantity: 5, image: '/images/tomato.jpg', seller: 'Green Valley Farm', sellerId: 'seller-1', sellerUserId: 2, pickupLocation: 'Polomolok, South Cotabato', unit: 'kg', stock: 120 }],
    subtotal: 425,
    shippingFee: 50,
    pointsEarned: 42,
    pointsRedeemed: 0,
    total: 475,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    address: 'Blk 4 Lot 9, Koronadal City, South Cotabato',
    payment: 'GCash',
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
  const { user, addRole } = useAuth()
  const [products, setProducts] = useState<Product[]>(catalogProducts)
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>(seedOrders)
  const [messages, setMessages] = useState<SmsMessage[]>(seedMessages)
  const [applications, setApplications] = useState<SellerApplication[]>([])
  const [approvedSellerIds, setApprovedSellerIds] = useState<number[]>([])
  const [posts, setPosts] = useState<Post[]>([
    { id: 'post-1', sellerName: 'Green Valley Farm', productId: 'p-tomato', productName: 'Salad Tomatoes', body: 'Dawn harvest packed in Polomolok. Ice packs for the first 40 kilos.', category: 'Vegetables', createdAt: new Date().toISOString() },
  ])
  const [hydrated, setHydrated] = useState(false)
  const [loyaltyPoints, setLoyaltyPoints] = useState(40)

  const refreshCatalog = async () => {
    try {
      const res = await mobileApi.get<any>('/products')
      const prods = res?.data?.products || res?.products
      if (Array.isArray(prods) && prods.length > 0) {
        const live = prods.filter((p: any) => !p.isUnlisted && p.isActive !== false)
        setProducts(live)
        setCart((curr) => curr.filter((c) => live.some((p: any) => p.id === c.productId)))
      }
    } catch {
      // Keep offline/cached products
    }
  }

  useEffect(() => {
    ;(async () => {
      setCart(await readJson('agrimarket.mobile.cart', []))
      const storedOrders = await readJson<Order[] | null>('agrimarket.mobile.orders', null)
      setOrders(storedOrders && storedOrders.length ? storedOrders : seedOrders)
      const storedSms = await readJson<SmsMessage[] | null>('agrimarket.mobile.sms', null)
      setMessages(storedSms && storedSms.length ? storedSms : seedMessages)
      const pts = await AsyncStorage.getItem('agrimarket.mobile.loyalty')
      if (pts) setLoyaltyPoints(Number(pts))
      setApplications(await readJson('agrimarket.mobile.applications', []))
      setApprovedSellerIds(await readJson('agrimarket.mobile.approvedSellers', []))
      setHydrated(true)

      // Hydrate catalog from central database
      await refreshCatalog()

      mobileApi.get<any>('/orders').then((res) => {
        const remoteOrders = res?.data || res
        if (Array.isArray(remoteOrders) && remoteOrders.length > 0) {
          setOrders(remoteOrders)
        }
      }).catch(() => undefined)
    })()

    // Real-time synchronization loop across all devices
    const interval = setInterval(() => {
      void refreshCatalog()
    }, 5000)
    return () => clearInterval(interval)
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

  useEffect(() => {
    if (!hydrated) return
    AsyncStorage.setItem('agrimarket.mobile.applications', JSON.stringify(applications))
  }, [applications, hydrated])

  useEffect(() => {
    if (!hydrated) return
    AsyncStorage.setItem('agrimarket.mobile.approvedSellers', JSON.stringify(approvedSellerIds))
  }, [approvedSellerIds, hydrated])

  useEffect(() => {
    if (user && approvedSellerIds.includes(user.id)) addRole('seller')
  }, [user, approvedSellerIds, addRole])

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
          sellerId: product.sellerId,
          sellerUserId: product.sellerUserId,
          pickupLocation: product.location,
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
      status: 'Pending',
      createdAt: new Date().toISOString(),
      address,
      payment,
    }
    setOrders((current) => [order, ...current])
    void mobileApi.post('/orders', order).catch(() => undefined)
    setLoyaltyPoints((current) => Math.max(0, current - redeemed + earned))
    setCart([])
    return order
  }

  const updateOrderStatus: StoreContextType['updateOrderStatus'] = (id, status) => {
    void mobileApi.put(`/orders/${id}/status`, { status }).catch(() => undefined)
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)))
  }

  const confirmOrder = (id: string) => {
    void mobileApi.put(`/orders/${id}/status`, { status: 'Confirmed', driverId: DRIVER_ID }).catch(() => undefined)
    setOrders((current) =>
      current.map((order) => (order.id === id && order.status === 'Pending' ? { ...order, status: 'Confirmed', driverId: DRIVER_ID } : order))
    )
  }

  const markShipped = (id: string) => {
    void mobileApi.put(`/orders/${id}/status`, { status: 'Shipped', driverId: DRIVER_ID }).catch(() => undefined)
    setOrders((current) =>
      current.map((order) => (order.id === id && (order.status === 'Confirmed' || order.status === 'Pending') ? { ...order, status: 'Shipped', driverId: order.driverId || DRIVER_ID } : order))
    )
  }

  const submitApplication: StoreContextType['submitApplication'] = (payload) => {
    if (!user) return
    const next: SellerApplication = { ...payload, id: `APP-${Date.now()}`, userId: user.id, status: 'Pending' }
    setApplications((current) => [next, ...current.filter((item) => item.userId !== user.id)])
    void mobileApi.post('/sellers/application', next).catch(() => undefined)
  }

  const reviewApplication = (id: string, status: 'Approved' | 'Rejected') => {
    void mobileApi.put(`/admin/seller-applications/${id}`, { status }).catch(() => undefined)
    setApplications((current) => {
      const target = current.find((item) => item.id === id)
      if (status === 'Approved' && target) {
        setApprovedSellerIds((ids) => (ids.includes(target.userId) ? ids : [...ids, target.userId]))
        if (user && target.userId === user.id) addRole('seller')
      }
      return current.map((item) => (item.id === id ? { ...item, status } : item))
    })
  }

  const addPost: StoreContextType['addPost'] = (payload) => {
    setPosts((current) => [
      {
        ...payload,
        id: `post-${Date.now()}`,
        sellerName: user ? `${user.firstName} ${user.lastName}` : 'Farm stall',
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
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
    void mobileApi.post('/messages/sms', next).catch(() => undefined)
    return next
  }

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])

  const value: StoreContextType = {
    products,
    refreshCatalog,
    cart,
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    cartTotal,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    orders,
    messages,
    posts,
    applications,
    loyaltyPoints,
    placeOrder,
    updateOrderStatus,
    confirmOrder,
    markShipped,
    submitApplication,
    reviewApplication,
    addPost,
    sendSms,
    myApplication: applications.find((item) => user && item.userId === user.id),
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within a StoreProvider')
  return context
}
