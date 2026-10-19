import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { products as catalogProducts, shippingCoupons, categories, type Product } from '../data/catalog'
export type { Product }
import { recommendScore } from '../lib/utils'
import { filterByBudget, pointsFromSpend } from '../lib/commerce'
import { useAuth } from './AuthContext'
import api from '../services/api'
import { getSocket } from '../services/socket'
import { initCentralSync, publishSyncEvent, subscribeToSync } from '../services/centralSync'

export type OrderItem = {
  productId: string
  name: string
  price: number
  quantity: number
  unit?: string
  image: string
  seller: string
  sellerId: string
  sellerUserId: number
  pickupLocation: string
  prepStatus?: 'unpacked' | 'packing' | 'packed'
  prepNotes?: string
  packedAt?: string
  sellerConfirmed?: boolean
  sellerConfirmedAt?: string
  isMine?: boolean
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
  paymentRef?: string
  statusHistory?: Array<{
    status: string
    changedBy?: number
    changedByName?: string
    changedByRole?: string
    timestamp: string
    note?: string
  }>
  driverId?: number
  lat?: number
  lng?: number
  sellerConfirmedAt?: string
  shippedAt?: string
  trackingNumber?: string
  prepStatus?: 'unpacked' | 'packing' | 'packed'
  packingNotes?: string
  packedAt?: string
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
  status: 'Pending' | 'Approved' | 'Rejected' | 'Needs Revision'
  reviewNotes?: string
  reviewedBy?: string
  createdAt: string
  reviewedAt?: string
}

export type Review = {
  id: string
  productId: string
  productName?: string
  seller?: string
  userId: number
  userName: string
  rating: number
  comment: string
  photos: string[]
  status?: 'published' | 'hidden' | 'flagged'
  moderationReason?: string
  createdAt: string
}

export type CategoryItem = {
  id: string
  name: string
  description: string
  icon?: string
  imageUrl?: string
  productCount?: number
  totalProductCount?: number
}

export type PromotionCoupon = {
  code: string
  discount: number
  type: 'fixed' | 'percentage' | 'shipping'
  minSpend: number
  description: string
  isActive: boolean
  createdAt?: string
}

export type AdminUser = {
  id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
  roles: string[]
  is_verified: boolean
  is_active: boolean
  suspension_reason?: string
  suspended_at?: string
  created_at: string
}

export type AuditLog = {
  id: string
  adminId: number
  adminEmail: string
  action: string
  targetType: string
  targetId: string
  details: string
  ipAddress?: string
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
  fromProductImage?: string
  offerQuantity?: number
  offerUnit?: string
  offerValue?: number
  toSellerId: string
  toSellerName?: string
  toProductId: string
  toProductName: string
  toProductImage?: string
  wantQuantity?: number
  wantUnit?: string
  wantValue?: number
  cashOffset?: number
  note: string
  status: 'Open' | 'Accepted' | 'Declined' | 'Countered'
  counterOffer?: {
    counterQuantity?: number
    counterCashOffset?: number
    counterNote?: string
    counterBy?: string
    counterAt?: string
  }
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
  fromRole: 'delivery' | 'buyer' | 'system' | 'seller' | 'admin'
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
  allProducts: Product[]
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
  updateProduct: (id: string, updates: Partial<Product>) => void
  updateProductStock: (id: string, stock: number) => void
  updateProductPrice: (id: string, price: number) => void
  setProductAvailability: (id: string, status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'temporarily_unavailable') => void
  removeProduct: (id: string) => void
  unlistProduct: (id: string, unlisted?: boolean) => void
  refreshCatalog: () => Promise<void>
  placeOrder: (order: Omit<Order, 'id' | 'createdAt' | 'userId' | 'status' | 'receiptNo' | 'buyerName' | 'pointsEarned'> & { pointsRedeemed?: number }) => Order
  myOrders: Order[]
  submitApplication: (payload: Omit<SellerApplication, 'id' | 'createdAt' | 'status' | 'userId' | 'name'>) => SellerApplication
  myApplication: SellerApplication | undefined
  reviewApplication: (id: string, status: 'Approved' | 'Rejected' | 'Needs Revision', reviewNotes?: string) => void
  updateOrderStatus: (id: string, status: Order['status']) => void
  cancelOrder: (id: string, reason?: string) => Promise<boolean>
  updateOrderItemPrep: (orderId: string, productId: string, prepStatus: 'unpacked' | 'packing' | 'packed', notes?: string) => void
  packOrder: (orderId: string, packingNotes?: string) => void
  confirmOrder: (id: string, driverId?: number) => void
  confirmOrderItem: (orderId: string, productId: string) => Promise<boolean>
  markShipped: (id: string) => void
  assignDriver: (orderId: string, driverId: number) => Promise<void>
  sellerOrders: Order[]
  myListings: Product[]
  addReview: (payload: Omit<Review, 'id' | 'createdAt' | 'userId' | 'userName'>) => void
  reviewsFor: (productId: string) => Review[]
  addPost: (payload: Omit<Post, 'id' | 'createdAt' | 'sellerId' | 'sellerName'>) => void
  followCategory: (category: string) => void
  unfollowCategory: (category: string) => void
  offerTrade: (
    payload: Omit<TradeOffer, 'id' | 'createdAt' | 'fromUserId' | 'fromName' | 'status'> & {
      id?: string
      fromUserId?: number
      fromName?: string
      status?: 'Open' | 'Accepted' | 'Declined' | 'Countered'
      createdAt?: string
    }
  ) => void
  respondTrade: (
    id: string,
    status: 'Accepted' | 'Declined' | 'Countered',
    counterDetails?: { counterQuantity?: number; counterCashOffset?: number; counterNote?: string }
  ) => void
  syncTrades: () => Promise<void>
  notify: (item: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'>) => void
  applyCoupon: (code: string, shippingFee: number, subtotal: number) => CouponResult
  sendSms: (payload: Omit<SmsMessage, 'id' | 'createdAt' | 'channel' | 'status'>) => SmsMessage
  markNotificationsRead: () => void
  markNotificationRead: (id: string) => void
  unreadCount: number
  recommended: Product[]
  budgetPicks: (budget: number) => Product[]
  loyaltyPoints: number
  wishlist: string[]
  toggleWishlist: (productId: string) => void
  isWishlisted: (productId: string) => boolean
  claimedVouchers: string[]
  claimVoucher: (code: string) => boolean
  checkInDaily: () => { success: boolean; pointsAdded: number; streak: number }
  streakDays: number
  lastCheckInDate: string | null
  syncStatus: 'online' | 'syncing' | 'offline'
  salesSeries: { label: string; daily: number; monthly: number; yearly: number }[]
  categorySales: { name: string; value: number }[]
  // Administrative Operations
  categoriesList: CategoryItem[]
  refreshCategories: () => Promise<void>
  createCategory: (cat: Partial<CategoryItem>) => Promise<void>
  updateCategory: (id: string, updates: Partial<CategoryItem>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  promotions: PromotionCoupon[]
  refreshPromotions: () => Promise<void>
  createPromotion: (promo: Partial<PromotionCoupon>) => Promise<void>
  updatePromotion: (code: string, updates: Partial<PromotionCoupon>) => Promise<void>
  deletePromotion: (code: string) => Promise<void>
  usersList: AdminUser[]
  refreshUsers: () => Promise<void>
  updateUserStatus: (id: number, isActive: boolean, reason?: string) => Promise<void>
  updateUserRoles: (id: number, roles: string[]) => Promise<void>
  auditLogs: AuditLog[]
  refreshAuditLogs: () => Promise<void>
  moderateProduct: (id: string, action: 'approve' | 'flag' | 'delist' | 'reject', reason?: string) => Promise<void>
  moderateReview: (id: string, status: 'published' | 'hidden' | 'flagged', reason?: string) => Promise<void>
  deleteReview: (id: string) => Promise<void>
  // Rider & Logistics
  ridersList: AdminUser[]
  refreshRiders: () => Promise<void>
  createRider: (data: { firstName: string; lastName: string; phone: string; email: string; password: string }) => Promise<AdminUser>
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
    sellerId: 'seller-2',
    sellerName: 'Maria Santos',
    productId: 'p-tomato',
    productName: 'Salad Tomatoes',
    body: 'Dawn harvest of salad tomatoes is packed in Polomolok. Tagging Vegetables — first 40 kilos get ice packs for free.',
    photos: ['/images/tomato.jpg', '/images/farm.jpg'],
    category: 'Vegetables',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'post-2',
    sellerId: 'seller-13',
    sellerName: 'Eduardo Dizon',
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
    items: [{ productId: 'p-rice', name: 'Dinorado Rice', price: 58, quantity: 10, image: '/images/rice.jpg', seller: 'Lilia Mendoza', sellerId: 'seller-15', sellerUserId: 15, pickupLocation: 'Tacurong City, Sultan Kudarat' }],
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
    items: [{ productId: 'p-eggs', name: 'Free-Range Eggs', price: 220, quantity: 2, image: '/images/eggs.jpg', seller: 'Nestor Aquino', sellerId: 'seller-16', sellerUserId: 16, pickupLocation: 'Koronadal City, South Cotabato' }],
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
    items: [{ productId: 'p-tomato', name: 'Salad Tomatoes', price: 85, quantity: 5, image: '/images/tomato.jpg', seller: 'Maria Santos', sellerId: 'seller-2', sellerUserId: 2, pickupLocation: 'Polomolok, South Cotabato' }],
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

export const CATEGORY_SELLER_MAP: Record<string, {
  fullName: string;
  farmName: string;
  sellerUserId: number;
  sellerId: string;
  location: string;
}> = {
  Fruits: { fullName: 'Eduardo Dizon', farmName: 'Midsayap Gold Orchard', sellerUserId: 13, sellerId: 'seller-13', location: 'Midsayap, Cotabato' },
  Vegetables: { fullName: 'Maria Santos', farmName: 'Green Valley Farm', sellerUserId: 2, sellerId: 'seller-2', location: 'Polomolok, South Cotabato' },
  Rice: { fullName: 'Lilia Mendoza', farmName: 'Tacurong Rice Mills', sellerUserId: 15, sellerId: 'seller-15', location: 'Tacurong City, Sultan Kudarat' },
  Grains: { fullName: 'Juanita Reyes', farmName: 'Koronadal Grain Farms', sellerUserId: 12, sellerId: 'seller-12', location: 'Koronadal City, South Cotabato' },
  'Rice & Grains': { fullName: 'Juanita Reyes', farmName: 'Koronadal Grain Farms', sellerUserId: 12, sellerId: 'seller-12', location: 'Koronadal City, South Cotabato' },
  Fish: { fullName: 'Danilo Blaan', farmName: 'Lake Sebu Fisheries', sellerUserId: 17, sellerId: 'seller-17', location: 'Lake Sebu, South Cotabato' },
  Poultry: { fullName: 'Nestor Aquino', farmName: 'Koronadal Sunrise Poultry', sellerUserId: 16, sellerId: 'seller-16', location: 'Koronadal City, South Cotabato' },
  Livestock: { fullName: 'Ramon Valdez', farmName: 'Surallah Dairy Farm', sellerUserId: 18, sellerId: 'seller-18', location: 'Surallah, South Cotabato' },
  'Farm Supplies': { fullName: 'Roberto Tan', farmName: 'Gensan Agri Supply', sellerUserId: 14, sellerId: 'seller-14', location: 'General Santos City' },
  Seeds: { fullName: 'Roberto Tan', farmName: 'Gensan Agri Supply', sellerUserId: 14, sellerId: 'seller-14', location: 'General Santos City' },
};

export function normalizeProductSeller(product: Product): Product {
  let cat = product.category || 'Vegetables';
  if (cat === 'Rice & Grains') {
    cat = (product.name || '').toLowerCase().includes('rice') ? 'Rice' : 'Grains';
  }
  const catMap = CATEGORY_SELLER_MAP[cat] || CATEGORY_SELLER_MAP[product.category];

  const isCustomUserProduct =
    Boolean(product.sellerUserId && Number(product.sellerUserId) > 100) ||
    Boolean(product.sellerId && product.sellerId.startsWith('user-'));

  const seller = isCustomUserProduct && product.seller && !product.seller.toLowerCase().startsWith('seller')
    ? product.seller
    : catMap
    ? catMap.fullName
    : product.seller && !product.seller.toLowerCase().startsWith('seller')
    ? product.seller
    : 'Maria Santos';

  const sellerId = isCustomUserProduct && product.sellerId
    ? product.sellerId
    : catMap
    ? catMap.sellerId
    : product.sellerId || 'seller-2';

  const sellerUserId = isCustomUserProduct && product.sellerUserId
    ? Number(product.sellerUserId)
    : catMap
    ? catMap.sellerUserId
    : Number(product.sellerUserId) || 2;

  const location = product.location && product.location.trim() && product.location !== 'Farm Stall'
    ? product.location
    : catMap?.location || 'Polomolok, South Cotabato';

  return {
    ...product,
    category: cat,
    seller,
    sellerId,
    sellerUserId,
    location,
  };
}

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
  const [centralProducts, setCentralProducts] = useState<Product[]>(() => {
    const deletedIds = new Set(readJson<string[]>('agrimarket.deleted_products', []))
    const stored = readJson<Product[] | null>('agrimarket.products', null)
    if (stored && stored.length > 0) {
      const storedIds = new Set(stored.map((p) => p.id))
      return [...stored.map(normalizeProductSeller), ...catalogProducts.filter((p) => !storedIds.has(p.id)).map(normalizeProductSeller)].filter(
        (p) => !deletedIds.has(p.id) && !p.isDeleted
      )
    }
    return catalogProducts.map(normalizeProductSeller).filter((p) => !deletedIds.has(p.id))
  })
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
  const [wishlist, setWishlist] = useState<string[]>([])
  const [claimedVouchers, setClaimedVouchers] = useState<string[]>(['FREESHIP', 'NEWBUYER50'])
  const [streakDays, setStreakDays] = useState(1)
  const [lastCheckInDate, setLastCheckInDate] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<'online' | 'syncing' | 'offline'>('online')
  const [hydrated, setHydrated] = useState(false)

  const initialCatItems: CategoryItem[] = useMemo(
    () =>
      categories.map((c) => ({
        id: `cat-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: c.name,
        description: c.description,
        icon: c.emoji,
        imageUrl: c.image,
      })),
    []
  )

  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(initialCatItems)
  const [promotions, setPromotions] = useState<PromotionCoupon[]>(
    shippingCoupons.map((c) => ({
      code: c.code,
      discount: c.value,
      type: c.code === 'FREESHIP' ? 'shipping' : c.type === 'percent' ? 'percentage' : 'fixed',
      minSpend: c.minOrder,
      description: c.description,
      isActive: true,
    }))
  )
  const [usersList, setUsersList] = useState<AdminUser[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [ridersList, setRidersList] = useState<AdminUser[]>([
    {
      id: 4,
      email: 'driver@agrimarket.com',
      first_name: 'Rico',
      last_name: 'Driver',
      phone: '09363894541',
      roles: ['delivery'],
      is_verified: true,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ])

  const refreshCatalog = async () => {
    try {
      const res = await api.get<{ success?: boolean; data?: { products: Product[] }; products?: Product[] }>(
        '/products?includeInactive=true&pageSize=500'
      )
      const remoteProducts = res.data?.data?.products || (Array.isArray(res.data) ? res.data : res.data?.products)
      if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
        setCentralProducts((current) => {
          const deletedIds = new Set(readJson<string[]>('agrimarket.deleted_products', []))
          const currentMap = new Map<string, Product>(current.map((p) => [p.id, p]))
          const mergedRemote = remoteProducts
            .filter((p) => !deletedIds.has(p.id) && !p.isDeleted)
            .map((remote) => {
              const existing = currentMap.get(remote.id)
              if (!existing) return remote

              // If remote has an image that is not empty, use remote image so cross-device edits sync
              const image = remote.image || existing.image || '/images/farm.jpg'
              const photos = remote.photos && remote.photos.length ? remote.photos : [image]

              return {
                ...existing,
                ...remote,
                image,
                photos,
              }
            })
          const remoteIds = new Set(remoteProducts.map((p) => p.id))
          const localOnly = current.filter((p) => !remoteIds.has(p.id) && !deletedIds.has(p.id) && !p.isDeleted)
          const nextCatalog = [...localOnly, ...mergedRemote]
          try {
            localStorage.setItem('agrimarket.products', JSON.stringify(nextCatalog))
          } catch {
            // ignore localStorage quota error
          }
          return nextCatalog
        })
      }
    } catch (err) {
      console.warn('Central database catalog sync error:', err)
    }
  }

  const syncApplications = async () => {
    try {
      const res = await api.get<{ success?: boolean; data?: SellerApplication[] }>('/sellers/applications')
      const remoteApps = res.data?.data || (Array.isArray(res.data) ? res.data : [])
      if (Array.isArray(remoteApps) && remoteApps.length > 0) {
        setApplications((current) => {
          const map = new Map<string, SellerApplication>()
          current.forEach((app) => map.set(app.id, app))
          remoteApps.forEach((app) => map.set(app.id, app))
          return Array.from(map.values())
        })
        const approvedIds = remoteApps.filter((app) => app.status === 'Approved').map((app) => app.userId)
        if (approvedIds.length > 0) {
          setApprovedSellerIds((prev) => Array.from(new Set([...prev, ...approvedIds])))
        }
      }
    } catch {
      /* ignore sync error in offline mode */
    }
  }

  const syncTrades = async () => {
    try {
      const res = await api.get<{ success?: boolean; data?: { trades: TradeOffer[] } }>('/trades')
      const remoteTrades = res.data?.data?.trades
      if (Array.isArray(remoteTrades) && remoteTrades.length > 0) {
        setTrades((current) => {
          const map = new Map<string, TradeOffer>()
          current.forEach((t) => map.set(t.id, t))
          remoteTrades.forEach((t) => map.set(t.id, t))
          const merged = Array.from(map.values())
          try {
            localStorage.setItem('agrimarket.trades', JSON.stringify(merged))
          } catch {}
          return merged
        })
      }
    } catch {
      /* ignore sync error in offline mode */
    }
  }

  useEffect(() => {
    const storedProducts = readJson<Product[] | null>('agrimarket.products', null)
    if (storedProducts && storedProducts.length > 0) {
      const storedIds = new Set(storedProducts.map((p) => p.id))
      setCentralProducts([...storedProducts, ...catalogProducts.filter((p) => !storedIds.has(p.id))])
    }
    setStockOverrides(readJson('agrimarket.stock', {}))
    setPriceOverrides(readJson('agrimarket.prices', {}))
    const storedOrders = readJson<Order[] | null>('agrimarket.orders', null)
    setOrders(storedOrders && storedOrders.length ? storedOrders : seedOrders)
    setApplications(readJson('agrimarket.applications', []))
    setApprovedSellerIds(readJson(APPROVED_KEY, []))
    setReviews(readJson('agrimarket.reviews', seedReviews))
    setPosts(readJson('agrimarket.posts', seedPosts))
    setTrades(readJson('agrimarket.trades', []))
    setWishlist(readJson('agrimarket.wishlist', ['p-mango', 'p-tomato']))
    setClaimedVouchers(readJson('agrimarket.claimedVouchers', ['FREESHIP', 'NEWBUYER50', 'SHIP50']))
    setStreakDays(readJson('agrimarket.streakDays', 1))
    setLastCheckInDate(readJson('agrimarket.lastCheckInDate', null))
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
        phone: '09363894541',
        body: 'Good day po! Eggs are out for delivery, ETA 4:20 PM. Please keep GCash or cash ready.',
        createdAt: new Date().toISOString(),
        channel: 'sms',
        status: 'delivered',
      },
    ]))
    setFollowedCategories(readJson('agrimarket.follows', ['Vegetables', 'Fruits']))
    setHydrated(true)

    // Sync products and seller applications from central database on mount
    refreshCatalog()
    syncApplications()
    void syncTrades()
    void refreshCategories()
    void refreshPromotions()
    void refreshRiders()

    // Hydrate backend orders only if user is logged in
    if (localStorage.getItem('token')) {
      api.get<{ success?: boolean; data?: Order[] }>('/orders')
        .then((res) => {
          const remoteOrders = res.data?.data || (Array.isArray(res.data) ? res.data : [])
          if (Array.isArray(remoteOrders) && remoteOrders.length > 0) {
            setOrders((current) => {
              const map = new Map<string, Order>()
              current.forEach((o) => map.set(o.id, o))
              remoteOrders.forEach((o) => map.set(o.id, o))
              return Array.from(map.values())
            })
          }
        })
        .catch(() => undefined)
    }

    // Connect real-time socket events across all devices (phones, laptops, tablets)
    const socket = getSocket()

    // 1. When a product is created anywhere, immediately show on all devices
    socket.on('product_created', (newProd: Product) => {
      setCentralProducts((current) => {
        const updated = [newProd, ...current.filter((p) => p.id !== newProd.id)]
        try {
          saveStorage('agrimarket.products', updated)
        } catch {}
        return updated
      })
    })
    socket.on('new_product', (newProd: Product) => {
      setCentralProducts((current) => {
        const updated = [newProd, ...current.filter((p) => p.id !== newProd.id)]
        try {
          saveStorage('agrimarket.products', updated)
        } catch {}
        return updated
      })
    })

    // 2. When a product is updated, immediately update across all devices
    socket.on('product_updated', (updatedProd: Product) => {
      setCentralProducts((current) => {
        const updated = current.map((p) => (p.id === updatedProd.id ? { ...p, ...updatedProd } : p))
        try {
          localStorage.setItem('agrimarket.products', JSON.stringify(updated))
        } catch {}
        return updated
      })
    })

    // 3. When a product is unlisted by Admin, immediately update visibility across all devices
    socket.on('product_unlisted', ({ id, isUnlisted }: { id: string; isUnlisted: boolean }) => {
      setCentralProducts((current) => {
        const updated = current.map((p) => (p.id === id ? { ...p, isUnlisted, isActive: !isUnlisted } : p))
        try {
          localStorage.setItem('agrimarket.products', JSON.stringify(updated))
        } catch {}
        return updated
      })
    })

    // 4. When a product is deleted, immediately purge from all screens worldwide!
    socket.on('product_deleted', ({ id }: { id: string }) => {
      const deletedList = readJson<string[]>('agrimarket.deleted_products', [])
      if (!deletedList.includes(id)) {
        try {
          localStorage.setItem('agrimarket.deleted_products', JSON.stringify([...deletedList, id]))
        } catch {}
      }
      setCentralProducts((current) => {
        const updated = current.filter((p) => p.id !== id)
        try {
          localStorage.setItem('agrimarket.products', JSON.stringify(updated))
        } catch {}
        return updated
      })
    })

    // 5. Catalog change broad sync
    socket.on('catalog_changed', () => {
      refreshCatalog()
    })

    // 6. Live order updates across devices
    socket.on('order_update', (ord: Order) => {
      setOrders((current) => [ord, ...current.filter((o) => o.id !== ord.id)])
    })
    socket.on('order_updated', (ord: Order) => {
      setOrders((current) => [ord, ...current.filter((o) => o.id !== ord.id)])
    })
    socket.on('order_created', (ord: Order) => {
      setOrders((current) => [ord, ...current.filter((o) => o.id !== ord.id)])
    })
    socket.on('new_order', (ord: Order) => {
      setOrders((current) => [ord, ...current.filter((o) => o.id !== ord.id)])
    })

    // 7. Seller application real-time sync across devices
    socket.on('seller_application_submitted', (app: SellerApplication) => {
      setApplications((current) => [app, ...current.filter((a) => a.id !== app.id)])
    })
    socket.on('application_created', (app: SellerApplication) => {
      setApplications((current) => [app, ...current.filter((a) => a.id !== app.id)])
    })
    socket.on('seller_application_reviewed', (app: SellerApplication) => {
      setApplications((current) => current.map((a) => (a.id === app.id ? { ...a, ...app } : a)))
      if (app.status === 'Approved') {
        setApprovedSellerIds((prev) => (prev.includes(app.userId) ? prev : [...prev, app.userId]))
      }
    })
    socket.on('seller_application_updated', (app: SellerApplication) => {
      setApplications((current) => current.map((a) => (a.id === app.id ? { ...a, ...app } : a)))
    })
    socket.on('role_granted', ({ userId, role }: { userId: number; role: string }) => {
      if (role === 'seller') {
        setApprovedSellerIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]))
      }
    })

    socket.on('notification', (notif: AppNotification) => {
      setNotifications((current) => [notif, ...current.filter((n) => n.id !== notif.id)])
    })

    socket.on('user_status_updated', () => {
      void refreshUsers()
    })
    socket.on('audit_logged', () => {
      void refreshAuditLogs()
    })
    socket.on('category_updated', () => {
      void refreshCategories()
    })
    socket.on('promotion_updated', () => {
      void refreshPromotions()
    })
    socket.on('rider_created', () => {
      void refreshRiders()
      void refreshUsers()
    })
    socket.on('delivery_assigned', () => {
      void refreshCatalog()
    })

    // 8. Real-Time Central Cloud Sync across all devices (phones, PCs, tablets)
    const unsubscribeCentralSync = subscribeToSync((payload) => {
      if (payload.type === 'ORDER_CREATED') {
        const ord = payload.data?.order as Order
        if (ord?.id) {
          setOrders((current) => [ord, ...current.filter((o) => o.id !== ord.id)])
        }
      } else if (payload.type === 'ORDER_STATUS_UPDATED') {
        const { orderId, status, driverId } = payload.data || {}
        if (orderId && status) {
          setOrders((current) =>
            current.map((o) =>
              o.id === orderId
                ? { ...o, status, ...(driverId ? { driverId } : {}) }
                : o
            )
          )
        }
      } else if (payload.type === 'PRODUCT_ADDED') {
        const prod = payload.data?.product as Product
        if (prod?.id) {
          setCentralProducts((current) => [prod, ...current.filter((p) => p.id !== prod.id)])
        }
      } else if (payload.type === 'PRODUCT_UPDATED') {
        const prod = payload.data?.product as Product
        const productId = payload.data?.productId || prod?.id
        const updates = payload.data?.updates || prod
        if (productId && updates) {
          setCentralProducts((current) => {
            const next = current.map((p) => (p.id === productId ? normalizeProductSeller({ ...p, ...updates }) : p))
            try {
              localStorage.setItem('agrimarket.products', JSON.stringify(next))
            } catch {}
            return next
          })
        }
      } else if (payload.type === 'PRODUCT_DELETED') {
        const productId = payload.data?.productId || payload.data?.id
        if (productId) {
          const deletedList = readJson<string[]>('agrimarket.deleted_products', [])
          if (!deletedList.includes(productId)) {
            try {
              localStorage.setItem('agrimarket.deleted_products', JSON.stringify([...deletedList, productId]))
            } catch {}
          }
          setCentralProducts((current) => {
            const next = current.filter((p) => p.id !== productId)
            try {
              localStorage.setItem('agrimarket.products', JSON.stringify(next))
            } catch {}
            return next
          })
        }
      } else if (payload.type === 'PRODUCT_STOCK_UPDATED') {
        const { productId, stock } = payload.data || {}
        if (productId !== undefined && stock !== undefined) {
          setStockOverrides((current) => ({ ...current, [productId]: stock }))
        }
      } else if (payload.type === 'APPLICATION_SUBMITTED') {
        const app = payload.data?.application as SellerApplication
        if (app?.id) {
          setApplications((current) => [app, ...current.filter((a) => a.id !== app.id)])
        }
      } else if (payload.type === 'APPLICATION_REVIEWED') {
        const { id, status, userId } = payload.data || {}
        if (id && status) {
          setApplications((current) => current.map((a) => (a.id === id ? { ...a, status } : a)))
          if (status === 'Approved' && userId) {
            setApprovedSellerIds((ids) => (ids.includes(userId) ? ids : [...ids, userId]))
          }
        }
      } else if (payload.type === 'MESSAGE_SENT') {
        const msg = payload.data?.message as SmsMessage
        if (msg?.id) {
          setMessages((current) => [...current.filter((m) => m.id !== msg.id), msg])
        }
      } else if (payload.type === 'NOTIFICATION_CREATED') {
        const notif = payload.data?.notification as AppNotification
        if (notif?.id) {
          setNotifications((current) => [notif, ...current.filter((n) => n.id !== notif.id)])
        }
      } else if (payload.type === 'REVIEW_ADDED') {
        const rev = payload.data?.review as Review
        if (rev?.id) {
          setReviews((current) => [rev, ...current.filter((r) => r.id !== rev.id)])
        }
      } else if (payload.type === 'POST_CREATED') {
        const post = payload.data?.post as Post
        if (post?.id) {
          setPosts((current) => [post, ...current.filter((p) => p.id !== post.id)])
        }
      }
    })

    const stopCentralSync = initCentralSync()

    // Periodic synchronization heartbeat across all devices
    const syncInterval = setInterval(() => {
      void refreshCatalog()
      void syncApplications()
      if (localStorage.getItem('token')) {
        api.get<{ success?: boolean; data?: Order[] }>('/orders')
          .then((res) => {
            const remoteOrders = res.data?.data || (Array.isArray(res.data) ? res.data : [])
            if (Array.isArray(remoteOrders) && remoteOrders.length > 0) {
              setOrders((current) => {
                const map = new Map<string, Order>()
                current.forEach((o) => map.set(o.id, o))
                remoteOrders.forEach((o) => map.set(o.id, o))
                return Array.from(map.values())
              })
            }
          })
          .catch(() => undefined)
      }
    }, 4000)

    return () => {
      clearInterval(syncInterval)
      unsubscribeCentralSync()
      if (stopCentralSync) stopCentralSync()
    }
  }, [])

  const saveStorage = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      console.warn("Storage skipped for " + key, err)
    }
  }

  useEffect(() => {
    if (!hydrated) return
    saveStorage('agrimarket.products', centralProducts)
  }, [centralProducts, hydrated])
  useEffect(() => {
    if (!hydrated) return
    saveStorage('agrimarket.stock', stockOverrides)
  }, [stockOverrides, hydrated])
  useEffect(() => {
    if (!hydrated) return
    saveStorage('agrimarket.prices', priceOverrides)
  }, [priceOverrides, hydrated])
  useEffect(() => {
    if (!hydrated) return
    saveStorage('agrimarket.orders', orders)
  }, [orders, hydrated])
  useEffect(() => {
    if (!hydrated) return
    saveStorage('agrimarket.applications', applications)
  }, [applications, hydrated])
  useEffect(() => {
    if (!hydrated) return
    saveStorage(APPROVED_KEY, approvedSellerIds)
  }, [approvedSellerIds, hydrated])
  useEffect(() => {
    if (!hydrated) return
    saveStorage('agrimarket.reviews', reviews)
  }, [reviews, hydrated])
  useEffect(() => {
    if (!hydrated) return
    saveStorage('agrimarket.posts', posts)
  }, [posts, hydrated])
  useEffect(() => {
    if (!hydrated) return
    saveStorage('agrimarket.trades', trades)
  }, [trades, hydrated])
  useEffect(() => {
    if (!hydrated) return
    saveStorage('agrimarket.notifications', notifications)
  }, [notifications, hydrated])
  useEffect(() => {
    if (!hydrated) return
    saveStorage('agrimarket.sms', messages)
  }, [messages, hydrated])
  useEffect(() => {
    if (!hydrated) return
    saveStorage('agrimarket.follows', followedCategories)
  }, [followedCategories, hydrated])

  useEffect(() => {
    if (!hydrated) return
    saveStorage('agrimarket.wishlist', wishlist)
  }, [wishlist, hydrated])

  useEffect(() => {
    if (!hydrated) return
    saveStorage('agrimarket.claimedVouchers', claimedVouchers)
  }, [claimedVouchers, hydrated])

  useEffect(() => {
    if (!hydrated) return
    saveStorage('agrimarket.streakDays', streakDays)
    saveStorage('agrimarket.lastCheckInDate', lastCheckInDate)
  }, [streakDays, lastCheckInDate, hydrated])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || !event.newValue) return
      try {
        if (event.key === 'agrimarket.products') setCentralProducts(JSON.parse(event.newValue))
        if (event.key === 'agrimarket.stock') setStockOverrides(JSON.parse(event.newValue))
        if (event.key === 'agrimarket.prices') setPriceOverrides(JSON.parse(event.newValue))
        if (event.key === 'agrimarket.orders') setOrders(JSON.parse(event.newValue))
        if (event.key === 'agrimarket.wishlist') setWishlist(JSON.parse(event.newValue))
        if (event.key === 'agrimarket.notifications') setNotifications(JSON.parse(event.newValue))
        if (event.key === 'agrimarket.claimedVouchers') setClaimedVouchers(JSON.parse(event.newValue))
        if (event.key === 'agrimarket.sms') setMessages(JSON.parse(event.newValue))
      } catch (err) {
        console.error('Storage sync error:', err)
      }
    }
    const handleOnline = () => setSyncStatus(navigator.onLine ? 'online' : 'offline')
    const handleOffline = () => setSyncStatus('offline')
    setSyncStatus(navigator.onLine ? 'online' : 'offline')
    window.addEventListener('storage', handleStorage)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const isApproved =
      approvedSellerIds.includes(user.id) ||
      applications.some((app) => app.userId === user.id && app.status === 'Approved')
    if (isApproved && !user.roles.includes('seller')) {
      addRole('seller')
    }
  }, [user, approvedSellerIds, applications, addRole])

  useEffect(() => {
    if (user?.roles.includes('admin') || user?.roles.includes('seller')) {
      void refreshRiders()
    }
    if (user?.roles.includes('admin')) {
      void refreshUsers()
      void refreshAuditLogs()
      void syncApplications()
    }
  }, [user])

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
    void publishSyncEvent('NOTIFICATION_CREATED', { notification: next })
  }


  const allProducts = useMemo<Product[]>(() => {
    return centralProducts.map((rawProduct) => {
      const product = normalizeProductSeller(rawProduct)
      const stock = stockOverrides[product.id] ?? product.stock
      const price = priceOverrides[product.id] ?? product.price
      const productReviews = reviews.filter((review) => review.productId === product.id && review.status !== 'hidden')
      const rating = productReviews.length
        ? Number((productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length).toFixed(1))
        : product.rating
      const image = product.image || (product.photos && product.photos[0]) || '/images/farm.jpg'
      const rawPhotos = [image, ...(Array.isArray(product.photos) ? product.photos : [])].filter((p) => Boolean(p && typeof p === 'string' && p.trim().length > 0))
      const photos = Array.from(new Set(rawPhotos.length > 0 ? rawPhotos : ['/images/farm.jpg']))
      return {
        ...product,
        image,
        photos,
        lat: product.lat ?? 6.5004,
        lng: product.lng ?? 124.8436,
        tradeable: product.tradeable ?? true,
        priceHistory: product.priceHistory?.length ? product.priceHistory : [{ date: new Date().toISOString().slice(0, 10), price }],
        stock,
        price,
        rating,
        reviews: product.reviews + productReviews.filter((review) => !seedReviews.some((seed) => seed.id === review.id)).length,
      }
    })
  }, [centralProducts, stockOverrides, priceOverrides, reviews])

  const products = useMemo<Product[]>(() => {
    return allProducts.filter((product) => !product.isUnlisted && product.isActive !== false && product.moderationStatus !== 'rejected')
  }, [allProducts])

  const addProduct: StoreContextType['addProduct'] = (product) => {
    const sellerUserId = user ? user.id : 2
    const seller = user ? `${user.firstName} ${user.lastName}`.trim() : 'Maria Santos'
    const sellerId = user ? `seller-${user.id}` : 'seller-2'
    const image = product.image || '/images/farm.jpg'
    const rawPhotos = [image, ...(Array.isArray(product.photos) ? product.photos : [])].filter((p) => Boolean(p && typeof p === 'string' && p.trim().length > 0))
    const photos = Array.from(new Set(rawPhotos.length > 0 ? rawPhotos : ['/images/farm.jpg']))
    const next: Product = {
      ...product,
      image,
      photos,
      id: `prod-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      seller,
      sellerId,
      sellerUserId,
      rating: 5,
      reviews: 0,
      priceHistory: [{ date: new Date().toISOString().slice(0, 10), price: product.price }],
      tradeable: product.tradeable ?? true,
      lat: product.lat || 6.5004,
      lng: product.lng || 124.8436,
      isActive: true,
      isUnlisted: false,
    }
    setCentralProducts((current) => {
      const updated = [next, ...current.filter((p) => p.id !== next.id)]
      try {
        localStorage.setItem('agrimarket.products', JSON.stringify(updated))
      } catch {}
      return updated
    })
    void publishSyncEvent('PRODUCT_ADDED', { product: next })
    api.post('/products', next)
      .then((res) => {
        const savedProd = res.data?.data?.product || (res.data as any)?.product
        if (savedProd?.id) {
          setCentralProducts((current) => [savedProd, ...current.filter((p) => p.id !== next.id && p.id !== savedProd.id)])
        }
      })
      .catch((err) => {
        console.warn('Backend product listing sync notice:', err)
      })
    notify({
      userId: 'all',
      title: `${next.category} listing just dropped`,
      message: `${next.seller} posted ${next.name} from ${next.location}.`,
      href: `/products/${next.id}`,
    })
    return next
  }

  const updateProduct: StoreContextType['updateProduct'] = (id, updates) => {
    setCentralProducts((current) => {
      const updated = current.map((product) => {
        if (product.id !== id) return product
        const nextPrice = updates.price !== undefined ? Math.max(1, updates.price) : product.price
        const priceChanged = updates.price !== undefined && updates.price !== product.price
        const priceHistory = priceChanged
          ? [...(product.priceHistory || []), { date: new Date().toISOString().slice(0, 10), price: nextPrice }]
          : product.priceHistory
        const nextStock = updates.stock !== undefined ? Math.max(0, updates.stock) : product.stock
        const nextImage = updates.image !== undefined ? updates.image : product.image
        const nextPhotos = updates.photos !== undefined
          ? updates.photos
          : (updates.image !== undefined ? [nextImage, ...(product.photos || []).filter((p) => p !== nextImage)] : product.photos)
        return {
          ...product,
          ...updates,
          image: nextImage,
          photos: nextPhotos,
          price: nextPrice,
          priceHistory,
          stock: nextStock,
        }
      })
      try {
        localStorage.setItem('agrimarket.products', JSON.stringify(updated))
      } catch (err) {
        console.warn('Failed to save products to localStorage:', err)
      }
      return updated
    })
    if (updates.stock !== undefined) {
      setStockOverrides((current) => ({ ...current, [id]: Math.max(0, updates.stock!) }))
    }
    if (updates.price !== undefined) {
      setPriceOverrides((current) => ({ ...current, [id]: Math.max(1, updates.price!) }))
    }
    void publishSyncEvent('PRODUCT_UPDATED', { productId: id, updates })
    void api.put(`/products/${id}`, updates).catch(() => undefined)
  }

  const setProductAvailability: StoreContextType['setProductAvailability'] = (id, status) => {
    const product = allProducts.find((p) => p.id === id)
    if (!product) return

    let nextStock = product.stock
    let isUnlisted = false
    let isActive = true

    if (status === 'out_of_stock') {
      nextStock = 0
    } else if (status === 'low_stock') {
      nextStock = product.stock > 0 && product.stock <= 20 ? product.stock : 10
    } else if (status === 'in_stock') {
      nextStock = product.stock > 20 ? product.stock : 50
    } else if (status === 'temporarily_unavailable') {
      isUnlisted = true
      isActive = false
    }

    updateProduct(id, {
      availabilityStatus: status,
      stock: nextStock,
      isUnlisted,
      isActive,
    })
  }

  const updateProductStock = (id: string, stock: number) => {
    const nextStock = Math.max(0, stock)
    setStockOverrides((current) => ({ ...current, [id]: nextStock }))
    setCentralProducts((current) =>
      current.map((product) => (product.id === id ? { ...product, stock: nextStock } : product))
    )
    void publishSyncEvent('PRODUCT_STOCK_UPDATED', { productId: id, stock: nextStock })
    void api.put(`/products/${id}`, { stock: nextStock }).catch(() => undefined)
  }

  const updateProductPrice = (id: string, price: number) => {
    const nextPrice = Math.max(1, price)
    setPriceOverrides((current) => ({ ...current, [id]: nextPrice }))
    setCentralProducts((current) =>
      current.map((product) =>
        product.id === id
          ? {
              ...product,
              price: nextPrice,
              priceHistory: [...(product.priceHistory || []), { date: new Date().toISOString().slice(0, 10), price: nextPrice }],
            }
          : product
      )
    )
    void api.put(`/products/${id}`, { price: nextPrice }).catch(() => undefined)
  }

  const removeProduct = (id: string) => {
    const deletedList = readJson<string[]>('agrimarket.deleted_products', [])
    if (!deletedList.includes(id)) {
      try {
        localStorage.setItem('agrimarket.deleted_products', JSON.stringify([...deletedList, id]))
      } catch {}
    }
    setCentralProducts((current) => {
      const updated = current.filter((product) => product.id !== id)
      try {
        localStorage.setItem('agrimarket.products', JSON.stringify(updated))
      } catch {}
      return updated
    })
    void publishSyncEvent('PRODUCT_DELETED', { productId: id, id }); void api.delete(`/products/${id}`).catch((err) => console.warn('Product delete sync warning:', err))
  }

  const unlistProduct = (id: string, unlisted: boolean = true) => {
    setCentralProducts((current) =>
      current.map((product) =>
        product.id === id ? { ...product, isUnlisted: unlisted, isActive: !unlisted } : product
      )
    )
    void api.put(`/products/${id}/unlist`, { unlisted }).catch(() => undefined)
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
    setOrders((current) => {
      const updated = [next, ...current.filter((o) => o.id !== next.id)]
      try {
        localStorage.setItem('agrimarket.orders', JSON.stringify(updated))
      } catch {}
      return updated
    })
    void publishSyncEvent('ORDER_CREATED', { order: next })
    void api.post('/orders', next).catch(() => undefined)
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
      userId: user?.id || 3,
      name: user ? `${user.firstName} ${user.lastName}` : 'Buyer Member',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    }
    setApplications((current) => [next, ...current.filter((item) => item.userId !== next.userId)])
    void publishSyncEvent('APPLICATION_SUBMITTED', { application: next })
    api.post<{ success?: boolean; data?: SellerApplication }>('/sellers/application', next)
      .then((res) => {
        if (res.data?.data) {
          const saved = res.data.data
          setApplications((current) => [saved, ...current.filter((item) => item.id !== saved.id && item.userId !== saved.userId)])
        }
      })
      .catch(() => undefined)
    notify({
      userId: 1,
      title: 'Seller application pending review',
      message: `${next.name} applied for farm verification as ${next.farmName}. Check Admin KYC.`,
      href: '/admin-dashboard',
    })
    return next
  }

  const reviewApplication = (
    id: string,
    status: 'Approved' | 'Rejected' | 'Needs Revision',
    reviewNotes?: string
  ) => {
    api
      .put(`/admin/seller-applications/${id}`, { status, reviewNotes })
      .catch(() => api.put(`/sellers/application/${id}/review`, { status, reviewNotes }).catch(() => undefined))

    setApplications((current) => {
      const target = current.find((item) => item.id === id)
      void publishSyncEvent('APPLICATION_REVIEWED', { id, status, reviewNotes, userId: target?.userId })
      if (status === 'Approved' && target) {
        setApprovedSellerIds((ids) => (ids.includes(target.userId) ? ids : [...ids, target.userId]))
        grantRole(target.userId, 'seller')
        notify({
          userId: target.userId,
          title: '🎉 You are now an approved Seller!',
          message: `${target.farmName} was approved. You can now post harvest listings and manage orders.`,
          href: '/seller-dashboard',
        })
      }
      if (status === 'Needs Revision' && target) {
        notify({
          userId: target.userId,
          title: '⚠️ Revisions Requested on Seller Application',
          message: reviewNotes ? `Admin requested revisions: "${reviewNotes}". Please update and resubmit.` : 'Please update your verification documents.',
          href: '/become-seller',
        })
      }
      if (status === 'Rejected' && target) {
        notify({
          userId: target.userId,
          title: 'Seller application status update',
          message: reviewNotes ? `Application declined: "${reviewNotes}"` : 'Your application was not approved. Please review requirements and resubmit.',
          href: '/become-seller',
        })
      }
      return current.map((item) => (item.id === id ? { ...item, status, reviewNotes } : item))
    })
    void refreshAuditLogs()
  }

  // Admin Responsibilities: Categories, Promotions, Users, Reviews, Moderation, Audit
  const refreshCategories = async () => {
    try {
      const res = await api.get<{ success?: boolean; data?: CategoryItem[] }>('/categories')
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : [])
      if (Array.isArray(data) && data.length > 0) {
        setCategoriesList(data)
      }
    } catch {
      // offline fallback
    }
  }

  const createCategory = async (cat: Partial<CategoryItem>) => {
    const res = await api.post<{ success?: boolean; data?: CategoryItem }>('/admin/categories', cat)
    const created = res.data?.data || {
      id: `cat-${Date.now()}`,
      name: cat.name || 'Category',
      description: cat.description || '',
      imageUrl: cat.imageUrl || '/images/farm.jpg',
      icon: cat.icon || 'Leaf',
    }
    setCategoriesList((curr) => [...curr.filter((c) => c.id !== created.id), created])
    void refreshAuditLogs()
  }

  const updateCategory = async (id: string, updates: Partial<CategoryItem>) => {
    const res = await api.put<{ success?: boolean; data?: CategoryItem }>(`/admin/categories/${id}`, updates)
    const updated = res.data?.data || updates
    setCategoriesList((curr) => curr.map((c) => (c.id === id ? { ...c, ...updated } : c)))
    void refreshAuditLogs()
  }

  const deleteCategory = async (id: string) => {
    await api.delete(`/admin/categories/${id}`)
    setCategoriesList((curr) => curr.filter((c) => c.id !== id))
    void refreshAuditLogs()
  }

  const refreshPromotions = async () => {
    try {
      const res = await api.get<{ success?: boolean; data?: PromotionCoupon[] }>('/admin/promotions')
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : [])
      if (Array.isArray(data) && data.length > 0) {
        setPromotions(data)
      }
    } catch {
      // fallback
    }
  }

  const createPromotion = async (promo: Partial<PromotionCoupon>) => {
    const res = await api.post<{ success?: boolean; data?: PromotionCoupon }>('/admin/promotions', promo)
    const created = res.data?.data || {
      code: promo.code?.toUpperCase() || 'PROMO',
      discount: Number(promo.discount || 20),
      type: promo.type || 'fixed',
      minSpend: Number(promo.minSpend || 0),
      description: promo.description || '',
      isActive: true,
    }
    setPromotions((curr) => [created, ...curr.filter((c) => c.code !== created.code)])
    void refreshAuditLogs()
  }

  const updatePromotion = async (code: string, updates: Partial<PromotionCoupon>) => {
    const res = await api.put<{ success?: boolean; data?: PromotionCoupon }>(`/admin/promotions/${code}`, updates)
    const updated = res.data?.data || updates
    setPromotions((curr) => curr.map((c) => (c.code === code ? { ...c, ...updated } : c)))
    void refreshAuditLogs()
  }

  const deletePromotion = async (code: string) => {
    await api.delete(`/admin/promotions/${code}`)
    setPromotions((curr) => curr.filter((c) => c.code !== code))
    void refreshAuditLogs()
  }

  const refreshUsers = async () => {
    try {
      const res = await api.get<{ success?: boolean; data?: AdminUser[] }>('/admin/users')
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : [])
      if (Array.isArray(data) && data.length > 0) {
        setUsersList(data)
      }
    } catch {
      // fallback
    }
  }

  const updateUserStatus = async (id: number, isActive: boolean, reason?: string) => {
    await api.put(`/admin/users/${id}/status`, { isActive, reason })
    setUsersList((curr) =>
      curr.map((u) => (u.id === id ? { ...u, is_active: isActive, suspension_reason: reason } : u))
    )
    void refreshAuditLogs()
  }

  const updateUserRoles = async (id: number, roles: string[]) => {
    await api.put(`/admin/users/${id}/roles`, { roles })
    setUsersList((curr) => curr.map((u) => (u.id === id ? { ...u, roles } : u)))
    void refreshAuditLogs()
  }

  const refreshAuditLogs = async () => {
    try {
      const res = await api.get<{ success?: boolean; data?: { logs: AuditLog[] } }>('/admin/audit-logs')
      const logs = res.data?.data?.logs || (Array.isArray(res.data?.data) ? res.data.data : [])
      if (Array.isArray(logs)) {
        setAuditLogs(logs)
      }
    } catch {
      // fallback
    }
  }

  const moderateProduct = async (
    id: string,
    action: 'approve' | 'flag' | 'delist' | 'reject',
    reason?: string
  ) => {
    const res = await api.put<{ success?: boolean; data?: Product }>(`/admin/products/${id}/moderate`, { action, reason })
    const updated = res.data?.data
    if (updated) {
      setCentralProducts((curr) => curr.map((p) => (p.id === id ? { ...p, ...updated } : p)))
    } else {
      setCentralProducts((curr) =>
        curr.map((p) => {
          if (p.id !== id) return p
          if (action === 'approve') return { ...p, moderationStatus: 'approved', isUnlisted: false, isActive: true }
          if (action === 'flag') return { ...p, moderationStatus: 'flagged', moderationReason: reason }
          return { ...p, moderationStatus: 'rejected', isUnlisted: true, isActive: false, moderationReason: reason }
        })
      )
    }
    void refreshAuditLogs()
  }

  const moderateReview = async (
    id: string,
    status: 'published' | 'hidden' | 'flagged',
    reason?: string
  ) => {
    await api.put(`/admin/reviews/${id}/moderate`, { status, reason })
    setReviews((curr) => curr.map((r) => (r.id === id ? { ...r, status, moderationReason: reason } : r)))
    void refreshAuditLogs()
  }

  const deleteReview = async (id: string) => {
    await api.delete(`/admin/reviews/${id}`)
    setReviews((curr) => curr.filter((r) => r.id !== id))
    void refreshAuditLogs()
  }

  const updateOrderStatus = (id: string, status: Order['status']) => {
    void api.put(`/orders/${id}/status`, { status }).catch(() => undefined)
    void publishSyncEvent('ORDER_STATUS_UPDATED', { orderId: id, status })
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

  const cancelOrder: StoreContextType['cancelOrder'] = async (id, reason = 'Cancelled by buyer') => {
    try {
      await api.put(`/orders/${id}/status`, {
        status: 'Cancelled',
        cancellationReason: reason,
        rejectedReason: reason,
      })
    } catch {
      // fallback
    }
    void publishSyncEvent('ORDER_STATUS_UPDATED', { orderId: id, status: 'Cancelled' })
    setOrders((current) => {
      const updated = current.map((order) => {
        if (order.id !== id) return order
        const historyItem = {
          status: 'Cancelled' as const,
          timestamp: new Date().toISOString(),
          changedByName: user ? `${user.firstName} ${user.lastName}` : 'Buyer',
          changedByRole: 'buyer' as const,
          note: reason,
        }
        const statusHistory = Array.isArray(order.statusHistory)
          ? [...order.statusHistory, historyItem]
          : [historyItem]
        // Restore stock in local state if product exists
        order.items.forEach((item) => {
          const product = products.find((entry) => entry.id === item.productId)
          if (product) updateProductStock(product.id, product.stock + item.quantity)
        })
        notify({
          userId: order.userId,
          title: 'Order Cancelled',
          message: `Order #${order.id} has been cancelled.`,
          href: '/orders',
        })
        return {
          ...order,
          status: 'Cancelled' as const,
          statusHistory,
        }
      })
      try {
        localStorage.setItem('agrimarket.orders', JSON.stringify(updated))
      } catch {}
      return updated
    })
    return true
  }

  const refreshRiders = async () => {
    try {
      const res = await api.get<{ success?: boolean; data?: AdminUser[] }>('/delivery/riders').catch(() =>
        api.get<{ success?: boolean; data?: AdminUser[] }>('/admin/riders')
      )
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : [])
      if (Array.isArray(data) && data.length > 0) {
        setRidersList(data)
      }
    } catch {
      // fallback
    }
  }

  const createRider = async (data: {
    firstName: string
    lastName: string
    phone: string
    email: string
    password: string
  }): Promise<AdminUser> => {
    const res = await api.post<{ success?: boolean; data?: AdminUser }>('/admin/riders', data)
    const created: AdminUser = res.data?.data || {
      id: Date.now(),
      email: data.email.toLowerCase(),
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      roles: ['delivery'],
      is_verified: true,
      is_active: true,
      created_at: new Date().toISOString(),
    }
    setRidersList((curr) => [...curr.filter((r) => r.id !== created.id), created])
    setUsersList((curr) => [...curr.filter((u) => u.id !== created.id), created])
    void refreshAuditLogs()
    return created
  }

  const confirmOrder = (id: string, driverId?: number) => {
    const effectiveDriverId = driverId || DRIVER_ID
    void api.put(`/orders/${id}/status`, { status: 'Confirmed', driverId: effectiveDriverId }).catch(() => undefined)
    void publishSyncEvent('ORDER_STATUS_UPDATED', { orderId: id, status: 'Confirmed', driverId: effectiveDriverId })
    setOrders((current) =>
      current.map((order) => {
        if (order.id !== id || order.status !== 'Pending') return order
        const now = new Date().toISOString()
        const packedItems = order.items.map((it) => {
          const isMyItem =
            it.isMine ||
            it.sellerUserId === user?.id ||
            it.sellerId === `seller-${user?.id}` ||
            it.sellerId === `user-${user?.id}` ||
            (!user && (it.sellerUserId === 2 || it.sellerId === 'seller-1'))
          if (isMyItem) {
            return {
              ...it,
              prepStatus: 'packed' as const,
              sellerConfirmed: true,
              sellerConfirmedAt: it.sellerConfirmedAt || now,
              packedAt: it.packedAt || now,
            }
          }
          return it
        })
        const allConfirmed = packedItems.every((it) => it.sellerConfirmed || it.prepStatus === 'packed')
        const allPacked = packedItems.every((it) => it.prepStatus === 'packed')
        const nextStatus = allConfirmed ? ('Confirmed' as const) : order.status

        if (allConfirmed) {
          const harvest = order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')
          const pickup = order.items[0]?.pickupLocation || 'SOCCSKSARGEN stall'
          notify({
            userId: order.userId,
            title: 'Seller confirmed your order',
            message: `${order.id} is packed and ready. A rider will pick up ${harvest}.`,
            href: '/orders',
          })
          notify({
            userId: effectiveDriverId,
            title: 'Ready for pickup',
            message: `Collect ${harvest} at ${pickup}. Buyer: ${order.buyerName} · ${order.buyerPhone || 'no mobile'} · drop-off ${order.address}.`,
            href: '/delivery',
          })
          void api
            .post('/delivery/deliveries', {
              orderId: order.id,
              driverId: effectiveDriverId,
              buyerName: order.buyerName,
              buyerPhone: order.buyerPhone,
              address: order.address,
              status: 'Confirmed',
              lat: order.lat,
              lng: order.lng,
            })
            .catch(() => undefined)
        }

        return {
          ...order,
          items: packedItems,
          prepStatus: allPacked ? ('packed' as const) : 'packing',
          packedAt: allPacked ? now : order.packedAt,
          status: nextStatus,
          driverId: effectiveDriverId,
          sellerConfirmedAt: allConfirmed ? now : order.sellerConfirmedAt,
        }
      })
    )
  }

  const confirmOrderItem: StoreContextType['confirmOrderItem'] = async (orderId, productId) => {
    try {
      await api.put(`/orders/${orderId}/items/${productId}/confirm`)
    } catch {
      // fallback
    }
    const now = new Date().toISOString()
    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) return order
        const updatedItems = order.items.map((it) => {
          if (it.productId === productId) {
            return {
              ...it,
              prepStatus: 'packed' as const,
              sellerConfirmed: true,
              sellerConfirmedAt: now,
              packedAt: now,
            }
          }
          return it
        })
        const allConfirmed = updatedItems.every((it) => it.sellerConfirmed || it.prepStatus === 'packed')
        const allPacked = updatedItems.every((it) => it.prepStatus === 'packed')
        return {
          ...order,
          items: updatedItems,
          status: allConfirmed ? ('Confirmed' as const) : order.status,
          prepStatus: allPacked ? ('packed' as const) : 'packing',
          sellerConfirmedAt: allConfirmed ? now : order.sellerConfirmedAt,
        }
      })
    )
    return true
  }

  const markShipped = (id: string) => {
    void api.put(`/orders/${id}/status`, { status: 'Shipped', driverId: DRIVER_ID }).catch(() => undefined)
    void publishSyncEvent('ORDER_STATUS_UPDATED', { orderId: id, status: 'Shipped', driverId: DRIVER_ID })
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

  const assignDriver = async (orderId: string, driverId: number) => {
    try {
      await api.put(`/orders/${orderId}/assign-rider`, { driverId }).catch(() =>
        api.put(`/orders/${orderId}/status`, { driverId })
      )
    } catch {
      // fallback
    }

    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) return order
        notify({
          userId: driverId,
          title: 'New Delivery Assigned 🛵',
          message: `You were assigned to deliver ${order.id} to ${order.buyerName} (${order.address}).`,
          href: '/delivery',
        })
        notify({
          userId: order.userId,
          title: 'Rider Assigned to Your Order',
          message: `A delivery rider has been assigned for ${order.id}.`,
          href: `/orders/${order.id}/receipt`,
        })
        return { ...order, driverId }
      })
    )
  }

  const updateOrderItemPrep: StoreContextType['updateOrderItemPrep'] = (orderId, productId, prepStatus, notes) => {
    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) return order
        const now = new Date().toISOString()
        const isPacked = prepStatus === 'packed'
        const updatedItems = order.items.map((item) => {
          if (item.productId === productId) {
            return {
              ...item,
              prepStatus,
              prepNotes: notes !== undefined ? notes : item.prepNotes,
              packedAt: isPacked ? now : item.packedAt,
              sellerConfirmed: isPacked ? true : item.sellerConfirmed,
              sellerConfirmedAt: isPacked ? (item.sellerConfirmedAt || now) : item.sellerConfirmedAt,
            }
          }
          return item
        })
        const allItemsPacked = updatedItems.every((item) => item.prepStatus === 'packed')
        const allConfirmed = updatedItems.every((item) => item.sellerConfirmed || item.prepStatus === 'packed')
        const anyItemPacking = updatedItems.some((item) => item.prepStatus === 'packing' || item.prepStatus === 'packed')
        const orderPrepStatus = allItemsPacked ? 'packed' : anyItemPacking ? 'packing' : 'unpacked'

        return {
          ...order,
          items: updatedItems,
          status: allConfirmed ? ('Confirmed' as const) : order.status,
          prepStatus: orderPrepStatus,
          packedAt: allItemsPacked ? now : order.packedAt,
          sellerConfirmedAt: allConfirmed ? (order.sellerConfirmedAt || now) : order.sellerConfirmedAt,
        }
      })
    )
    void publishSyncEvent('ORDER_ITEM_PREP_UPDATED', { orderId, productId, prepStatus, notes })
    void api.put(`/orders/${orderId}/prepare`, { productId, prepStatus, packingNotes: notes }).catch(() => undefined)
  }

  const packOrder: StoreContextType['packOrder'] = (orderId, packingNotes) => {
    const now = new Date().toISOString()
    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) return order
        const packedItems = order.items.map((item) => {
          const isMyItem =
            item.isMine ||
            item.sellerUserId === user?.id ||
            item.sellerId === `seller-${user?.id}` ||
            item.sellerId === `user-${user?.id}` ||
            (!user && (item.sellerUserId === 2 || item.sellerId === 'seller-1'))
          if (isMyItem) {
            return {
              ...item,
              prepStatus: 'packed' as const,
              sellerConfirmed: true,
              sellerConfirmedAt: item.sellerConfirmedAt || now,
              packedAt: now,
              prepNotes: packingNotes || item.prepNotes,
            }
          }
          return item
        })
        const allItemsPacked = packedItems.every((item) => item.prepStatus === 'packed')
        const allConfirmed = packedItems.every((item) => item.sellerConfirmed || item.prepStatus === 'packed')
        const nextStatus = allConfirmed && order.status === 'Pending' ? ('Confirmed' as const) : order.status
        return {
          ...order,
          items: packedItems,
          prepStatus: allItemsPacked ? ('packed' as const) : 'packing',
          packingNotes: packingNotes || order.packingNotes,
          packedAt: allItemsPacked ? now : order.packedAt,
          status: nextStatus,
          sellerConfirmedAt: allConfirmed ? (order.sellerConfirmedAt || now) : order.sellerConfirmedAt,
        }
      })
    )
    notify({
      userId: 'all',
      title: `Order ${orderId} produce packed`,
      message: `Your agricultural produce for ${orderId} has been inspected and marked packed.`,
      href: `/orders`,
    })
    void publishSyncEvent('ORDER_PACKED', { orderId, packingNotes })
    void api.put(`/orders/${orderId}/prepare`, { prepStatus: 'packed', packingNotes }).catch(() => undefined)
  }

  const myListings = useMemo(() => {
    if (!user) return []

    const sellerCategoryUserMap: Record<number, number> = {
      2: 2,
      12: 12,
      13: 13,
      14: 14,
      15: 15,
      16: 16,
      17: 17,
      18: 18,
    }

    const emailOwnerMap: Record<string, number> = {
      'seller@agrimarket.com': 2,
      'seller.vegetables@agrimarket.com': 2,
      'seller.fruits@agrimarket.com': 13,
      'seller.midsayap@agrimarket.com': 13,
      'seller.rice@agrimarket.com': 15,
      'seller.tacurong@agrimarket.com': 15,
      'seller.grains@agrimarket.com': 12,
      'seller.koronadal@agrimarket.com': 12,
      'seller.fish@agrimarket.com': 17,
      'seller.lakesebu@agrimarket.com': 17,
      'seller.poultry@agrimarket.com': 16,
      'seller.livestock@agrimarket.com': 18,
      'seller.dairy@agrimarket.com': 18,
      'seller.supplies@agrimarket.com': 14,
      'seller.gensan@agrimarket.com': 14,
    }

    const effectiveSellerUserId = user.email ? emailOwnerMap[user.email.toLowerCase()] || user.id : user.id

    return allProducts.filter((product) => {
      if (product.sellerUserId === effectiveSellerUserId) return true
      if (product.sellerId === `user-${user.id}` || product.sellerId === `seller-${effectiveSellerUserId}`) return true

      if (user.id > 100 || !sellerCategoryUserMap[user.id]) {
        const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
        if (userFullName && product.seller && product.seller.toLowerCase() === userFullName.toLowerCase()) return true
      }

      return false
    })
  }, [allProducts, user])

  const sellerOrders = useMemo(() => {
    if (!user) return []
    const listingIds = new Set(myListings.map((product) => product.id))
    return orders.filter((order) =>
      order.items.some(
        (item) =>
          listingIds.has(item.productId) ||
          item.sellerUserId === user.id ||
          item.sellerId === `seller-${user.id}` ||
          ((user.email === 'seller@agrimarket.com' || user.id === 2) &&
            (item.sellerUserId === 2 || item.sellerId === 'seller-2' || item.sellerId === 'seller-1'))
      )
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
    void publishSyncEvent('REVIEW_ADDED', { review: next })
  }

  const addPost: StoreContextType['addPost'] = (payload) => {
    const next: Post = {
      ...payload,
      id: `post-${Date.now()}`,
      sellerId: user ? `user-${user.id}` : 'seller-local',
      sellerName: user ? `${user.firstName} ${user.lastName}` : 'Farm stall',
      createdAt: new Date().toISOString(),
    }
    setPosts((current) => {
      const updated = [next, ...current]
      try {
        localStorage.setItem('agrimarket.posts', JSON.stringify(updated))
      } catch {}
      return updated
    })
    void publishSyncEvent('POST_CREATED', { post: next })
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
      id: payload.id || `tr-${Date.now()}`,
      fromUserId: payload.fromUserId || user.id,
      fromName: payload.fromName || `${user.firstName} ${user.lastName}`,
      status: payload.status || 'Open',
      createdAt: payload.createdAt || new Date().toISOString(),
    }
    setTrades((current) => {
      const updated = [next, ...current]
      try {
        localStorage.setItem('agrimarket.trades', JSON.stringify(updated))
      } catch {}
      return updated
    })
    notify({
      userId: 'all',
      title: 'New harvest trade offer',
      message: `${next.fromName} offered ${next.fromProductName} for ${next.toProductName}.`,
      href: '/trades',
    })
  }

  const respondTrade: StoreContextType['respondTrade'] = (id, status, counterDetails) => {
    setTrades((current) => {
      const updated = current.map((trade) => {
        if (trade.id !== id) return trade
        const nextTrade: TradeOffer = {
          ...trade,
          status,
          ...(counterDetails
            ? {
                counterOffer: {
                  ...counterDetails,
                  counterBy: user ? `${user.firstName} ${user.lastName}` : 'Seller',
                  counterAt: new Date().toISOString(),
                },
              }
            : {}),
        }
        return nextTrade
      })
      try {
        localStorage.setItem('agrimarket.trades', JSON.stringify(updated))
      } catch {}
      return updated
    })
    notify({
      userId: 'all',
      title: `Trade ${status.toLowerCase()}`,
      message: `Trade proposal ${id} was marked ${status.toLowerCase()}${counterDetails ? ' with a counter proposal' : ''}.`,
      href: '/trades',
    })
  }

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    if (!user || token.startsWith('local-') || token.startsWith('demo-')) return
    api
      .get<{ data?: { productIds?: string[] } }>('/wishlist')
      .then((res) => {
        const ids = res.data?.data?.productIds
        if (Array.isArray(ids)) setWishlist(ids)
      })
      .catch(() => undefined)
  }, [user?.id])

  const toggleWishlist = (productId: string) => {
    const exists = wishlist.includes(productId)
    const previous = wishlist
    const next = exists ? wishlist.filter((id) => id !== productId) : [...wishlist, productId]
    setWishlist(next)
    notify({
      userId: user?.id || 'all',
      title: exists ? 'Removed from Wishlist' : 'Added to Wishlist ❤️',
      message: exists ? 'Product removed from your saved items.' : 'Saved to your wishlist! View it anytime from Shop or Profile.',
      href: `/products/${productId}`,
    })
    const token = localStorage.getItem('token') || ''
    if (!user || token.startsWith('local-') || token.startsWith('demo-')) return
    const request = exists ? api.delete(`/wishlist/${productId}`) : api.post(`/wishlist/${productId}`)
    request
      .then((res: { data?: { data?: { productIds?: string[] } } }) => {
        const ids = res.data?.data?.productIds
        if (Array.isArray(ids)) setWishlist(ids)
      })
      .catch(() => setWishlist(previous))
  }

  const isWishlisted = (productId: string) => wishlist.includes(productId)

  const claimVoucher = (code: string) => {
    if (claimedVouchers.includes(code)) return false
    setClaimedVouchers((current) => [...current, code])
    notify({
      userId: user?.id || 'all',
      title: 'Voucher Claimed! 🎟️',
      message: `Voucher "${code}" is now ready in your wallet. Apply it during checkout!`,
      href: '/cart',
    })
    return true
  }

  const checkInDaily = () => {
    const today = new Date().toISOString().slice(0, 10)
    if (lastCheckInDate === today) {
      return { success: false, pointsAdded: 0, streak: streakDays }
    }
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const newStreak = lastCheckInDate === yesterday ? (streakDays % 7) + 1 : 1
    const pointsMap = [5, 10, 15, 20, 25, 30, 50]
    const pointsAdded = pointsMap[newStreak - 1] || 10
    setStreakDays(newStreak)
    setLastCheckInDate(today)
    setLoyaltyPoints((current) => current + pointsAdded)
    notify({
      userId: user?.id || 'all',
      title: `Day ${newStreak} Check-in Complete! 🎉`,
      message: `You earned +${pointsAdded} AgriCoins! Use them as cash discounts at checkout.`,
      href: '/profile',
    })
    return { success: true, pointsAdded, streak: newStreak }
  }

  const applyCoupon: StoreContextType['applyCoupon'] = (code, shippingFee, subtotal) => {
    const coupon = shippingCoupons.find((item) => item.code.toLowerCase() === code.trim().toLowerCase())
    if (!coupon) return { ok: false, message: 'Voucher code not found.', discount: 0 }
    if (subtotal < coupon.minOrder) {
      return { ok: false, message: `Spend at least ₱${coupon.minOrder} to use ${coupon.code}.`, discount: 0 }
    }
    let discount = 0
    if (coupon.code === 'FREESHIP') {
      discount = shippingFee
    } else if (coupon.type === 'percent') {
      discount = Math.round((subtotal * coupon.value) / 100)
    } else {
      discount = coupon.value
    }
    return { ok: true, message: `${coupon.code} applied! Saved ₱${discount}.`, discount, code: coupon.code }
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
    void publishSyncEvent('MESSAGE_SENT', { message: next })
    notify({
      userId: payload.toUserId,
      title:
        payload.fromRole === 'delivery'
          ? 'SMS from your rider'
          : payload.fromRole === 'seller'
          ? `Message from Seller (${payload.fromName})`
          : 'New message',
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
    () => {
      const isDeliveryUser = Boolean(user && user.roles?.includes('delivery'))
      return notifications.filter((item) => {
        // Delivery riders: ONLY receive notifications about orders & deliveries
        if (isDeliveryUser) {
          const forRider = item.userId === 'all' || (user && item.userId === user.id) || item.userId === DRIVER_ID
          if (!forRider) return false

          const text = `${item.title} ${item.message} ${item.href || ''}`.toLowerCase()
          const isOrderRelated =
            Boolean(item.href?.includes('/orders') || item.href?.includes('/delivery')) ||
            text.includes('order') ||
            text.includes('delivery') ||
            text.includes('dispatch') ||
            text.includes('pickup') ||
            text.includes('drop-off') ||
            text.includes('rider') ||
            text.includes('shipped') ||
            text.includes('delivered') ||
            text.includes('parcel') ||
            text.includes('crate')
          return isOrderRelated
        }

        const forUser = item.userId === 'all' || (user && item.userId === user.id) || (user && user.roles.includes('admin') && item.userId === 1)
        if (!forUser) return false
        if (item.category && followedCategories.length > 0 && !followedCategories.includes(item.category)) return false
        return true
      })
    },
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
      allProducts,
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
      updateProduct,
      updateProductStock,
      updateProductPrice,
      setProductAvailability,
      removeProduct,
      unlistProduct,
      refreshCatalog,
      placeOrder,
      myOrders: orders.filter((order) => {
        if (!user) return false
        if (user.roles?.includes('admin')) return true
        return (
          order.userId === user.id ||
          String(order.userId) === String(user.id) ||
          Boolean(user.phone && order.buyerPhone === user.phone)
        )
      }),
      submitApplication,
      myApplication: [...applications].reverse().find((item) => user && (item.userId === user.id || String(item.userId) === String(user.id))),
      reviewApplication,
      updateOrderStatus,
      cancelOrder,
      updateOrderItemPrep,
      packOrder,
      confirmOrder,
      confirmOrderItem,
      markShipped,
      assignDriver,
      myListings,
      sellerOrders,
      addReview,
      reviewsFor: (productId: string) => reviews.filter((review) => review.productId === productId && review.status !== 'hidden'),
      addPost,
      followCategory,
      unfollowCategory,
      offerTrade,
      respondTrade,
      syncTrades,
      notify,
      applyCoupon,
      sendSms,
      markNotificationsRead,
      markNotificationRead,
      unreadCount,
      recommended,
      budgetPicks,
      loyaltyPoints,
      wishlist,
      toggleWishlist,
      isWishlisted,
      claimedVouchers,
      claimVoucher,
      checkInDaily,
      streakDays,
      lastCheckInDate,
      syncStatus,
      salesSeries,
      categorySales,
      categoriesList,
      refreshCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      promotions,
      refreshPromotions,
      createPromotion,
      updatePromotion,
      deletePromotion,
      usersList,
      refreshUsers,
      updateUserStatus,
      updateUserRoles,
      auditLogs,
      refreshAuditLogs,
      moderateProduct,
      moderateReview,
      deleteReview,
      ridersList,
      refreshRiders,
      createRider,
    }),
    [
      allProducts,
      products,
      orders,
      applications,
      reviews,
      posts,
      trades,
      visibleNotifications,
      messages,
      followedCategories,
      user,
      myListings,
      sellerOrders,
      unreadCount,
      recommended,
      salesSeries,
      categorySales,
      loyaltyPoints,
      wishlist,
      claimedVouchers,
      streakDays,
      lastCheckInDate,
      syncStatus,
      categoriesList,
      promotions,
      usersList,
      auditLogs,
      ridersList,
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within a StoreProvider')
  return context
}
