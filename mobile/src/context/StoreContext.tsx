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
  status:
    | 'Pending'
    | 'Confirmed'
    | 'Preparing'
    | 'Ready for Pickup'
    | 'Shipped'
    | 'Out for delivery'
    | 'Delivered'
    | 'Cancelled'
  createdAt: string
  address: string
  payment: 'GCash' | 'Cash on delivery'
  driverId?: number
  statusHistory?: Array<{
    status: string
    changedBy: number
    changedByName: string
    changedByRole: string
    timestamp: string
    note?: string
  }>
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

export type FlashDeal = {
  productId: string
  product: Product
  discountPercent: number
  dealPrice: number
  originalPrice: number
  claimedPercent: number
  endsInSeconds: number
}

export type DirectChatMessage = {
  id: string
  sellerId: string
  sellerName: string
  sender: 'user' | 'seller' | 'ai'
  text: string
  timestamp: string
}

type StoreContextType = {
  products: Product[]
  addNewProduct: (payload: Partial<Product>) => Promise<Product>
  updateProductStock: (productId: string, newStock: number) => Promise<void>
  directMessages: DirectChatMessage[]
  sendDirectMessage: (sellerId: string, sellerName: string, text: string) => void
  refreshCatalog: () => Promise<void>
  isOnline: boolean
  apiLatency: number
  lastSyncTime: string
  newProductAlert: Product | null
  dismissNewProductAlert: () => void
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
  agriCoins: number
  dailyCheckinClaimed: boolean
  claimDailyCheckin: () => number
  claimedVouchers: string[]
  claimVoucher: (code: string) => boolean
  isVoucherClaimed: (code: string) => boolean
  wishlist: string[]
  toggleWishlist: (productId: string) => void
  isWishlisted: (productId: string) => boolean
  recommendations: Product[]
  flashDeals: FlashDeal[]
  placeOrder: (payload: { address: string; payment: Order['payment']; usePoints?: boolean; voucherCode?: string; useCoins?: boolean }) => Order | null
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
  const [agriCoins, setAgriCoins] = useState(50)
  const [lastCheckinDate, setLastCheckinDate] = useState<string | null>(null)
  const [claimedVouchers, setClaimedVouchers] = useState<string[]>(['FREESHIP'])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [directMessages, setDirectMessages] = useState<DirectChatMessage[]>([
    {
      id: 'dm-1',
      sellerId: 'seller-1',
      sellerName: 'Green Valley Farm',
      sender: 'seller',
      text: 'Magandang araw po! Freshly harvested po ang aming Polomolok Salad Tomatoes at Romaine Lettuce kaninang 5 AM. Let us know po kung may tanong kayo!',
      timestamp: '8:30 AM',
    },
    {
      id: 'dm-2',
      sellerId: 'seller-4',
      sellerName: 'Gensan Fruit Co-op',
      sender: 'seller',
      text: 'Suki, may parating po kaming bagong pitas na Puyat Durian at Red Dragon Fruit bukas ng hapon. Mag-reserve po kayo nang maaga!',
      timestamp: '9:15 AM',
    },
    {
      id: 'dm-3',
      sellerId: 'seller-7',
      sellerName: 'Lake Sebu Ponds',
      sender: 'seller',
      text: 'Hello po! Live and boneless Bangus and Tilapia from Lake Sebu, packed in food-grade ice. Delivered fresh within SOCCSKSARGEN!',
      timestamp: '10:00 AM',
    },
  ])
  const [isOnline, setIsOnline] = useState(false)
  const [apiLatency, setApiLatency] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now')
  const [newProductAlert, setNewProductAlert] = useState<Product | null>(null)
  const knownProductIdsRef = React.useRef<Set<string>>(new Set(catalogProducts.map((p) => p.id)))

  const refreshCatalog = async () => {
    try {
      const health = await mobileApi.checkHealth()
      setIsOnline(health.ok)
      setApiLatency(health.latency)

      const res = await mobileApi.get<any>('/products?pageSize=48&stock=in')
      const prods = res?.data?.products || res?.products
      if (Array.isArray(prods) && prods.length > 0) {
        const live: Product[] = prods.filter((p: any) => !p.isUnlisted && p.isActive !== false)

        // Detect any newly posted online harvests that were not in our known list
        const newlyAdded = live.find((p) => !knownProductIdsRef.current.has(p.id))
        if (newlyAdded && hydrated) {
          setNewProductAlert(newlyAdded)
        }
        live.forEach((p) => knownProductIdsRef.current.add(p.id))

        setProducts(live)
        setCart((curr) => curr.filter((c) => live.some((p: any) => p.id === c.productId)))
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      }
    } catch {
      setIsOnline(false)
      // Keep offline/cached products
    }
  }

  const dismissNewProductAlert = () => setNewProductAlert(null)

  useEffect(() => {
    ;(async () => {
      setCart(await readJson('agrimarket.mobile.cart', []))
      const storedOrders = await readJson<Order[] | null>('agrimarket.mobile.orders', null)
      setOrders(storedOrders && storedOrders.length ? storedOrders : seedOrders)
      const storedSms = await readJson<SmsMessage[] | null>('agrimarket.mobile.sms', null)
      setMessages(storedSms && storedSms.length ? storedSms : seedMessages)
      const pts = await AsyncStorage.getItem('agrimarket.mobile.loyalty')
      if (pts) setLoyaltyPoints(Number(pts))
      const coins = await AsyncStorage.getItem('agrimarket.mobile.coins')
      if (coins) setAgriCoins(Number(coins))
      const checkin = await AsyncStorage.getItem('agrimarket.mobile.lastCheckin')
      if (checkin) setLastCheckinDate(checkin)
      setClaimedVouchers(await readJson('agrimarket.mobile.vouchers', ['FREESHIP']))
      setWishlist(await readJson('agrimarket.mobile.wishlist', []))
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

    const syncOrders = async () => {
      try {
        const res: any = await mobileApi.get('/orders')
        const remoteOrders = res?.data || (Array.isArray(res) ? res : [])
        if (Array.isArray(remoteOrders) && remoteOrders.length > 0) {
          setOrders(remoteOrders)
        }
      } catch {
        // Keep offline cached
      }
    }

    // Real-time synchronization loop across all devices
    const interval = setInterval(() => {
      void refreshCatalog()
      void syncOrders()
    }, 4000)
    return () => clearInterval(interval)
  }, [hydrated])

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
    AsyncStorage.setItem('agrimarket.mobile.coins', String(agriCoins))
  }, [agriCoins, hydrated])

  useEffect(() => {
    if (!hydrated) return
    AsyncStorage.setItem('agrimarket.mobile.vouchers', JSON.stringify(claimedVouchers))
  }, [claimedVouchers, hydrated])

  useEffect(() => {
    if (!hydrated) return
    AsyncStorage.setItem('agrimarket.mobile.wishlist', JSON.stringify(wishlist))
  }, [wishlist, hydrated])

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

  useEffect(() => {
    if (!user) return
    mobileApi
      .get<any>('/wishlist')
      .then((res) => {
        const ids = res?.data?.productIds || res?.productIds
        if (Array.isArray(ids)) setWishlist(ids)
      })
      .catch(() => undefined)
  }, [user?.id])

  const toggleWishlist = (productId: string) => {
    const exists = wishlist.includes(productId)
    const previous = wishlist
    setWishlist((curr) => (exists ? curr.filter((id) => id !== productId) : [...curr, productId]))
    if (!user) return
    const request = exists ? mobileApi.delete(`/wishlist/${productId}`) : mobileApi.post(`/wishlist/${productId}`)
    request
      .then((res: any) => {
        const ids = res?.data?.productIds || res?.productIds
        if (Array.isArray(ids)) setWishlist(ids)
      })
      .catch(() => setWishlist(previous))
  }

  const isWishlisted = (productId: string) => wishlist.includes(productId)

  const claimVoucher = (code: string): boolean => {
    if (claimedVouchers.includes(code)) return false
    setClaimedVouchers((curr) => [...curr, code])
    return true
  }

  const isVoucherClaimed = (code: string) => claimedVouchers.includes(code)

  const todayStr = new Date().toISOString().slice(0, 10)
  const dailyCheckinClaimed = lastCheckinDate === todayStr

  const claimDailyCheckin = (): number => {
    if (dailyCheckinClaimed) return 0
    const reward = 15
    setAgriCoins((curr) => curr + reward)
    setLastCheckinDate(todayStr)
    void AsyncStorage.setItem('agrimarket.mobile.lastCheckin', todayStr)
    return reward
  }

  // Smart Recommendations: Top 20+ products ranked by rating, review count, stock availability, and freshness
  const recommendations = useMemo(() => {
    return [...products]
      .map((p) => {
        let score = (p.rating || 4.5) * 20 + Math.min(20, (p.reviews || 0) * 0.2)
        if (p.organic) score += 5
        if (p.stock > 0) score += 10
        return { product: p, score }
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product)
  }, [products])

  // Flash Deals: 6 featured limited-time bargains with high discounts and claimed percentage
  const flashDeals = useMemo<FlashDeal[]>(() => {
    const picks = products.slice(0, 6)
    const discounts = [25, 20, 30, 15, 35, 22]
    const claimed = [88, 72, 94, 65, 81, 79]

    return picks.map((p, idx) => {
      const discountPercent = discounts[idx % discounts.length]
      const dealPrice = Math.round(p.price * (1 - discountPercent / 100))
      return {
        productId: p.id,
        product: p,
        discountPercent,
        dealPrice,
        originalPrice: p.price,
        claimedPercent: claimed[idx % claimed.length],
        endsInSeconds: 12450,
      }
    })
  }, [products])

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

  const placeOrder: StoreContextType['placeOrder'] = ({ address, payment, usePoints = true, voucherCode, useCoins = false }) => {
    if (!user || cart.length === 0 || user.roles.includes('admin')) return null
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    let shippingFee = subtotal >= 300 ? 0 : 50

    if (voucherCode === 'FREESHIP' || claimedVouchers.includes('FREESHIP')) {
      if (subtotal >= 300) shippingFee = 0
    }
    if (voucherCode === 'AGRIFARM30') {
      shippingFee = Math.max(0, shippingFee - 30)
    }

    const earned = pointsFromSpend(subtotal)
    const redeemedPoints = usePoints ? Math.min(loyaltyPoints, shippingFee) : 0
    const coinsDiscount = useCoins ? Math.min(agriCoins, 50) : 0

    const finalTotal = Math.max(0, subtotal + Math.max(0, shippingFee - redeemedPoints) - coinsDiscount)

    const order: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      buyerName: `${user.firstName} ${user.lastName}`,
      buyerPhone: user.phone,
      items: cart,
      subtotal,
      shippingFee,
      pointsEarned: earned,
      pointsRedeemed: redeemedPoints,
      total: finalTotal,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      address,
      payment,
    }

    setOrders((current) => [order, ...current])
    void mobileApi.post('/orders', order).catch(() => undefined)
    setLoyaltyPoints((current) => Math.max(0, current - redeemedPoints + earned))
    if (useCoins && coinsDiscount > 0) {
      setAgriCoins((curr) => Math.max(0, curr - coinsDiscount))
    }
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

  const sendDirectMessage = (sellerId: string, sellerName: string, text: string) => {
    const userMsg: DirectChatMessage = {
      id: `dm-${Date.now()}`,
      sellerId,
      sellerName,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setDirectMessages((prev) => [...prev, userMsg])

    // Simulated farmer response
    setTimeout(() => {
      const replies = [
        'Opo suki! Available po ito ngayon at pwede naming i-pack agad para sa next courier pickup.',
        'Salamat po sa message! Garantisadong sariwa mula sa bukid kaninang umaga lamang.',
        'Noted po ito! Ilalagay po namin sa insulated crate para manatiling sariwa hanggang makarating sa inyo.',
        'Opo, kasama po ito sa aming special harvest batch. Pwede niyo pong i-checkout gamit ang FREESHIP voucher!',
      ]
      const replyText = replies[Math.floor(Math.random() * replies.length)]
      const replyMsg: DirectChatMessage = {
        id: `dm-${Date.now() + 1}`,
        sellerId,
        sellerName,
        sender: 'seller',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setDirectMessages((prev) => [...prev, replyMsg])
    }, 1200)
  }

  const addNewProduct = async (payload: Partial<Product>): Promise<Product> => {
    try {
      const res: any = await mobileApi.post('/products', payload)
      if (res?.data?.product) {
        setProducts((prev) => [res.data.product, ...prev.filter((p) => p.id !== res.data.product.id)])
        return res.data.product
      }
    } catch {
      // offline fallback
    }
    const fallback: Product = {
      id: payload.id || `prod-${Date.now()}`,
      name: payload.name || 'New Harvest Crop',
      category: payload.category || 'Vegetables',
      price: payload.price || 100,
      unit: payload.unit || 'kg',
      stock: payload.stock || 50,
      rating: 5.0,
      reviews: 0,
      seller: payload.seller || (user ? `${user.firstName} ${user.lastName} Farm` : 'SOCCSKSARGEN Farm Partner'),
      sellerId: payload.sellerId || (user ? `seller-${user.id}` : 'seller-1'),
      sellerUserId: user?.id || 2,
      location: payload.location || 'Koronadal City, South Cotabato',
      image: payload.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
      photos: payload.photos || [payload.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80'],
      description: payload.description || 'Fresh agricultural harvest from SOCCSKSARGEN.',
      organic: Boolean(payload.organic),
      tradeable: true,
      lat: 6.5004,
      lng: 124.8436,
      priceHistory: [{ date: new Date().toISOString().slice(0, 10), price: payload.price || 100 }],
      isActive: true,
    }
    setProducts((prev) => [fallback, ...prev])
    return fallback
  }

  const updateProductStock = async (productId: string, newStock: number): Promise<void> => {
    try {
      await mobileApi.put(`/products/${productId}`, { stock: newStock })
    } catch {
      // offline fallback
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    )
  }

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])

  const value: StoreContextType = {
    products,
    addNewProduct,
    updateProductStock,
    directMessages,
    sendDirectMessage,
    refreshCatalog,
    isOnline,
    apiLatency,
    lastSyncTime,
    newProductAlert,
    dismissNewProductAlert,
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
    agriCoins,
    dailyCheckinClaimed,
    claimDailyCheckin,
    claimedVouchers,
    claimVoucher,
    isVoucherClaimed,
    wishlist,
    toggleWishlist,
    isWishlisted,
    recommendations,
    flashDeals,
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
