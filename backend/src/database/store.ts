import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import pool from '../config/database';

export interface UserEntity {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  profile_image?: string;
  roles: string[];
  is_verified: boolean;
  is_active: boolean;
  suspension_reason?: string;
  suspended_at?: string;
  created_at: string;
}

export interface ProductEntity {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  rating: number;
  reviews: number;
  seller: string;
  sellerId: string;
  sellerUserId: number;
  location: string;
  image: string;
  photos: string[];
  description: string;
  organic: boolean;
  tradeable: boolean;
  lat: number;
  lng: number;
  priceHistory?: Array<{ date: string; price: number }>;
  created_at?: string;
  isActive?: boolean;
  is_active?: boolean;
  isUnlisted?: boolean;
  availabilityStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'temporarily_unavailable';
  moderationStatus?: 'approved' | 'flagged' | 'rejected' | 'pending';
  moderationReason?: string;
  moderatedAt?: string;
  moderatedBy?: string;
  isDeleted?: boolean;
}

export interface OrderItemEntity {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
  image: string;
  seller: string;
  sellerId: string;
  sellerUserId: number;
  pickupLocation: string;
  prepStatus?: 'unpacked' | 'packing' | 'packed';
  prepNotes?: string;
  packedAt?: string;
}

export interface OrderEntity {
  id: string;
  receiptNo: string;
  userId: number;
  buyerName: string;
  buyerPhone?: string;
  items: OrderItemEntity[];
  subtotal: number;
  shippingFee: number;
  shippingDiscount: number;
  couponCode?: string;
  pointsEarned: number;
  pointsRedeemed: number;
  total: number;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Out for delivery' | 'Delivered' | 'Cancelled';
  createdAt: string;
  address: string;
  payment: 'GCash' | 'Cash on delivery' | 'Maya' | 'Card';
  paymentRef?: string;
  paymentStatus?: 'pending' | 'paid' | 'escrow_held' | 'refunded';
  driverId?: number;
  lat?: number;
  lng?: number;
  sellerConfirmedAt?: string;
  shippedAt?: string;
  prepStatus?: 'unpacked' | 'packing' | 'packed';
  packingNotes?: string;
  packedAt?: string;
  rejectedReason?: string;
  stockRestored?: boolean;
}

export interface CartItemEntity {
  id: string;
  userId: number;
  productId: string;
  quantity: number;
  createdAt: string;
}

export interface SellerApplicationEntity {
  id: string;
  userId: number;
  name: string;
  farmName: string;
  location: string;
  description: string;
  phone: string;
  categories: string;
  idType: string;
  idNumber: string;
  idDocument?: string;
  permitDocument?: string;
  farmPhoto?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Needs Revision';
  reviewNotes?: string;
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ReviewEntity {
  id: string;
  productId: string;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  photos: string[];
  createdAt: string;
  status?: 'published' | 'hidden' | 'flagged';
  moderationReason?: string;
  moderatedAt?: string;
  isVerifiedPurchase?: boolean;
  orderId?: string;
}

export interface PostEntity {
  id: string;
  sellerId: string;
  sellerName: string;
  productId?: string;
  productName?: string;
  body: string;
  photos: string[];
  category: string;
  createdAt: string;
}

export interface TradeOfferEntity {
  id: string;
  fromUserId: number;
  fromName: string;
  fromProductId: string;
  fromProductName: string;
  toSellerId: string;
  toProductId: string;
  toProductName: string;
  note: string;
  status: 'Open' | 'Accepted' | 'Declined';
  createdAt: string;
}

export interface NotificationEntity {
  id: string;
  userId: number | 'all';
  title: string;
  message: string;
  href?: string;
  category?: string;
  readBy: number[];
  createdAt: string;
}

export interface MessageEntity {
  id: string;
  orderId: string;
  fromRole: 'delivery' | 'buyer' | 'seller' | 'system';
  fromName: string;
  fromUserId?: number;
  toUserId: number;
  phone?: string;
  body: string;
  createdAt: string;
  channel: 'sms' | 'in-app';
  status: 'queued' | 'sent' | 'delivered';
}

export interface DeliveryJobEntity {
  id: string;
  orderId: string;
  driverId: number;
  buyerName: string;
  buyerPhone?: string;
  address: string;
  status: string;
  lat?: number;
  lng?: number;
  updatedAt: string;
}

export interface CouponEntity {
  code: string;
  discount: number;
  type: 'fixed' | 'percentage' | 'shipping';
  minSpend: number;
  description: string;
  isActive: boolean;
  createdAt?: string;
  usageLimit?: number;
  usedCount?: number;
}

export interface CategoryEntity {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageUrl: string;
}

export interface AuditLogEntity {
  id: string;
  adminId: number;
  adminEmail: string;
  action: string;
  targetType: 'user' | 'seller_application' | 'product' | 'category' | 'promotion' | 'review' | 'order' | 'system';
  targetId: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'agrimarket_db.json');

const isProduction = process.env.NODE_ENV === 'production';

// Initial seed accounts with pre-hashed passwords ('admin123', 'seller123', 'buyer123', 'driver123')
// SECURITY: Predictable default seed credentials MUST NEVER be created in production environments!
const defaultPasswordHash = !isProduction ? bcrypt.hashSync('buyer123', 8) : '';
const adminPasswordHash = !isProduction ? bcrypt.hashSync('admin123', 8) : '';
const sellerPasswordHash = !isProduction ? bcrypt.hashSync('seller123', 8) : '';
const driverPasswordHash = !isProduction ? bcrypt.hashSync('driver123', 8) : '';

const initialUsers: UserEntity[] = isProduction
  ? []
  : [
  {
    id: 1,
    email: 'admin@agrimarket.com',
    password_hash: adminPasswordHash,
    first_name: 'Admin',
    last_name: 'Superuser',
    phone: '+639123456789',
    roles: ['admin', 'buyer'],
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    email: 'seller@agrimarket.com',
    password_hash: sellerPasswordHash,
    first_name: 'Maria',
    last_name: 'Santos',
    phone: '+639171112233',
    roles: ['seller', 'buyer'],
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    email: 'buyer@agrimarket.com',
    password_hash: defaultPasswordHash,
    first_name: 'Juan',
    last_name: 'Cruz',
    phone: '+639189998877',
    roles: ['buyer'],
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    email: 'driver@agrimarket.com',
    password_hash: driverPasswordHash,
    first_name: 'Rico',
    last_name: 'Driver',
    phone: '+639175551111',
    roles: ['delivery'],
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 12,
    email: 'seller.koronadal@agrimarket.com',
    password_hash: sellerPasswordHash,
    first_name: 'Juanita',
    last_name: 'Reyes',
    phone: '+639172223344',
    roles: ['seller', 'buyer'],
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 13,
    email: 'seller.midsayap@agrimarket.com',
    password_hash: sellerPasswordHash,
    first_name: 'Eduardo',
    last_name: 'Dizon',
    phone: '+639173334455',
    roles: ['seller', 'buyer'],
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 14,
    email: 'seller.gensan@agrimarket.com',
    password_hash: sellerPasswordHash,
    first_name: 'Roberto',
    last_name: 'Tan',
    phone: '+639174445566',
    roles: ['seller', 'buyer'],
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 15,
    email: 'seller.tacurong@agrimarket.com',
    password_hash: sellerPasswordHash,
    first_name: 'Lilia',
    last_name: 'Mendoza',
    phone: '+639175556677',
    roles: ['seller', 'buyer'],
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 16,
    email: 'seller.poultry@agrimarket.com',
    password_hash: sellerPasswordHash,
    first_name: 'Nestor',
    last_name: 'Aquino',
    phone: '+639176667788',
    roles: ['seller', 'buyer'],
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 17,
    email: 'seller.lakesebu@agrimarket.com',
    password_hash: sellerPasswordHash,
    first_name: 'Danilo',
    last_name: 'Blaan',
    phone: '+639177778899',
    roles: ['seller', 'buyer'],
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const initialProducts: ProductEntity[] = [
  {
    id: 'p-tomato',
    name: 'Salad Tomatoes',
    category: 'Vegetables',
    price: 85,
    unit: 'kg',
    stock: 120,
    rating: 4.8,
    reviews: 64,
    seller: 'Green Valley Farm',
    sellerId: 'seller-1',
    sellerUserId: 2,
    location: 'Polomolok, South Cotabato',
    image: '/images/tomato.jpg',
    photos: ['/images/tomato.jpg', '/images/farm.jpg'],
    description: 'Firm, sweet salad tomatoes harvested at dawn in Polomolok. Ideal for sinigang, salsa, and everyday cooking.',
    organic: true,
    tradeable: true,
    lat: 6.2214,
    lng: 125.0647,
    priceHistory: [
      { date: '2026-09-01', price: 92 },
      { date: '2026-09-15', price: 88 },
      { date: '2026-10-01', price: 85 },
    ],
  },
  {
    id: 'p-kangkong',
    name: 'Fresh Kangkong',
    category: 'Vegetables',
    price: 35,
    unit: 'bundle',
    stock: 45,
    rating: 4.6,
    reviews: 28,
    seller: 'Koronadal Harvest',
    sellerId: 'seller-2',
    sellerUserId: 12,
    location: 'Koronadal City, South Cotabato',
    image: '/images/kangkong.jpg',
    photos: ['/images/kangkong.jpg'],
    description: 'Crisp water spinach bunches from Koronadal paddies, washed and bundled the same morning.',
    organic: true,
    tradeable: true,
    lat: 6.5004,
    lng: 124.8436,
    priceHistory: [{ date: '2026-10-01', price: 35 }],
  },
  {
    id: 'p-mango',
    name: 'Carabao Mangoes',
    category: 'Fruits',
    price: 180,
    unit: 'kg',
    stock: 60,
    rating: 4.9,
    reviews: 82,
    seller: 'Midsayap Gold Orchard',
    sellerId: 'seller-3',
    sellerUserId: 13,
    location: 'Midsayap, Cotabato',
    image: '/images/mango.jpg',
    photos: ['/images/mango.jpg', '/images/farm.jpg'],
    description: 'Export-grade sweet Carabao mangoes from Midsayap. Tree-ripened, golden yellow, and fragrant.',
    organic: true,
    tradeable: true,
    lat: 7.1906,
    lng: 124.5381,
    priceHistory: [
      { date: '2026-09-01', price: 210 },
      { date: '2026-09-20', price: 195 },
      { date: '2026-10-01', price: 180 },
    ],
  },
  {
    id: 'p-banana',
    name: 'Lakatan Bananas',
    category: 'Fruits',
    price: 75,
    unit: 'kg',
    stock: 50,
    rating: 4.7,
    reviews: 41,
    seller: 'Gensan Fruit Co-op',
    sellerId: 'seller-4',
    sellerUserId: 14,
    location: 'General Santos City',
    image: '/images/banana.jpg',
    photos: ['/images/banana.jpg'],
    description: 'Sweet, golden Lakatan bananas freshly harvested from orchards near General Santos City.',
    organic: false,
    tradeable: true,
    lat: 6.1164,
    lng: 125.1716,
    priceHistory: [{ date: '2026-10-01', price: 75 }],
  },
  {
    id: 'p-rice',
    name: 'Dinorado Rice',
    category: 'Rice & Grains',
    price: 58,
    unit: 'kg',
    stock: 300,
    rating: 4.9,
    reviews: 110,
    seller: 'Green Valley Farm',
    sellerId: 'seller-1',
    sellerUserId: 2,
    location: "M'lang, Cotabato",
    image: '/images/rice.jpg',
    photos: ['/images/rice.jpg'],
    description: "Aromatic whole-grain Dinorado rice from the plains of M'lang. Soft, fluffy texture when cooked.",
    organic: false,
    tradeable: true,
    lat: 6.9467,
    lng: 124.8803,
    priceHistory: [{ date: '2026-10-01', price: 58 }],
  },
  {
    id: 'p-corn',
    name: 'Sweet Yellow Corn',
    category: 'Rice & Grains',
    price: 45,
    unit: 'kg',
    stock: 80,
    rating: 4.7,
    reviews: 35,
    seller: 'Koronadal Harvest',
    sellerId: 'seller-2',
    sellerUserId: 12,
    location: 'Koronadal City, South Cotabato',
    image: '/images/corn.jpg',
    photos: ['/images/corn.jpg'],
    description: 'Juicy, golden sweet corn cobs from South Cotabato farms. Great for boiling or grilling.',
    organic: false,
    tradeable: true,
    lat: 6.5004,
    lng: 124.8436,
    priceHistory: [{ date: '2026-10-01', price: 45 }],
  },
  {
    id: 'p-eggs',
    name: 'Free-Range Brown Eggs',
    category: 'Livestock & Poultry',
    price: 220,
    unit: 'tray',
    stock: 75,
    rating: 4.8,
    reviews: 53,
    seller: 'Koronadal Sunrise Poultry',
    sellerId: 'seller-6',
    sellerUserId: 16,
    location: 'Koronadal City, South Cotabato',
    image: '/images/eggs.jpg',
    photos: ['/images/eggs.jpg'],
    description: 'Fresh pastured eggs from cage-free hens in Koronadal. Thick shells, rich orange yolks.',
    organic: true,
    tradeable: true,
    lat: 6.5004,
    lng: 124.8436,
    priceHistory: [{ date: '2026-10-01', price: 220 }],
  },
  {
    id: 'p-tilapia',
    name: 'Lake Sebu Fresh Tilapia',
    category: 'Fisheries & Aquaculture',
    price: 160,
    unit: 'kg',
    stock: 90,
    rating: 4.9,
    reviews: 67,
    seller: 'Sebu Lake Aquatics',
    sellerId: 'seller-7',
    sellerUserId: 17,
    location: 'Lake Sebu, South Cotabato',
    image: '/images/tilapia.jpg',
    photos: ['/images/tilapia.jpg'],
    description: 'Cold-water spring tilapia freshly harvested from Lake Sebu pens. Clean taste with no mud flavor.',
    organic: true,
    tradeable: false,
    lat: 6.2255,
    lng: 124.7088,
    priceHistory: [{ date: '2026-10-01', price: 160 }],
  },
];

const initialCategories: CategoryEntity[] = [
  { id: 'cat-veg', name: 'Vegetables', description: 'Fresh local leafy greens, roots and daily harvests', icon: 'Leaf', imageUrl: '/images/kangkong.jpg' },
  { id: 'cat-fruits', name: 'Fruits', description: 'Tree-ripened sweet Carabao mangoes, bananas & tropical harvests', icon: 'Apple', imageUrl: '/images/mango.jpg' },
  { id: 'cat-rice', name: 'Rice', description: 'Mindanao milled Dinorado, Sinandomeng, brown and black rice', icon: 'Wheat', imageUrl: '/images/rice.jpg' },
  { id: 'cat-grains', name: 'Grains', description: 'Mindanao sweet yellow corn, white flint, sorghum and grain feeds', icon: 'Wheat', imageUrl: '/images/corn.jpg' },
  { id: 'cat-supplies', name: 'Farm Supplies', description: 'Organic fertilizers, compost, planting seeds and farm tools', icon: 'Sprout', imageUrl: '/images/compost.jpg' },
  { id: 'cat-poultry', name: 'Livestock & Poultry', description: 'Farm-fresh pasture brown eggs, dairy and poultry', icon: 'Egg', imageUrl: '/images/eggs.jpg' },
  { id: 'cat-fish', name: 'Fisheries & Aquaculture', description: 'Lake Sebu spring tilapia and General Santos fresh catch', icon: 'Fish', imageUrl: '/images/tilapia.jpg' },
];

const initialCoupons: CouponEntity[] = [
  { code: 'FREESHIP', discount: 50, type: 'shipping', minSpend: 300, description: 'Free shipping on orders ₱300+', isActive: true },
  { code: 'NEWBUYER50', discount: 50, type: 'fixed', minSpend: 250, description: '₱50 off for first-time buyers', isActive: true },
  { code: 'HARVEST100', discount: 100, type: 'fixed', minSpend: 800, description: '₱100 off on bulk orders ₱800+', isActive: true },
  { code: 'SOCCSKSARGEN20', discount: 20, type: 'fixed', minSpend: 150, description: '₱20 discount on local deliveries', isActive: true },
];

const initialReviews: ReviewEntity[] = [
  {
    id: 'r1',
    productId: 'p-tomato',
    userId: 3,
    userName: 'Juan Cruz',
    rating: 5,
    comment: 'Arrived firm and sweet. Perfect for our sari-sari stall and cooking.',
    photos: ['/images/tomato.jpg'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'r2',
    productId: 'p-mango',
    userId: 3,
    userName: 'Juan Cruz',
    rating: 5,
    comment: 'Sweet Carabao mangoes from Midsayap. Kids finished the box in two days!',
    photos: ['/images/mango.jpg'],
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

const initialOrders: OrderEntity[] = [
  {
    id: 'ORD-1001',
    receiptNo: 'RCPT-1001',
    userId: 3,
    buyerName: 'Juan Cruz',
    buyerPhone: '+639189998877',
    items: [
      {
        productId: 'p-rice',
        name: 'Dinorado Rice',
        price: 58,
        quantity: 10,
        image: '/images/rice.jpg',
        seller: 'Green Valley Farm',
        sellerId: 'seller-1',
        sellerUserId: 2,
        pickupLocation: "M'lang, Cotabato",
      },
    ],
    subtotal: 580,
    shippingFee: 50,
    shippingDiscount: 50,
    couponCode: 'FREESHIP',
    pointsEarned: 58,
    pointsRedeemed: 0,
    total: 580,
    status: 'Delivered',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    address: '12 Osmeña St, Koronadal City, South Cotabato',
    payment: 'GCash',
    paymentRef: 'GC-8821',
    paymentStatus: 'paid',
    driverId: 4,
    lat: 6.5004,
    lng: 124.8436,
  },
  {
    id: 'ORD-1002',
    receiptNo: 'RCPT-1002',
    userId: 3,
    buyerName: 'Juan Cruz',
    buyerPhone: '+639189998877',
    items: [
      {
        productId: 'p-eggs',
        name: 'Free-Range Brown Eggs',
        price: 220,
        quantity: 2,
        image: '/images/eggs.jpg',
        seller: 'Koronadal Sunrise Poultry',
        sellerId: 'seller-6',
        sellerUserId: 16,
        pickupLocation: 'Koronadal City, South Cotabato',
      },
    ],
    subtotal: 440,
    shippingFee: 50,
    shippingDiscount: 0,
    pointsEarned: 44,
    pointsRedeemed: 0,
    total: 490,
    status: 'Out for delivery',
    createdAt: new Date().toISOString(),
    address: 'Purok 3, Calumpang, General Santos City',
    payment: 'Cash on delivery',
    paymentStatus: 'pending',
    driverId: 4,
    lat: 6.1164,
    lng: 125.1716,
  },
];

const initialDeliveries: DeliveryJobEntity[] = [
  {
    id: 'DEL-1002',
    orderId: 'ORD-1002',
    driverId: 4,
    buyerName: 'Juan Cruz',
    buyerPhone: '+639189998877',
    address: 'Purok 3, Calumpang, General Santos City',
    status: 'Out for delivery',
    lat: 6.1164,
    lng: 125.1716,
    updatedAt: new Date().toISOString(),
  },
];

const initialNotifications: NotificationEntity[] = [
  {
    id: 'n-welcome',
    userId: 'all',
    title: '🌾 SOCCSKSARGEN Harvest Board Live',
    message: 'Welcome to AgriMarket! Discover farm-direct harvests with real-time delivery tracking.',
    href: '/marketplace',
    category: 'System',
    readBy: [],
    createdAt: new Date().toISOString(),
  },
];

const initialAuditLogs: AuditLogEntity[] = [
  {
    id: 'log-101',
    adminId: 1,
    adminEmail: 'admin@agrimarket.com',
    action: 'SYSTEM_INITIALIZATION',
    targetType: 'system',
    targetId: 'SYS-CORE',
    details: 'AgriMarket SOCCSKSARGEN administrative control hub initialized with persistent audit tracking.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'log-102',
    adminId: 1,
    adminEmail: 'admin@agrimarket.com',
    action: 'SELLER_APPLICATION_APPROVED',
    targetType: 'seller_application',
    targetId: 'app-seed-1',
    details: 'Approved seller KYC credentials for Green Valley Farm (Polomolok). Government ID and Barangay permit verified.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'log-103',
    adminId: 1,
    adminEmail: 'admin@agrimarket.com',
    action: 'PROMOTION_CREATED',
    targetType: 'promotion',
    targetId: 'FREESHIP',
    details: 'Created regional promotional discount: FREESHIP (Free delivery on orders ₱300+).',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export interface DatabaseSchema {
  users: UserEntity[];
  products: ProductEntity[];
  categories: CategoryEntity[];
  orders: OrderEntity[];
  cart: CartItemEntity[];
  seller_applications: SellerApplicationEntity[];
  reviews: ReviewEntity[];
  posts: PostEntity[];
  trades: TradeOfferEntity[];
  notifications: NotificationEntity[];
  messages: MessageEntity[];
  delivery_jobs: DeliveryJobEntity[];
  coupons: CouponEntity[];
  audit_logs: AuditLogEntity[];
  processed_webhooks: Array<{ eventId: string; orderId: string; processedAt: string }>;
}

class DatabaseStore {
  private data: DatabaseSchema;
  private isMySqlConnected: boolean = false;

  constructor() {
    this.data = this.loadData();
    this.checkMySqlConnection();
  }

  public getIsMySqlConnected(): boolean {
    return this.isMySqlConnected;
  }

  private async checkMySqlConnection() {
    const isProd = process.env.NODE_ENV === 'production';
    const dbRequired = process.env.DB_REQUIRED === 'true' || isProd;
    try {
      const conn = await pool.getConnection();
      this.isMySqlConnected = true;
      conn.release();
      console.log('✅ Connected to authoritative MySQL database instance.');
      await this.initMySqlSchemaAndData();
    } catch (e: any) {
      this.isMySqlConnected = false;
      if (dbRequired) {
        console.error('❌ FATAL: Authoritative MySQL connection failed in production / strict mode:', e.message);
        throw new Error(`Authoritative MySQL connection failed: ${e.message}`);
      } else {
        console.log('ℹ️ Running on resilient high-performance local embedded data store.');
      }
    }
  }

  private async initMySqlSchemaAndData() {
    if (!this.isMySqlConnected) return;
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        const statements = schema
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith('--'));
        for (const statement of statements) {
          try {
            await pool.query(statement);
          } catch (err: any) {
            // Table/index may already exist
          }
        }
        console.log('✅ MySQL schema tables verified and ready.');
      }

      // Check if users table is populated; if empty, safely seed from current in-memory store
      const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM users');
      const count = rows[0]?.count || 0;
      if (count === 0 && this.data.users.length > 0) {
        console.log('🔄 Safely migrating existing records into MySQL database...');
        for (const u of this.data.users) {
          await pool.query(
            'INSERT INTO users (id, email, password_hash, first_name, last_name, phone, is_verified, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE email=VALUES(email)',
            [u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone || null, u.is_verified ? 1 : 0, u.is_active ? 1 : 0]
          );
        }
        for (const c of this.data.categories) {
          await pool.query(
            'INSERT INTO categories (id, name, description, icon, image_url, is_active) VALUES (?, ?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE name=VALUES(name)',
            [c.id, c.name, c.description, c.icon, c.imageUrl]
          );
        }
        for (const p of this.data.products) {
          await pool.query(
            'INSERT INTO products (id, seller_user_id, seller_id, category, name, description, price, unit, stock, rating, reviews_count, image, location, is_organic, is_active, is_unlisted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE stock=VALUES(stock)',
            [p.id, p.sellerUserId, p.sellerId, p.category, p.name, p.description, p.price, p.unit, p.stock, p.rating, p.reviews, p.image, p.location, p.organic ? 1 : 0, p.isActive !== false ? 1 : 0, p.isUnlisted ? 1 : 0]
          );
        }
        for (const c of this.data.coupons) {
          await pool.query(
            'INSERT INTO coupons (code, discount, type, min_spend, description, is_active) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE discount=VALUES(discount)',
            [c.code, c.discount, c.type, c.minSpend, c.description, c.isActive ? 1 : 0]
          );
        }
        for (const o of this.data.orders) {
          await pool.query(
            'INSERT INTO orders (id, receipt_no, user_id, buyer_name, buyer_phone, address, subtotal, shipping_fee, shipping_discount, coupon_code, points_earned, points_redeemed, total, status, payment, payment_ref, payment_status, driver_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=VALUES(status)',
            [o.id, o.receiptNo, o.userId, o.buyerName, o.buyerPhone || null, o.address, o.subtotal, o.shippingFee, o.shippingDiscount, o.couponCode || null, o.pointsEarned, o.pointsRedeemed, o.total, o.status, o.payment, o.paymentRef || null, o.paymentStatus || 'pending', o.driverId || null]
          );
          if (o.items && Array.isArray(o.items)) {
            for (const item of o.items) {
              await pool.query(
                'INSERT INTO order_items (order_id, product_id, name, price, quantity, unit, image, seller, seller_id, seller_user_id, pickup_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [o.id, item.productId, item.name, item.price, item.quantity, item.unit || 'kg', item.image || null, item.seller || null, item.sellerId || null, item.sellerUserId, item.pickupLocation || null]
              );
            }
          }
        }
        console.log('✅ Safely migrated catalog, user, and order records into MySQL.');
      }
    } catch (err: any) {
      console.warn('⚠️ Notice during MySQL schema init / migration:', err.message);
    }
  }

  public async executeMySql(query: string, params: any[] = []) {
    if (!this.isMySqlConnected) {
      if (process.env.DB_REQUIRED === 'true' || process.env.NODE_ENV === 'production') {
        throw new Error('Database persistence failed: Authoritative MySQL is not connected.');
      }
      return;
    }
    try {
      await pool.query(query, params);
    } catch (err: any) {
      console.error(`MySQL persistence failure: ${err.message}`);
      if (process.env.DB_REQUIRED === 'true' || process.env.NODE_ENV === 'production') {
        throw new Error(`Authoritative MySQL query failed: ${err.message}`);
      }
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        // Ensure default required agricultural categories exist
        let loadedCategories: CategoryEntity[] = parsed.categories || initialCategories;
        for (const initCat of initialCategories) {
          if (!loadedCategories.some((c) => c.name.toLowerCase() === initCat.name.toLowerCase() || c.id === initCat.id)) {
            loadedCategories.push(initCat);
          }
        }

        let loadedUsers: UserEntity[] = parsed.users || initialUsers;
        if (!isProduction) {
          for (const initUser of initialUsers) {
            if (!loadedUsers.some((u) => u.id === initUser.id || u.email.toLowerCase() === initUser.email.toLowerCase())) {
              loadedUsers.push(initUser);
            }
          }
        } else {
          const predictableEmails = new Set([
            'admin@agrimarket.com',
            'seller@agrimarket.com',
            'buyer@agrimarket.com',
            'driver@agrimarket.com',
          ]);
          loadedUsers = loadedUsers.filter((u) => !predictableEmails.has(u.email.toLowerCase()));
          if (loadedUsers.length === 0) {
            console.warn(
              '⚠️ [SECURITY] Production mode: Default seed accounts are disabled. Run npm run bootstrap:admin to securely initialize the first platform administrator.'
            );
          }
        }

        return {
          users: loadedUsers,
          products: parsed.products || initialProducts,
          categories: loadedCategories,
          orders: parsed.orders || (isProduction ? [] : initialOrders),
          cart: parsed.cart || [],
          seller_applications: parsed.seller_applications || [],
          reviews: parsed.reviews || initialReviews,
          posts: parsed.posts || [],
          trades: parsed.trades || [],
          notifications: parsed.notifications || (isProduction ? [] : initialNotifications),
          messages: parsed.messages || [],
          delivery_jobs: parsed.delivery_jobs || (isProduction ? [] : initialDeliveries),
          coupons: parsed.coupons || initialCoupons,
          audit_logs: parsed.audit_logs && parsed.audit_logs.length > 0 ? parsed.audit_logs : initialAuditLogs,
          processed_webhooks: parsed.processed_webhooks || [],
        };
      }
    } catch (err) {
      console.error('Error reading database file, using seeds:', err);
    }

    const defaultData: DatabaseSchema = {
      users: isProduction ? [] : initialUsers,
      products: initialProducts,
      categories: initialCategories,
      orders: isProduction ? [] : initialOrders,
      cart: [],
      seller_applications: [],
      reviews: initialReviews,
      posts: [],
      trades: [],
      notifications: isProduction ? [] : initialNotifications,
      messages: [],
      delivery_jobs: isProduction ? [] : initialDeliveries,
      coupons: initialCoupons,
      audit_logs: initialAuditLogs,
      processed_webhooks: [],
    };

    this.saveData(defaultData);
    return defaultData;
  }

  public saveData(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const toWrite = dataToSave || this.data;
      const tmpFile = path.join(DATA_DIR, `agrimarket_db.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`);
      fs.writeFileSync(tmpFile, JSON.stringify(toWrite, null, 2), 'utf-8');
      try {
        fs.renameSync(tmpFile, DB_FILE);
      } catch {
        fs.copyFileSync(tmpFile, DB_FILE);
        fs.unlinkSync(tmpFile);
      }
    } catch (err) {
      console.error('Error saving database store:', err);
    }
  }

  // --- Webhooks Durable Replay Protection ---
  public isWebhookProcessed(eventId: string): boolean {
    if (!this.data.processed_webhooks) this.data.processed_webhooks = [];
    return this.data.processed_webhooks.some((w) => w.eventId === eventId);
  }

  public addProcessedWebhook(eventId: string, orderId: string) {
    if (!this.data.processed_webhooks) this.data.processed_webhooks = [];
    if (!this.isWebhookProcessed(eventId)) {
      this.data.processed_webhooks.push({
        eventId,
        orderId,
        processedAt: new Date().toISOString(),
      });
      this.saveData();
      this.executeMySql(
        'INSERT INTO processed_webhooks (event_id, order_id, processed_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE processed_at=NOW()',
        [eventId, orderId]
      );
    }
  }

  // --- Users ---
  public getUsers() {
    return this.data.users;
  }

  public getUserById(id: number) {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: Omit<UserEntity, 'id'> & { id?: number }) {
    const newId = user.id || (this.data.users.length ? Math.max(...this.data.users.map((u) => u.id)) + 1 : 1);
    const newUser: UserEntity = { ...user, id: newId };
    this.data.users.push(newUser);
    this.saveData();

    this.executeMySql(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, phone, is_verified, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE email=VALUES(email)',
      [newUser.id, newUser.email, newUser.password_hash, newUser.first_name, newUser.last_name, newUser.phone || null, newUser.is_verified ? 1 : 0, newUser.is_active ? 1 : 0]
    );

    return newUser;
  }

  public updateUser(id: number, updates: Partial<UserEntity>) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.saveData();

      this.executeMySql(
        'UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), is_active = COALESCE(?, is_active) WHERE id = ?',
        [updates.first_name || null, updates.last_name || null, updates.is_active !== undefined ? (updates.is_active ? 1 : 0) : null, id]
      );

      return this.data.users[idx];
    }
    return null;
  }

  public setUserActiveStatus(userId: number, isActive: boolean, reason?: string) {
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      user.is_active = isActive;
      if (!isActive) {
        user.suspension_reason = reason || 'Administrative suspension';
        user.suspended_at = new Date().toISOString();
      } else {
        delete user.suspension_reason;
        delete user.suspended_at;
      }
      this.saveData();
      return user;
    }
    return null;
  }

  public setUserRoles(userId: number, roles: string[]) {
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      user.roles = Array.from(new Set(roles));
      this.saveData();
      return user;
    }
    return null;
  }

  // --- Products ---
  public getProducts(includeInactive: boolean = false, sellerUserId?: number) {
    if (sellerUserId) {
      return this.data.products.filter(
        (p) => !p.isDeleted && (p.sellerUserId === sellerUserId || p.sellerId === `seller-${sellerUserId}`)
      );
    }
    if (includeInactive) {
      return this.data.products.filter((p) => !p.isDeleted);
    }
    return this.data.products.filter(
      (p) =>
        !p.isDeleted &&
        p.isActive !== false &&
        p.is_active !== false &&
        !p.isUnlisted &&
        p.moderationStatus !== 'rejected'
    );
  }

  public moderateProduct(
    id: string,
    action: 'approve' | 'flag' | 'delist' | 'reject',
    reason?: string,
    moderatedBy?: string
  ) {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const product = this.data.products[idx];
      product.moderatedAt = new Date().toISOString();
      if (moderatedBy) product.moderatedBy = moderatedBy;
      if (reason) product.moderationReason = reason;

      if (action === 'approve') {
        product.moderationStatus = 'approved';
        product.isUnlisted = false;
        product.isActive = true;
        product.is_active = true;
      } else if (action === 'flag') {
        product.moderationStatus = 'flagged';
      } else if (action === 'delist' || action === 'reject') {
        product.moderationStatus = action === 'delist' ? 'flagged' : 'rejected';
        product.isUnlisted = true;
        product.isActive = false;
        product.is_active = false;
      }
      this.saveData();
      return product;
    }
    return null;
  }

  public getProductById(id: string) {
    return this.data.products.find((p) => p.id === id);
  }

  public unlistProduct(id: string, unlisted: boolean = true) {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.data.products[idx] = {
        ...this.data.products[idx],
        isUnlisted: unlisted,
        isActive: !unlisted,
        is_active: !unlisted,
      };
      this.saveData();
      return this.data.products[idx];
    }
    return null;
  }

  public addProduct(product: ProductEntity) {
    this.data.products.unshift(product);
    this.saveData();

    this.executeMySql(
      'INSERT INTO products (id, seller_user_id, seller_id, category, name, description, price, unit, stock, rating, reviews_count, image, location, is_organic, is_active, is_unlisted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE stock=VALUES(stock), price=VALUES(price)',
      [product.id, product.sellerUserId, product.sellerId, product.category, product.name, product.description, product.price, product.unit, product.stock, product.rating || 5, product.reviews || 0, product.image, product.location, product.organic ? 1 : 0, product.isActive !== false ? 1 : 0, product.isUnlisted ? 1 : 0]
    );

    return product;
  }

  public updateProduct(id: string, updates: Partial<ProductEntity>) {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.data.products[idx] = { ...this.data.products[idx], ...updates };
      this.saveData();

      this.executeMySql(
        'UPDATE products SET price = COALESCE(?, price), stock = COALESCE(?, stock), is_active = COALESCE(?, is_active), is_unlisted = COALESCE(?, is_unlisted) WHERE id = ?',
        [updates.price !== undefined ? updates.price : null, updates.stock !== undefined ? updates.stock : null, updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : null, updates.isUnlisted !== undefined ? (updates.isUnlisted ? 1 : 0) : null, id]
      );

      return this.data.products[idx];
    }
    return null;
  }

  public deleteProduct(id: string, hardDelete: boolean = false) {
    if (hardDelete) {
      const prevLen = this.data.products.length;
      this.data.products = this.data.products.filter((p) => p.id !== id);
      if (this.data.products.length !== prevLen) {
        this.saveData();
        this.executeMySql('DELETE FROM products WHERE id = ?', [id]);
        return true;
      }
      return false;
    }
    const product = this.data.products.find((p) => p.id === id);
    if (product) {
      product.isDeleted = true;
      product.isActive = false;
      product.is_active = false;
      product.isUnlisted = true;
      this.saveData();
      this.executeMySql('UPDATE products SET is_deleted = 1, is_active = 0, is_unlisted = 1 WHERE id = ?', [id]);
      return true;
    }
    return false;
  }

  // --- Categories ---
  public getCategories() {
    return this.data.categories;
  }

  public getCategoryById(id: string) {
    return this.data.categories.find((c) => c.id === id || c.name.toLowerCase() === id.toLowerCase());
  }

  public addCategory(cat: CategoryEntity) {
    const existing = this.data.categories.find(
      (c) => c.id.toLowerCase() === cat.id.toLowerCase() || c.name.toLowerCase() === cat.name.toLowerCase()
    );
    if (existing) {
      throw new Error(`Category "${cat.name}" already exists`);
    }
    this.data.categories.push(cat);
    this.saveData();
    return cat;
  }

  public updateCategory(id: string, updates: Partial<CategoryEntity>) {
    const idx = this.data.categories.findIndex((c) => c.id === id || c.name.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
      this.saveData();
      return this.data.categories[idx];
    }
    return null;
  }

  public deleteCategory(id: string) {
    const prevLen = this.data.categories.length;
    this.data.categories = this.data.categories.filter((c) => c.id !== id && c.name.toLowerCase() !== id.toLowerCase());
    if (this.data.categories.length !== prevLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // --- Orders ---
  public getOrders() {
    return this.data.orders;
  }

  public getOrderById(id: string) {
    return this.data.orders.find((o) => o.id === id || o.receiptNo === id);
  }

  public getOrdersByUserId(userId: number) {
    return this.data.orders.filter((o) => o.userId === userId);
  }

  public getOrdersBySellerId(sellerId: string, sellerUserId?: number) {
    return this.data.orders.filter((o) =>
      o.items.some(
        (item) =>
          item.sellerId === sellerId ||
          (sellerUserId && item.sellerUserId === sellerUserId) ||
          (sellerUserId && item.sellerId === `seller-${sellerUserId}`) ||
          (sellerUserId && item.sellerId === `user-${sellerUserId}`)
      )
    );
  }

  public validateAndDeductStock(items: OrderItemEntity[]): ProductEntity[] {
    const updatedProducts: ProductEntity[] = [];

    // Step 1: Validate all items have sufficient active stock
    for (const item of items) {
      const prod = this.data.products.find((p) => p.id === item.productId);
      if (!prod) {
        throw new Error(`Product "${item.name || item.productId}" was not found in the catalog.`);
      }
      if (prod.isDeleted || prod.isActive === false || prod.is_active === false || prod.isUnlisted) {
        throw new Error(`Product "${prod.name}" is currently unavailable for purchase.`);
      }
      if (prod.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${prod.name}". Available: ${prod.stock} ${prod.unit || 'units'}, requested: ${item.quantity}.`
        );
      }
    }

    // Step 2: Deduct stock safely and update status
    for (const item of items) {
      const prod = this.data.products.find((p) => p.id === item.productId)!;
      prod.stock = Math.max(0, prod.stock - item.quantity);
      prod.availabilityStatus =
        prod.stock === 0 ? 'out_of_stock' : prod.stock <= 10 ? 'low_stock' : 'in_stock';
      updatedProducts.push({ ...prod });
      this.executeMySql('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [item.quantity, item.productId]);
    }

    this.saveData();
    return updatedProducts;
  }

  public restoreOrderStock(orderId: string): ProductEntity[] | null {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order || order.stockRestored) {
      return null;
    }

    const updatedProducts: ProductEntity[] = [];
    for (const item of order.items) {
      const prod = this.data.products.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock += item.quantity;
        if (prod.stock > 10 && prod.availabilityStatus === 'out_of_stock') {
          prod.availabilityStatus = 'in_stock';
        } else if (prod.stock > 0 && prod.availabilityStatus === 'out_of_stock') {
          prod.availabilityStatus = 'low_stock';
        }
        updatedProducts.push({ ...prod });
        this.executeMySql('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.productId]);
      }
    }

    order.stockRestored = true;
    this.executeMySql('UPDATE orders SET stock_restored = 1 WHERE id = ?', [orderId]);
    this.saveData();
    return updatedProducts;
  }

  public updateOrderItemPrep(
    orderId: string,
    productId: string,
    prepStatus: 'unpacked' | 'packing' | 'packed',
    notes?: string
  ): OrderEntity | null {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return null;

    let itemFound = false;
    order.items = order.items.map((item) => {
      if (item.productId === productId) {
        itemFound = true;
        return {
          ...item,
          prepStatus,
          prepNotes: notes !== undefined ? notes : item.prepNotes,
          packedAt: prepStatus === 'packed' ? new Date().toISOString() : item.packedAt,
        };
      }
      return item;
    });

    if (!itemFound) return null;

    const allPacked = order.items.every((it) => it.prepStatus === 'packed');
    const anyPacking = order.items.some((it) => it.prepStatus === 'packing' || it.prepStatus === 'packed');
    order.prepStatus = allPacked ? 'packed' : anyPacking ? 'packing' : 'unpacked';
    if (allPacked) {
      order.packedAt = new Date().toISOString();
      if (order.status === 'Pending') {
        order.status = 'Confirmed';
        order.sellerConfirmedAt = new Date().toISOString();
      }
    }

    this.saveData();
    return order;
  }

  public packOrder(orderId: string, packingNotes?: string): OrderEntity | null {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return null;

    const now = new Date().toISOString();
    order.items = order.items.map((item) => ({
      ...item,
      prepStatus: 'packed',
      packedAt: now,
    }));
    order.prepStatus = 'packed';
    order.packedAt = now;
    if (packingNotes !== undefined) order.packingNotes = packingNotes;
    if (order.status === 'Pending') {
      order.status = 'Confirmed';
      order.sellerConfirmedAt = now;
    }

    this.saveData();
    return order;
  }

  public async executeOrderTransaction(order: OrderEntity): Promise<void> {
    if (!this.isMySqlConnected) return;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Concurrency-safe atomic check & deduction using SELECT ... FOR UPDATE
      for (const item of order.items) {
        const [rows]: any = await conn.query(
          'SELECT stock, is_active, is_unlisted, is_deleted, name FROM products WHERE id = ? FOR UPDATE',
          [item.productId]
        );
        if (!rows || rows.length === 0) {
          throw new Error(`Product "${item.name || item.productId}" does not exist in authoritative database.`);
        }
        const p = rows[0];
        if (p.is_deleted || !p.is_active || p.is_unlisted) {
          throw new Error(`Product "${p.name}" is currently unavailable.`);
        }
        if (p.stock < item.quantity) {
          throw new Error(`Insufficient stock for "${p.name}". Authoritative available: ${p.stock}, requested: ${item.quantity}.`);
        }
        await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.productId]);
      }

      // Insert order
      await conn.query(
        'INSERT INTO orders (id, receipt_no, user_id, buyer_name, buyer_phone, address, subtotal, shipping_fee, shipping_discount, coupon_code, points_earned, points_redeemed, total, status, payment, payment_ref, payment_status, driver_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=VALUES(status)',
        [
          order.id,
          order.receiptNo,
          order.userId,
          order.buyerName,
          order.buyerPhone || null,
          order.address,
          order.subtotal,
          order.shippingFee,
          order.shippingDiscount,
          order.couponCode || null,
          order.pointsEarned,
          order.pointsRedeemed,
          order.total,
          order.status,
          order.payment,
          order.paymentRef || null,
          order.paymentStatus || 'pending',
          order.driverId || null,
        ]
      );

      // Insert order items
      for (const item of order.items) {
        await conn.query(
          'INSERT INTO order_items (order_id, product_id, name, price, quantity, unit, image, seller, seller_id, seller_user_id, pickup_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            order.id,
            item.productId,
            item.name,
            item.price,
            item.quantity,
            item.unit || 'kg',
            item.image || null,
            item.seller || null,
            item.sellerId || null,
            item.sellerUserId,
            item.pickupLocation || null,
          ]
        );
      }

      // Insert delivery job
      await conn.query(
        'INSERT INTO delivery_jobs (id, order_id, driver_id, buyer_name, buyer_phone, address, status, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=VALUES(status)',
        [
          `DEL-${order.id.replace('ORD-', '')}`,
          order.id,
          order.driverId || 4,
          order.buyerName,
          order.buyerPhone || null,
          order.address,
          order.status,
          order.lat || null,
          order.lng || null,
        ]
      );

      await conn.commit();
    } catch (err: any) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  public addOrder(order: OrderEntity) {
    // Check if order already exists (idempotency)
    const existing = this.data.orders.find((o) => o.id === order.id);
    if (existing) {
      return existing;
    }

    if (this.isMySqlConnected) {
      this.executeOrderTransaction(order).catch((err) => {
        console.error('MySQL Order Transaction Error:', err.message);
        if (process.env.DB_REQUIRED === 'true' || process.env.NODE_ENV === 'production') {
          throw err;
        }
      });
    }

    this.data.orders.unshift(order);

    // Auto-create delivery job
    const deliveryJob: DeliveryJobEntity = {
      id: `DEL-${order.id.replace('ORD-', '')}`,
      orderId: order.id,
      driverId: order.driverId || 4,
      buyerName: order.buyerName,
      buyerPhone: order.buyerPhone,
      address: order.address,
      status: order.status,
      lat: order.lat,
      lng: order.lng,
      updatedAt: new Date().toISOString(),
    };
    this.data.delivery_jobs.unshift(deliveryJob);

    this.saveData();

    if (!this.isMySqlConnected) {
      if (process.env.DB_REQUIRED === 'true' || process.env.NODE_ENV === 'production') {
        throw new Error('Database persistence failed: Authoritative MySQL is not connected.');
      }
    }

    return order;
  }

  public updateOrderStatus(id: string, status: OrderEntity['status'], extra?: Partial<OrderEntity>) {
    const idx = this.data.orders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      // If cancelled, restore stock once safely
      if (status === 'Cancelled') {
        this.restoreOrderStock(id);
      }

      this.data.orders[idx] = {
        ...this.data.orders[idx],
        status,
        ...extra,
      };

      this.executeMySql(
        'UPDATE orders SET status = ?, payment_status = COALESCE(?, payment_status), driver_id = COALESCE(?, driver_id) WHERE id = ?',
        [status, extra?.paymentStatus || null, extra?.driverId || null, id]
      );

      // Also sync delivery job status
      const delIdx = this.data.delivery_jobs.findIndex((d) => d.orderId === id);
      if (delIdx !== -1) {
        this.data.delivery_jobs[delIdx].status = status;
        this.data.delivery_jobs[delIdx].updatedAt = new Date().toISOString();
      }

      this.saveData();
      return this.data.orders[idx];
    }
    return null;
  }

  // --- Cart ---
  public getCart(userId: number) {
    return this.data.cart.filter((c) => c.userId === userId);
  }

  public addToCart(userId: number, productId: string, quantity: number = 1) {
    const existing = this.data.cart.find((c) => c.userId === userId && c.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.data.cart.push({
        id: `cart-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        userId,
        productId,
        quantity,
        createdAt: new Date().toISOString(),
      });
    }
    this.saveData();
    return this.getCart(userId);
  }

  public updateCartItem(userId: number, productId: string, quantity: number) {
    const item = this.data.cart.find((c) => c.userId === userId && c.productId === productId);
    if (item) {
      if (quantity <= 0) {
        this.data.cart = this.data.cart.filter((c) => !(c.userId === userId && c.productId === productId));
      } else {
        item.quantity = quantity;
      }
      this.saveData();
    }
    return this.getCart(userId);
  }

  public removeFromCart(userId: number, productId: string) {
    this.data.cart = this.data.cart.filter((c) => !(c.userId === userId && c.productId === productId));
    this.saveData();
    return this.getCart(userId);
  }

  public clearCart(userId: number) {
    this.data.cart = this.data.cart.filter((c) => c.userId !== userId);
    this.saveData();
  }

  // --- Seller Applications ---
  public getSellerApplications() {
    return this.data.seller_applications;
  }

  public getSellerApplicationByUserId(userId: number) {
    return this.data.seller_applications.find((a) => a.userId === userId);
  }

  public addSellerApplication(app: SellerApplicationEntity) {
    const existingIdx = this.data.seller_applications.findIndex((a) => a.userId === app.userId);
    if (existingIdx !== -1) {
      this.data.seller_applications[existingIdx] = app;
    } else {
      this.data.seller_applications.unshift(app);
    }
    this.saveData();
    return app;
  }

  public updateSellerApplicationStatus(
    id: string,
    status: 'Approved' | 'Rejected' | 'Needs Revision',
    reviewNotes?: string,
    reviewerEmail?: string
  ) {
    const app = this.data.seller_applications.find((a) => a.id === id);
    if (app) {
      app.status = status;
      app.reviewedAt = new Date().toISOString();
      if (reviewNotes !== undefined) {
        app.reviewNotes = reviewNotes;
      }
      if (reviewerEmail) {
        app.reviewedBy = reviewerEmail;
      }
      if (status === 'Approved') {
        const user = this.getUserById(app.userId);
        if (user && !user.roles.includes('seller')) {
          user.roles.push('seller');
        }
      }
      this.saveData();
      return app;
    }
    return null;
  }

  // --- Reviews ---
  public getReviewsForProduct(productId: string) {
    return this.data.reviews.filter((r) => r.productId === productId && r.status !== 'hidden');
  }

  public getAllReviews() {
    return this.data.reviews.map((r) => {
      const prod = this.getProductById(r.productId);
      return {
        ...r,
        productName: prod ? prod.name : 'Harvest Listing',
        seller: prod ? prod.seller : 'Local Producer',
        status: r.status || 'published',
      };
    });
  }

  public addReview(review: ReviewEntity) {
    const entity: ReviewEntity = {
      ...review,
      status: review.status || 'published',
    };
    this.data.reviews.unshift(entity);
    this.recalculateProductRating(review.productId);
    this.saveData();
    return entity;
  }

  public moderateReview(id: string, status: 'published' | 'hidden' | 'flagged', reason?: string) {
    const review = this.data.reviews.find((r) => r.id === id);
    if (review) {
      review.status = status;
      if (reason !== undefined) {
        review.moderationReason = reason;
      }
      review.moderatedAt = new Date().toISOString();
      this.recalculateProductRating(review.productId);
      this.saveData();
      return review;
    }
    return null;
  }

  public deleteReview(id: string) {
    const idx = this.data.reviews.findIndex((r) => r.id === id);
    if (idx !== -1) {
      const productId = this.data.reviews[idx].productId;
      this.data.reviews.splice(idx, 1);
      this.recalculateProductRating(productId);
      this.saveData();
      return true;
    }
    return false;
  }

  private recalculateProductRating(productId: string) {
    const productReviews = this.data.reviews.filter((r) => r.productId === productId && r.status !== 'hidden');
    const avg =
      productReviews.length > 0
        ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
        : 5.0;
    this.updateProduct(productId, {
      rating: parseFloat(avg.toFixed(1)),
      reviews: productReviews.length,
    });
  }

  // --- Posts / Harvest Feed ---
  public getPosts() {
    return this.data.posts;
  }

  public addPost(post: PostEntity) {
    this.data.posts.unshift(post);
    this.saveData();
    return post;
  }

  // --- Trades ---
  public getTrades() {
    return this.data.trades;
  }

  public addTrade(trade: TradeOfferEntity) {
    this.data.trades.unshift(trade);
    this.saveData();
    return trade;
  }

  public updateTradeStatus(id: string, status: 'Accepted' | 'Declined') {
    const trade = this.data.trades.find((t) => t.id === id);
    if (trade) {
      trade.status = status;
      this.saveData();
      return trade;
    }
    return null;
  }

  // --- Notifications ---
  public getNotifications(userId?: number) {
    return this.data.notifications.filter((n) => n.userId === 'all' || n.userId === userId);
  }

  public addNotification(notification: NotificationEntity) {
    this.data.notifications.unshift(notification);
    this.saveData();
    return notification;
  }

  public markNotificationRead(id: string, userId: number) {
    const n = this.data.notifications.find((item) => item.id === id);
    if (n && !n.readBy.includes(userId)) {
      n.readBy.push(userId);
      this.saveData();
    }
  }

  public markAllNotificationsRead(userId: number) {
    this.data.notifications.forEach((n) => {
      if ((n.userId === 'all' || n.userId === userId) && !n.readBy.includes(userId)) {
        n.readBy.push(userId);
      }
    });
    this.saveData();
  }

  // --- Messages & SMS ---
  public getMessages(orderId?: string, userId?: number) {
    return this.data.messages.filter((m) => {
      if (orderId && m.orderId !== orderId) return false;
      if (userId && m.toUserId !== userId && m.fromUserId !== userId) return false;
      return true;
    });
  }

  public addMessage(message: MessageEntity) {
    this.data.messages.unshift(message);
    this.saveData();
    return message;
  }

  // --- Deliveries ---
  public getDeliveries(driverId?: number) {
    if (driverId) {
      return this.data.delivery_jobs.filter((d) => d.driverId === driverId);
    }
    return this.data.delivery_jobs;
  }

  public updateDelivery(id: string, updates: Partial<DeliveryJobEntity>) {
    const job = this.data.delivery_jobs.find((d) => d.id === id || d.orderId === id);
    if (job) {
      Object.assign(job, updates, { updatedAt: new Date().toISOString() });
      if (updates.status) {
        const order = this.data.orders.find((o) => o.id === job.orderId);
        if (order) {
          order.status = updates.status as OrderEntity['status'];
        }
      }
      this.saveData();
      return job;
    }
    return null;
  }

  // --- Coupons & Promotions ---
  public getCoupons() {
    return this.data.coupons.filter((c) => c.isActive);
  }

  public getAllCoupons() {
    return this.data.coupons;
  }

  public addCoupon(coupon: CouponEntity) {
    const existing = this.data.coupons.find((c) => c.code.toUpperCase() === coupon.code.toUpperCase());
    if (existing) {
      throw new Error(`Promotion code "${coupon.code}" already exists`);
    }
    const newCoupon: CouponEntity = {
      ...coupon,
      code: coupon.code.toUpperCase().trim(),
      createdAt: coupon.createdAt || new Date().toISOString(),
      isActive: coupon.isActive !== undefined ? coupon.isActive : true,
    };
    this.data.coupons.unshift(newCoupon);
    this.saveData();
    return newCoupon;
  }

  public updateCoupon(code: string, updates: Partial<CouponEntity>) {
    const idx = this.data.coupons.findIndex((c) => c.code.toUpperCase() === code.toUpperCase());
    if (idx !== -1) {
      this.data.coupons[idx] = {
        ...this.data.coupons[idx],
        ...updates,
        code: updates.code ? updates.code.toUpperCase().trim() : this.data.coupons[idx].code,
      };
      this.saveData();
      return this.data.coupons[idx];
    }
    return null;
  }

  public deleteCoupon(code: string) {
    const prevLen = this.data.coupons.length;
    this.data.coupons = this.data.coupons.filter((c) => c.code.toUpperCase() !== code.toUpperCase());
    if (this.data.coupons.length !== prevLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  public validateCoupon(code: string, subtotal: number) {
    const coupon = this.data.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
    if (!coupon) {
      return { valid: false, message: 'Invalid promo code', discount: 0 };
    }
    if (subtotal < coupon.minSpend) {
      return {
        valid: false,
        message: `Requires minimum purchase of ₱${coupon.minSpend}`,
        discount: 0,
      };
    }
    return {
      valid: true,
      message: `Coupon applied: ${coupon.description}`,
      discount: coupon.discount,
      type: coupon.type,
      code: coupon.code,
    };
  }

  // --- Audit Logs ---
  public getAuditLogs(filters?: { targetType?: string; action?: string; search?: string; limit?: number }) {
    let logs = [...this.data.audit_logs];
    if (filters?.targetType && filters.targetType !== 'all') {
      logs = logs.filter((l) => l.targetType === filters.targetType);
    }
    if (filters?.action && filters.action !== 'all') {
      logs = logs.filter((l) => l.action.toLowerCase().includes(filters.action!.toLowerCase()));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.details.toLowerCase().includes(q) ||
          l.adminEmail.toLowerCase().includes(q) ||
          l.targetId.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q)
      );
    }
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filters?.limit) {
      return logs.slice(0, filters.limit);
    }
    return logs;
  }

  public addAuditLog(log: Omit<AuditLogEntity, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) {
    const newLog: AuditLogEntity = {
      id: log.id || `audit-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      createdAt: log.createdAt || new Date().toISOString(),
      ...log,
    };
    this.data.audit_logs.unshift(newLog);
    if (this.data.audit_logs.length > 1000) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 1000);
    }
    this.saveData();
    return newLog;
  }
}

export const db = new DatabaseStore();
