import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { products as catalogProducts, shippingCoupons, type Product } from '../data/catalog'
import { recommendScore } from '../lib/utils'
import { filterByBudget, pointsFromSpend } from '../lib/commerce'
import { useAuth } from './AuthContext'
import api from '../services/api'

export type OrderItem = {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  seller: string
  sellerId: string
  sellerUserId: number
  pickupLocation: string
}

export type Order = {
  id: string
  receiptNo: string
  userId: number
  buyerName: string
  buyerPhone?: string
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  shippingDiscount: number
  couponCode?: string
  pointsEarned: number
  pointsRedeemed: number
  total: number
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Out for delivery' | 'Delivered'
  createdAt: string
  address: string
  payment: 'GCash' | 'Cash on delivery'
  paymentRef?: string
  driverId?: number
  lat?: number
  lng?: number
  sellerConfirmedAt?: string
  shippedAt?: string
}

export type SellerApplication = {
  id: string
  userId: number
  name: string
  farmName: string
  location: string
  description: string
  phone: string
  categories: string
  idType: string
  idNumber: string
  idDocument?: string
  permitDocument?: string
  farmPhoto?: string
  status: 'Pending' | 'Approved' | 'Rejected'
  createdAt: string
}

export type Review = {
  id: string
  productId: string
  userId: number
  userName: string
  rating: number
  comment: string
  photos: string[]
  createdAt: string
}

export type Post = {
  id: string
  sellerId: string
  sellerName: string
  productId?: string
  productName?: string
  body: string
  photos: string[]
  category: string
  createdAt: string
}

export type TradeOffer = {
  id: string
  fromUserId: number
  fromName: string
  fromProductId: string
  fromProductName: string
  toSellerId: string
  toProductId: string
  toProductName: string
  note: string
  status: 'Open' | 'Accepted' | 'Declined'
  createdAt: string
}

export type AppNotification = {
  id: string
  userId: number | 'all'
  title: string
  message: string
  href?: string
  category?: string
  readBy: number[]
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

export type CouponResult = {
  ok: boolean
  message: string
  discount: number
  code?: string
}

type StoreContextType = {
  products: Product[]
  orders: Order[]
  applications: SellerApplication[]
  reviews: Review[]
  posts: Post[]
  trades: TradeOffer[]
  notifications: AppNotification[]
  messages: SmsMessage[]
  followedCategories: string[]
  addProduct: (product: Omit<Product, 'id' | 'sellerId' | 'seller' | 'sellerUserId' | 'rating' | 'reviews' | 'priceHistory' | 'photos'> & { photos?: string[] }) => Product
  updateProductStock: (id: string, stock: number) => void
  updateProductPrice: (id: string, price: number) => void
  removeProduct: (id: string) => void
  placeOrder: (order: Omit<Order, 'id' | 'createdAt' | 'userId' | 'status' | 'receiptNo' | 'buyerName' | 'pointsEarned'> & { pointsRedeemed?: number }) => Order
  myOrders: Order[]
  submitApplication: (payload: Omit<SellerApplication, 'id' | 'createdAt' | 'status' | 'userId' | 'name'>) => SellerApplication
  myApplication: SellerApplication | undefined
  reviewApplication: (id: string, status: 'Approved' | 'Rejected') => void
  updateOrderStatus: (id: string, status: Order['status']) => void
  confirmOrder: (id: string) => void
  markShipped: (id: string) => void
  assignDriver: (orderId: string, driverId: number) => void
  sellerOrders: Order[]
  myListings: Product[]
  addReview: (payload: Omit<Review, 'id' | 'createdAt' | 'userId' | 'userName'>) => void
  reviewsFor: (productId: string) => Review[]
  addPost: (payload: Omit<Post, 'id' | 'createdAt' | 'sellerId' | 'sellerName'>) => void
  followCategory: (category: string) => void
  unfollowCategory: (category: string) => void
  offerTrade: (payload: Omit<TradeOffer, 'id' | 'createdAt' | 'fromUserId' | 'fromName' | 'status'>) => void
  respondTrade: (id: string, status: 'Accepted' | 'Declined') => void
  applyCoupon: (code: string, shippingFee: number, subtotal: number) => CouponResult
  sendSms: (payload: Omit<SmsMessage, 'id' | 'createdAt' | 'channel' | 'status'>) => SmsMessage
  markNotificationsRead: () => void
  markNotificationRead: (id: string) => void
  unreadCount: number
  recommended: Product[]
  budgetPicks: (budget: number) => Product[]
  loyaltyPoints: number
  salesSeries: { label: string; daily: number; monthly: number; yearly: number }[]
  categorySales: { name: string; value: number }[]
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)
const APPROVED_KEY = 'agrimarket.approvedSellers'
const DRIVER_ID = 4

const seedReviews: Review[] = [
  {
    id: 'r1',
    productId: 'p-tomato',
    userId: 3,
    userName: 'Juan Cruz',
    rating: 5,
    comment: 'Arrived firm and sweet. Perfect for our sari-sari stall.',
    photos: ['/images/tomato.jpg'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'r2',
    productId: 'p-mango',
    userId: 3,
    userName: 'Juan Cruz',
    rating: 5,
    comment: 'Guimaras quality. Kids finished the box in two days.',
    photos: ['/images/mango.jpg'],
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
]

const seedPosts: Post[] = [
  {
    id: 'post-1',
    sellerId: 'seller-1',
    sellerName: 'Green Valley Farm',
    productId: 'p-tomato',
    productName: 'Salad Tomatoes',
    body: 'Dawn harvest of salad tomatoes is packed in Polomolok. Tagging Vegetables — first 40 kilos get ice packs for free.',
    photos: ['/images/tomato.jpg', '/images/farm.jpg'],
    category: 'Vegetables',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'post-2',
    sellerId: 'seller-3',
    sellerName: 'Midsayap Gold Orchard',
    productId: 'p-mango',
    productName: 'Carabao Mangoes',
    body: 'Carabao mangoes hitting peak sugar this week in Midsayap. We can do Gensan and Koronadal drop-off Friday.',
    photos: ['/images/mango.jpg'],
    category: 'Fruits',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
]

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString()
}

const seedOrders: Order[] = [
  {
    id: 'ORD-1001',
    receiptNo: 'RCPT-1001',
    userId: 3,
    buyerName: 'Juan Cruz',
    buyerPhone: '+639189998877',
    items: [{ productId: 'p-rice', name: 'Dinorado Rice', price: 58, quantity: 10, image: '/images/rice.jpg', seller: 'Green Valley Farm', sellerId: 'seller-1', sellerUserId: 2, pickupLocation: "M'lang, Cotabato" }],
    subtotal: 580,
    shippingFee: 50,
    shippingDiscount: 50,
    couponCode: 'FREESHIP',
    pointsEarned: 58,
    pointsRedeemed: 0,
    total: 580,
    status: 'Delivered',
    createdAt: daysAgo(2),
    address: '12 Osmeña St, Koronadal City, South Cotabato',
    payment: 'GCash',
    paymentRef: 'GC-8821',
    driverId: DRIVER_ID,
    lat: 6.5004,
    lng: 124.8436,
    sellerConfirmedAt: daysAgo(2),
    shippedAt: daysAgo(2),
  },
  {
    id: 'ORD-1002',
    receiptNo: 'RCPT-1002',
    userId: 3,
    buyerName: 'Juan Cruz',
    buyerPhone: '+639189998877',
    items: [{ productId: 'p-eggs', name: 'Free-Range Eggs', price: 220, quantity: 2, image: '/images/eggs.jpg', seller: 'Koronadal Sunrise Poultry', sellerId: 'seller-6', sellerUserId: 16, pickupLocation: 'Koronadal City, South Cotabato' }],
    subtotal: 440,
    shippingFee: 50,
    shippingDiscount: 0,
    pointsEarned: 44,
    pointsRedeemed: 0,
    total: 490,
    status: 'Out for delivery',
    createdAt: daysAgo(0),
    address: 'Purok 3, Calumpang, General Santos City',
    payment: 'Cash on delivery',
    driverId: DRIVER_ID,
    lat: 6.1164,
    lng: 125.1716,
    sellerConfirmedAt: daysAgo(0),
    shippedAt: daysAgo(0),
  },
  {
    id: 'ORD-1003',
    receiptNo: 'RCPT-1003',
    userId: 3,
    buyerName: 'Juan Cruz',
    buyerPhone: '+639189998877',
    items: [{ productId: 'p-tomato', name: 'Salad Tomatoes', price: 85, quantity: 5, image: '/images/tomato.jpg', seller: 'Green Valley Farm', sellerId: 'seller-1', sellerUserId: 2, pickupLocation: 'Polomolok, South Cotabato' }],
    subtotal: 425,
    shippingFee: 50,
    shippingDiscount: 0,
    pointsEarned: 42,
    pointsRedeemed: 0,
    total: 475,
    status: 'Pending',
    createdAt: daysAgo(0),
    address: 'Blk 4 Lot 9, Koronadal City, South Cotabato',
    payment: 'GCash',
    paymentRef: 'GC-9901',
    lat: 6.5004,
    lng: 124.8436,
  },
]

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, addRole, grantRole } = useAuth()
  const [extraProducts, setExtraProducts] = useState<Product[]>([])
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({})
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({})
  const [orders, setOrders] = useState<Order[]>([])
  const [applications, setApplications] = useState<SellerApplication[]>([])
  const [approvedSellerIds, setApprovedSellerIds] = useState<number[]>([])
  const [reviews, setReviews] = useState<Review[]>(seedReviews)
  const [posts, setPosts] = useState<Post[]>(seedPosts)
  const [trades, setTrades] = useState<TradeOffer[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [messages, setMessages] = useState<SmsMessage[]>([])
  const [followedCategories, setFollowedCategories] = useState<string[]>(['Vegetables', 'Fruits'])
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setExtraProducts(readJson('agrimarket.extraProducts', []))
    setHiddenIds(readJson('agrimarket.hiddenProducts', []))
    setStockOverrides(readJson('agrimarket.stock', {}))
    setPriceOverrides(readJson('agrimarket.prices', {}))
    const storedOrders = readJson<Order[] | null>('agrimarket.orders', null)
    setOrders(storedOrders && storedOrders.length ? storedOrders : seedOrders)
    setApplications(readJson('agrimarket.applications', []))
    setApprovedSellerIds(readJson(APPROVED_KEY, []))
    setReviews(readJson('agrimarket.reviews', seedReviews))
    setPosts(readJson('agrimarket.posts', seedPosts))
    setTrades(readJson('agrimarket.trades', []))
    const storedNotices = readJson<Array<AppNotification & { read?: boolean }>>('agrimarket.notifications', [
      {
        id: 'n-welcome',
        userId: 'all',
        title: 'Harvest board is live',
        message: 'Follow a category to get pinged when sellers post.',
        href: '/feed',
        readBy: [],
        createdAt: new Date().toISOString(),
      },
    ])
    setNotifications(
      storedNotices.map((item) => ({
        ...item,
        readBy: item.readBy || [],
      }))
    )
    setMessages(readJson('agrimarket.sms', [
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
    ]))
    setFollowedCategories(readJson('agrimarket.follows', ['Vegetables', 'Fruits']))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('agrimarket.extraProducts', JSON.stringify(extraProducts))
  }, [extraProducts, hydrated])
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('agrimarket.hiddenProducts', JSON.stringify(hiddenIds))
  }, [hiddenIds, hydrated])
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('agrimarket.stock', JSON.stringify(stockOverrides))
  }, [stockOverrides, hydrated])
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('agrimarket.prices', JSON.stringify(priceOverrides))
  }, [priceOverrides, hydrated])
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('agrimarket.orders', JSON.stringify(orders))
  }, [orders, hydrated])
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('agrimarket.applications', JSON.stringify(applications))
  }, [applications, hydrated])
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(APPROVED_KEY, JSON.stringify(approvedSellerIds))
  }, [approvedSellerIds, hydrated])
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('agrimarket.reviews', JSON.stringify(reviews))
  }, [reviews, hydrated])
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('agrimarket.posts', JSON.stringify(posts))
  }, [posts, hydrated])
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('agrimarket.trades', JSON.stringify(trades))
  }, [trades, hydrated])
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('agrimarket.notifications', JSON.stringify(notifications))
  }, [notifications, hydrated])
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('agrimarket.sms', JSON.stringify(messages))
  }, [messages, hydrated])
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('agrimarket.follows', JSON.stringify(followedCategories))
  }, [followedCategories, hydrated])

  useEffect(() => {
    if (user && approvedSellerIds.includes(user.id)) addRole('seller')
  }, [user, approvedSellerIds, addRole])

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      setLoyaltyPoints(0)
      return
    }
    const raw = localStorage.getItem(`agrimarket.loyalty.${user.id}`)
    setLoyaltyPoints(raw ? Number(raw) : user.id === 3 ? 120 : 40)
  }, [user, hydrated])

  useEffect(() => {
    if (!hydrated || !user) return
    localStorage.setItem(`agrimarket.loyalty.${user.id}`, String(loyaltyPoints))
  }, [loyaltyPoints, user, hydrated])

  const notify = (item: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'>) => {
    const next: AppNotification = {
      ...item,
      id: `n-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      readBy: [],
      createdAt: new Date().toISOString(),
    }
    setNotifications((current) => [next, ...current].slice(0, 80))
    const visibleToMe = item.userId === 'all' || (user && item.userId === user.id)
    const categoryOk = !item.category || followedCategories.includes(item.category)
    if (visibleToMe && categoryOk && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(item.title, { body: item.message })
      } catch {
        /* ignore */
      }
    }
    void api.post('/notifications', next).catch(() => undefined)
  }

  const products = useMemo(() => {
    return [...extraProducts, ...catalogProducts]
      .filter((product) => !hiddenIds.includes(product.id))
      .map((product) => {
        const stock = stockOverrides[product.id] ?? product.stock
        const price = priceOverrides[product.id] ?? product.price
        const productReviews = reviews.filter((review) => review.productId === product.id)
        const rating = productReviews.length
          ? Number((productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length).toFixed(1))
          : product.rating
        return {
          ...product,
          photos: product.photos?.length ? product.photos : [product.image],
          lat: product.lat ?? 6.5004,
          lng: product.lng ?? 124.8436,
          sellerUserId: product.sellerUserId ?? (product.sellerId === 'seller-1' ? 2 : 0),
          tradeable: product.tradeable ?? true,
          priceHistory: product.priceHistory?.length ? product.priceHistory : [{ date: new Date().toISOString().slice(0, 10), price }],
          stock,
          price,
          rating,
          reviews: product.reviews + productReviews.filter((review) => !seedReviews.some((seed) => seed.id === review.id)).length,
        }
      })
  }, [extraProducts, hiddenIds, stockOverrides, priceOverrides, reviews])

  const addProduct: StoreContextType['addProduct'] = (product) => {
    const next: Product = {
      ...product,
      photos: product.photos?.length ? product.photos : [product.image],
      id: `custom-${Date.now()}`,
      seller: user ? `${user.firstName} ${user.lastName}` : 'Independent Farm',
      sellerId: user ? `user-${user.id}` : 'seller-local',
      sellerUserId: user?.id || 0,
      rating: 5,
      reviews: 0,
      priceHistory: [{ date: new Date().toISOString().slice(0, 10), price: product.price }],
      tradeable: product.tradeable ?? true,
      lat: product.lat || 6.5004,
      lng: product.lng || 124.8436,
    }
    setExtraProducts((current) => [next, ...current])
    notify({
      userId: 'all',
      title: `${next.category} listing just dropped`,
      message: `${next.seller} posted ${next.name} from ${next.location}.`,
      href: `/products/${next.id}`,
    })
    return next
  }

  const updateProductStock = (id: string, stock: number) => {
    setStockOverrides((current) => ({ ...current, [id]: Math.max(0, stock) }))
  }

  const updateProductPrice = (id: string, price: number) => {
    setPriceOverrides((current) => ({ ...current, [id]: Math.max(1, price) }))
    setExtraProducts((current) =>
      current.map((product) =>
        product.id === id
          ? {
              ...product,
              price,
              priceHistory: [...product.priceHistory, { date: new Date().toISOString().slice(0, 10), price }],
            }
          : product
      )
    )
  }

  const removeProduct = (id: string) => {
    setExtraProducts((current) => current.filter((product) => product.id !== id))
    if (catalogProducts.some((product) => product.id === id)) {
      setHiddenIds((current) => [...current, id])
    }
  }

  const placeOrder: StoreContextType['placeOrder'] = (order) => {
    const stamp = Date.now().toString().slice(-8)
    const redeemed = user ? Math.max(0, Math.min(order.pointsRedeemed || 0, loyaltyPoints)) : 0
    const earned = user ? pointsFromSpend(order.subtotal) : 0
    const next: Order = {
      ...order,
      pointsRedeemed: redeemed,
      pointsEarned: earned,
      id: `ORD-${stamp}`,
      receiptNo: `RCPT-${stamp}`,
      userId: user?.id || 0,
      buyerName: user ? `${user.firstName} ${user.lastName}` : 'Guest',
      buyerPhone: order.buyerPhone || user?.phone,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      driverId: undefined,
    }
    setOrders((current) => [next, ...current])
    if (user) setLoyaltyPoints((current) => Math.max(0, current - redeemed + earned))
    next.items.forEach((item) => {
      const product = products.find((entry) => entry.id === item.productId)
      if (product) updateProductStock(product.id, product.stock - item.quantity)
    })
    notify({
      userId: user?.id || 0,
      title: 'Order placed — waiting on seller',
      message: `${next.id} is with the farm stall. You will be pinged when they confirm.`,
      href: `/orders/${next.id}/receipt`,
    })
    const sellerIds = [...new Set(next.items.map((item) => item.sellerUserId).filter(Boolean))]
    sellerIds.forEach((sellerUserId) => {
      const lines = next.items
        .filter((item) => item.sellerUserId === sellerUserId)
        .map((item) => `${item.quantity}× ${item.name}`)
        .join(', ')
      notify({
        userId: sellerUserId,
        title: 'New buyer for your harvest',
        message: `${next.buyerName} ordered ${lines}. Confirm so a rider can pick up.`,
        href: '/seller-dashboard',
      })
    })
    return next
  }

  const submitApplication: StoreContextType['submitApplication'] = (payload) => {
    const next: SellerApplication = {
      ...payload,
      id: `APP-${Date.now().toString().slice(-8)}`,
      userId: user?.id || 0,
      name: user ? `${user.firstName} ${user.lastName}` : 'Guest',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    }
    setApplications((current) => [next, ...current.filter((item) => item.userId !== next.userId)])
    notify({
      userId: 1,
      title: 'Seller application pending',
      message: `${next.name} applied as ${next.farmName}.`,
      href: '/admin-dashboard',
    })
    return next
  }

  const reviewApplication = (id: string, status: 'Approved' | 'Rejected') => {
    setApplications((current) => {
      const target = current.find((item) => item.id === id)
      if (status === 'Approved' && target) {
        setApprovedSellerIds((ids) => (ids.includes(target.userId) ? ids : [...ids, target.userId]))
        grantRole(target.userId, 'seller')
        notify({
          userId: target.userId,
          title: 'You can sell now',
          message: `${target.farmName} is approved. List your first harvest.`,
          href: '/seller-dashboard',
        })
      }
      if (status === 'Rejected' && target) {
        notify({
          userId: target.userId,
          title: 'Seller application needs work',
          message: 'An admin declined the application. Update documents and resubmit.',
          href: '/become-seller',
        })
      }
      return current.map((item) => (item.id === id ? { ...item, status } : item))
    })
  }

  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders((current) =>
      current.map((order) => {
        if (order.id !== id) return order
        notify({
          userId: order.userId,
          title: `Order ${status.toLowerCase()}`,
          message: `${order.id} is now ${status}.`,
          href: '/orders',
        })
        return { ...order, status }
      })
    )
  }

  const confirmOrder = (id: string) => {
    setOrders((current) =>
      current.map((order) => {
        if (order.id !== id || order.status !== 'Pending') return order
        const harvest = order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')
        const pickup = order.items[0]?.pickupLocation || 'SOCCSKSARGEN stall'
        notify({
          userId: order.userId,
          title: 'Seller confirmed your order',
          message: `${order.id} is packed. A rider will pick up ${harvest}.`,
          href: '/orders',
        })
        notify({
          userId: DRIVER_ID,
          title: 'Ready for pickup',
          message: `Collect ${harvest} at ${pickup}. Buyer: ${order.buyerName} · ${order.buyerPhone || 'no mobile'} · drop-off ${order.address}.`,
          href: '/delivery',
        })
        void api
          .post('/delivery/deliveries', {
            orderId: order.id,
            driverId: DRIVER_ID,
            buyerName: order.buyerName,
            buyerPhone: order.buyerPhone,
            address: order.address,
            status: 'Confirmed',
            lat: order.lat,
            lng: order.lng,
          })
          .catch(() => undefined)
        return { ...order, status: 'Confirmed' as const, driverId: DRIVER_ID, sellerConfirmedAt: new Date().toISOString() }
      })
    )
  }

  const markShipped = (id: string) => {
    setOrders((current) =>
      current.map((order) => {
        if (order.id !== id || (order.status !== 'Confirmed' && order.status !== 'Pending')) return order
        notify({
          userId: order.userId,
          title: 'Your harvest is shipped',
          message: `The delivery rider collected ${order.id}. Watch for out-for-delivery updates.`,
          href: '/orders',
        })
        notify({
          userId: order.driverId || DRIVER_ID,
          title: 'Pickup complete',
          message: `Seller handed ${order.id} to you. Head to ${order.address}.`,
          href: '/delivery',
        })
        return { ...order, status: 'Shipped' as const, shippedAt: new Date().toISOString(), driverId: order.driverId || DRIVER_ID }
      })
    )
  }

  const assignDriver = (orderId: string, driverId: number) => {
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, driverId } : order)))
  }

  const myListings = useMemo(() => {
    if (!user) return []
    return products.filter((product) => {
      if (product.sellerUserId === user.id) return true
      if (product.sellerId === `user-${user.id}`) return true
      if (user.email === 'seller@agrimarket.com' && (product.sellerId === 'seller-1' || product.sellerUserId === 2)) return true
      return false
    })
  }, [products, user])

  const sellerOrders = useMemo(() => {
    if (!user) return []
    const listingIds = new Set(myListings.map((product) => product.id))
    return orders.filter((order) =>
      order.items.some((item) => listingIds.has(item.productId) || item.sellerUserId === user.id)
    )
  }, [orders, myListings, user])

  const addReview: StoreContextType['addReview'] = (payload) => {
    if (!user) return
    const next: Review = {
      ...payload,
      id: `rev-${Date.now()}`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      createdAt: new Date().toISOString(),
    }
    setReviews((current) => [next, ...current])
  }

  const addPost: StoreContextType['addPost'] = (payload) => {
    const next: Post = {
      ...payload,
      id: `post-${Date.now()}`,
      sellerId: user ? `user-${user.id}` : 'seller-local',
      sellerName: user ? `${user.firstName} ${user.lastName}` : 'Farm stall',
      createdAt: new Date().toISOString(),
    }
    setPosts((current) => [next, ...current])
    notify({
      userId: 'all',
      title: `${payload.category} update`,
      message: `${next.sellerName}: ${payload.body.slice(0, 90)}`,
      href: payload.productId ? `/products/${payload.productId}` : '/feed',
      category: payload.category,
    })
  }

  const followCategory = (category: string) => {
    setFollowedCategories((current) => (current.includes(category) ? current : [...current, category]))
  }
  const unfollowCategory = (category: string) => {
    setFollowedCategories((current) => current.filter((item) => item !== category))
  }

  const offerTrade: StoreContextType['offerTrade'] = (payload) => {
    if (!user) return
    const next: TradeOffer = {
      ...payload,
      id: `tr-${Date.now()}`,
      fromUserId: user.id,
      fromName: `${user.firstName} ${user.lastName}`,
      status: 'Open',
      createdAt: new Date().toISOString(),
    }
    setTrades((current) => [next, ...current])
    notify({
      userId: 'all',
      title: 'New trade offer',
      message: `${next.fromName} wants to trade ${next.fromProductName} for ${next.toProductName}.`,
      href: '/trades',
    })
  }

  const respondTrade = (id: string, status: 'Accepted' | 'Declined') => {
    setTrades((current) => current.map((trade) => (trade.id === id ? { ...trade, status } : trade)))
  }

  const applyCoupon: StoreContextType['applyCoupon'] = (code, shippingFee, subtotal) => {
    const coupon = shippingCoupons.find((item) => item.code.toLowerCase() === code.trim().toLowerCase())
    if (!coupon) return { ok: false, message: 'Coupon not found.', discount: 0 }
    if (subtotal < coupon.minOrder) {
      return { ok: false, message: `Spend at least ₱${coupon.minOrder} to use ${coupon.code}.`, discount: 0 }
    }
    const discount = coupon.type === 'percent' ? shippingFee * (coupon.value / 100) : Math.min(coupon.value, shippingFee)
    return { ok: true, message: `${coupon.code} applied to shipping only.`, discount, code: coupon.code }
  }

  const sendSms: StoreContextType['sendSms'] = (payload) => {
    const next: SmsMessage = {
      ...payload,
      id: `sms-${Date.now()}`,
      createdAt: new Date().toISOString(),
      channel: payload.phone ? 'sms' : 'in-app',
      status: payload.phone ? 'queued' : 'delivered',
      fromUserId: payload.fromUserId || user?.id,
    }
    setMessages((current) => [...current, next])
    notify({
      userId: payload.toUserId,
      title: payload.fromRole === 'delivery' ? 'SMS from your rider' : 'New message',
      message: payload.body,
      href: '/messages',
    })
    void api
      .post('/messages/sms', next)
      .then(() => {
        setMessages((current) => current.map((item) => (item.id === next.id ? { ...item, status: payload.phone ? 'sent' : 'delivered' } : item)))
      })
      .catch(() => {
        setMessages((current) => current.map((item) => (item.id === next.id ? { ...item, status: payload.phone ? 'sent' : 'delivered' } : item)))
      })
    return next
  }

  const visibleNotifications = useMemo(
    () =>
      notifications.filter((item) => {
        const forUser = item.userId === 'all' || (user && item.userId === user.id) || (user && user.roles.includes('admin') && item.userId === 1)
        if (!forUser) return false
        if (item.category && followedCategories.length > 0 && !followedCategories.includes(item.category)) return false
        return true
      }),
    [notifications, user, followedCategories]
  )

  const unreadCount = visibleNotifications.filter((item) => !user || !item.readBy.includes(user.id)).length

  const markNotificationRead = (id: string) => {
    if (!user) return
    setNotifications((current) =>
      current.map((item) => (item.id === id && !item.readBy.includes(user.id) ? { ...item, readBy: [...item.readBy, user.id] } : item))
    )
    void api.put(`/notifications/${id}/read`).catch(() => undefined)
  }

  const markNotificationsRead = () => {
    if (!user) return
    setNotifications((current) =>
      current.map((item) => {
        const mine = item.userId === 'all' || item.userId === user.id || (user.roles.includes('admin') && item.userId === 1)
        if (!mine || item.readBy.includes(user.id)) return item
        return { ...item, readBy: [...item.readBy, user.id] }
      })
    )
    void api.put('/notifications/read-all').catch(() => undefined)
  }

  const recommended = useMemo(
    () => [...products].filter((product) => product.stock > 0).sort((a, b) => recommendScore(b.rating, b.reviews) - recommendScore(a.rating, a.reviews)),
    [products]
  )

  const budgetPicks = (budget: number) => filterByBudget(products, budget)

  const salesSeries = useMemo(() => {
    const now = new Date()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return Array.from({ length: 12 }, (_, index) => {
      const monthOrders = orders.filter((order) => new Date(order.createdAt).getMonth() === index)
      const daily = monthOrders
        .filter((order) => new Date(order.createdAt).toDateString() === now.toDateString() && index === now.getMonth())
        .reduce((sum, order) => sum + order.total, 0)
      const monthly = monthOrders.reduce((sum, order) => sum + order.total, 0)
      const yearly = orders.filter((order) => new Date(order.createdAt).getFullYear() === now.getFullYear()).reduce((sum, order) => sum + order.total, 0)
      return { label: months[index], daily, monthly, yearly }
    })
  }, [orders])

  const categorySales = useMemo(() => {
    const buckets: Record<string, number> = {}
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const product = products.find((entry) => entry.id === item.productId)
        const key = product?.category || 'Other'
        buckets[key] = (buckets[key] || 0) + item.price * item.quantity
      })
    })
    return Object.entries(buckets).map(([name, value]) => ({ name, value }))
  }, [orders, products])

  const value = useMemo<StoreContextType>(
    () => ({
      products,
      orders,
      applications,
      reviews,
      posts,
      trades,
      notifications: visibleNotifications,
      messages,
      followedCategories,
      addProduct,
      updateProductStock,
      updateProductPrice,
      removeProduct,
      placeOrder,
      myOrders: orders.filter((order) => user && order.userId === user.id),
      submitApplication,
      myApplication: applications.find((item) => user && item.userId === user.id),
      reviewApplication,
      updateOrderStatus,
      confirmOrder,
      markShipped,
      assignDriver,
      myListings,
      sellerOrders,
      addReview,
      reviewsFor: (productId: string) => reviews.filter((review) => review.productId === productId),
      addPost,
      followCategory,
      unfollowCategory,
      offerTrade,
      respondTrade,
      applyCoupon,
      sendSms,
      markNotificationsRead,
      markNotificationRead,
      unreadCount,
      recommended,
      budgetPicks,
      loyaltyPoints,
      salesSeries,
      categorySales,
    }),
    [products, orders, applications, reviews, posts, trades, visibleNotifications, messages, followedCategories, user, myListings, sellerOrders, unreadCount, recommended, salesSeries, categorySales, loyaltyPoints]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within a StoreProvider')
  return context
}
