import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import pool, { classifyDatabaseError, DatabaseFailureKind } from '../config/database';
import { databaseUnavailableError, isDatabaseRequired, isEmbeddedFallbackAllowed } from '../config/persistence';
import { normalizeRoles } from '../utils/roles';

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
  variations?: Array<{
    id: string;
    name: string;
    multiplier: number;
    price: number;
    unit: string;
    inStock?: boolean;
  }>;
}

export interface ProductVariation {
  id: string;
  name: string;
  multiplier: number;
  price: number;
  unit: string;
  inStock?: boolean;
}

export interface OrderStatusAudit {
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready for Pickup' | 'Shipped' | 'Out for delivery' | 'Delivered' | 'Cancelled';
  changedBy?: number;
  changedByName?: string;
  changedByRole?: string;
  timestamp: string;
  note?: string;
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
  sellerConfirmed?: boolean;
  sellerConfirmedAt?: string;
  isMine?: boolean;
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
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready for Pickup' | 'Shipped' | 'Out for delivery' | 'Delivered' | 'Cancelled';
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
  statusHistory?: OrderStatusAudit[];
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
  fromProductImage?: string;
  offerQuantity?: number;
  offerUnit?: string;
  offerValue?: number;
  toSellerId: string;
  toSellerName?: string;
  toProductId: string;
  toProductName: string;
  toProductImage?: string;
  wantQuantity?: number;
  wantUnit?: string;
  wantValue?: number;
  cashOffset?: number;
  note: string;
  status: 'Open' | 'Accepted' | 'Declined' | 'Countered';
  counterOffer?: {
    counterQuantity?: number;
    counterCashOffset?: number;
    counterNote?: string;
    counterBy?: string;
    counterAt?: string;
  };
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

export interface ListingReportEntity {
  id: string;
  productId: string;
  productName: string;
  sellerId?: string;
  reporterUserId: number;
  reporterName: string;
  reporterEmail?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolutionAction?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'agrimarket_db.json');

const disableDemoAccounts = process.env.DISABLE_DEMO_ACCOUNTS === 'true' || process.env.STRICT_PROD_AUTH === 'true';

// Initial seed accounts with pre-hashed passwords ('admin123', 'seller123', 'buyer123', 'driver123')
// SECURITY: Predictable default seed credentials can be disabled via DISABLE_DEMO_ACCOUNTS=true in production
const defaultPasswordHash = bcrypt.hashSync('buyer123', 8);
const adminPasswordHash = bcrypt.hashSync('admin123', 8);
const sellerPasswordHash = bcrypt.hashSync('seller123', 8);
const driverPasswordHash = bcrypt.hashSync('driver123', 8);

export const initialUsers: UserEntity[] = disableDemoAccounts
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
  {
    id: 18,
    email: 'seller.livestock@agrimarket.com',
    password_hash: sellerPasswordHash,
    first_name: 'Ramon',
    last_name: 'Valdez',
    phone: '+639178889900',
    roles: ['seller', 'buyer'],
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export const initialProducts: ProductEntity[] = [
  // 1. Vegetables -> Green Valley Farm (Maria Santos, id: 2, seller-2)
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
    sellerId: 'seller-2',
    sellerUserId: 2,
    location: 'Polomolok, South Cotabato',
    image: '/images/tomato.jpg',
    photos: ['/images/tomato.jpg', '/images/farm.jpg'],
    description: 'Firm, sweet salad tomatoes harvested at dawn in Polomolok. Ideal for sinigang, salsa, and everyday cooking.',
    organic: true,
    tradeable: true,
    lat: 6.2214,
    lng: 125.0647,
    priceHistory: [{ date: '2026-10-01', price: 85 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
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
    seller: 'Green Valley Farm',
    sellerId: 'seller-2',
    sellerUserId: 2,
    location: 'Polomolok, South Cotabato',
    image: '/images/kangkong.jpg',
    photos: ['/images/kangkong.jpg'],
    description: 'Crisp water spinach bunches washed and bundled the same morning.',
    organic: true,
    tradeable: true,
    lat: 6.2214,
    lng: 125.0647,
    priceHistory: [{ date: '2026-10-01', price: 35 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-ampalaya',
    name: 'Organic Ampalaya (Bitter Gourd)',
    category: 'Vegetables',
    price: 75,
    unit: 'kg',
    stock: 60,
    rating: 4.8,
    reviews: 47,
    seller: 'Green Valley Farm',
    sellerId: 'seller-2',
    sellerUserId: 2,
    location: 'Polomolok, South Cotabato',
    image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&auto=format&fit=crop&q=80'],
    description: 'Crisp green bitter melons cultivated without chemical sprays. Excellent for blood sugar management and ginisang ampalaya.',
    organic: true,
    tradeable: true,
    lat: 6.2214,
    lng: 125.0647,
    priceHistory: [{ date: '2026-10-01', price: 75 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-eggplant',
    name: 'Long Purple Eggplant (Talong)',
    category: 'Vegetables',
    price: 60,
    unit: 'kg',
    stock: 95,
    rating: 4.7,
    reviews: 32,
    seller: 'Green Valley Farm',
    sellerId: 'seller-2',
    sellerUserId: 2,
    location: 'Polomolok, South Cotabato',
    image: 'https://images.unsplash.com/photo-1628773822503-930a84e930f7?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1628773822503-930a84e930f7?w=600&auto=format&fit=crop&q=80'],
    description: 'Glossy, tender long purple eggplants picked fresh every morning. Perfect for tortang talong and pinakbet.',
    organic: true,
    tradeable: true,
    lat: 6.2214,
    lng: 125.0647,
    priceHistory: [{ date: '2026-10-01', price: 60 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-kalabasa',
    name: 'Supreme Squash (Kalabasa)',
    category: 'Vegetables',
    price: 45,
    unit: 'kg',
    stock: 110,
    rating: 4.6,
    reviews: 25,
    seller: 'Green Valley Farm',
    sellerId: 'seller-2',
    sellerUserId: 2,
    location: 'Polomolok, South Cotabato',
    image: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=600&auto=format&fit=crop&q=80'],
    description: 'Thick, creamy yellow flesh squash with high carotene content. Great for ginataang kalabasa and healthy hearty stews.',
    organic: true,
    tradeable: true,
    lat: 6.2214,
    lng: 125.0647,
    priceHistory: [{ date: '2026-10-01', price: 45 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-lettuce',
    name: 'Hydroponic Romaine Lettuce',
    category: 'Vegetables',
    price: 120,
    unit: 'pack',
    stock: 60,
    rating: 4.9,
    reviews: 42,
    seller: 'Green Valley Farm',
    sellerId: 'seller-2',
    sellerUserId: 2,
    location: 'Polomolok, South Cotabato',
    image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&auto=format&fit=crop&q=80'],
    description: 'Crisp, sweet butterhead and romaine heads grown in pristine mountain water nutrient film technique (NFT). Zero soil grit.',
    organic: true,
    tradeable: true,
    lat: 6.2214,
    lng: 125.0647,
    priceHistory: [{ date: '2026-10-01', price: 120 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-mushroom',
    name: 'Fresh White Oyster Mushrooms',
    category: 'Vegetables',
    price: 95,
    unit: 'pack',
    stock: 40,
    rating: 4.8,
    reviews: 33,
    seller: 'Green Valley Farm',
    sellerId: 'seller-2',
    sellerUserId: 2,
    location: 'Polomolok, South Cotabato',
    image: 'https://images.unsplash.com/photo-1509650969542-a083313eb6cb?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1509650969542-a083313eb6cb?w=600&auto=format&fit=crop&q=80'],
    description: 'Succulent oyster mushrooms cultivated on pasteurized sawdust and rice bran substrate. Excellent vegan meat substitute.',
    organic: true,
    tradeable: true,
    lat: 6.2214,
    lng: 125.0647,
    priceHistory: [{ date: '2026-10-01', price: 95 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-onion',
    name: 'Red Creole Onions (Sibuyas)',
    category: 'Vegetables',
    price: 130,
    unit: 'kg',
    stock: 180,
    rating: 4.8,
    reviews: 76,
    seller: 'Green Valley Farm',
    sellerId: 'seller-2',
    sellerUserId: 2,
    location: 'Polomolok, South Cotabato',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80'],
    description: 'Pungent, dry-cured red onions from local farms. Excellent keeping quality and savory richness.',
    organic: false,
    tradeable: true,
    lat: 6.2214,
    lng: 125.0647,
    priceHistory: [{ date: '2026-10-01', price: 130 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-garlic',
    name: 'Native White Garlic (Bawang)',
    category: 'Vegetables',
    price: 190,
    unit: 'kg',
    stock: 80,
    rating: 4.9,
    reviews: 52,
    seller: 'Green Valley Farm',
    sellerId: 'seller-2',
    sellerUserId: 2,
    location: 'Polomolok, South Cotabato',
    image: 'https://images.unsplash.com/photo-1615477550927-6ec84459d249?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1615477550927-6ec84459d249?w=600&auto=format&fit=crop&q=80'],
    description: 'Intensely fragrant native Philippine garlic cloves. Packed with natural allicin, vital for sautéing and home medicine.',
    organic: true,
    tradeable: true,
    lat: 6.2214,
    lng: 125.0647,
    priceHistory: [{ date: '2026-10-01', price: 190 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-ginger',
    name: 'Fresh Yellow Ginger (Luya)',
    category: 'Vegetables',
    price: 110,
    unit: 'kg',
    stock: 70,
    rating: 4.7,
    reviews: 38,
    seller: 'Green Valley Farm',
    sellerId: 'seller-2',
    sellerUserId: 2,
    location: 'Polomolok, South Cotabato',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80'],
    description: 'Spicy ginger rhizomes. Plump and fiber-rich, essential for tinola, salabat, and seafood marinades.',
    organic: true,
    tradeable: true,
    lat: 6.2214,
    lng: 125.0647,
    priceHistory: [{ date: '2026-10-01', price: 110 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'prod-1791732814162-2f8d',
    name: 'Highland Red Bell Peppers',
    category: 'Vegetables',
    price: 140,
    unit: 'kg',
    stock: 65,
    rating: 5,
    reviews: 0,
    seller: 'Green Valley Farm',
    sellerId: 'seller-2',
    sellerUserId: 2,
    location: 'Polomolok, South Cotabato',
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80'],
    description: 'Sweet, crisp bell peppers harvested fresh.',
    organic: true,
    tradeable: false,
    lat: 6.2214,
    lng: 125.0647,
    priceHistory: [{ date: '2026-10-01', price: 140 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },

  // 2. Fruits -> Midsayap Gold Orchard (Eduardo Dizon, id: 13, seller-13)
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
    sellerId: 'seller-13',
    sellerUserId: 13,
    location: 'Midsayap, Cotabato',
    image: '/images/mango.jpg',
    photos: ['/images/mango.jpg', '/images/farm.jpg'],
    description: 'Export-grade sweet Carabao mangoes from Midsayap. Tree-ripened, golden yellow, and fragrant.',
    organic: true,
    tradeable: true,
    lat: 7.1906,
    lng: 124.5381,
    priceHistory: [{ date: '2026-10-01', price: 180 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
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
    seller: 'Midsayap Gold Orchard',
    sellerId: 'seller-13',
    sellerUserId: 13,
    location: 'Midsayap, Cotabato',
    image: '/images/banana.jpg',
    photos: ['/images/banana.jpg'],
    description: 'Sweet, golden Lakatan bananas freshly harvested from orchards near Midsayap.',
    organic: false,
    tradeable: true,
    lat: 7.1906,
    lng: 124.5381,
    priceHistory: [{ date: '2026-10-01', price: 75 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-calamansi',
    name: 'Fresh Juicy Calamansi',
    category: 'Fruits',
    price: 70,
    unit: 'kg',
    stock: 85,
    rating: 4.7,
    reviews: 44,
    seller: 'Midsayap Gold Orchard',
    sellerId: 'seller-13',
    sellerUserId: 13,
    location: 'Midsayap, Cotabato',
    image: '/images/calamansi.jpg',
    photos: ['/images/calamansi.jpg'],
    description: 'High-yield aromatic calamansi from Midsayap orchards. Bursting with vitamin C for drinks and marinades.',
    organic: true,
    tradeable: true,
    lat: 7.1906,
    lng: 124.5381,
    priceHistory: [{ date: '2026-10-01', price: 70 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-durian',
    name: 'Fresh Puyat Durian',
    category: 'Fruits',
    price: 240,
    unit: 'kg',
    stock: 40,
    rating: 5,
    reviews: 94,
    seller: 'Midsayap Gold Orchard',
    sellerId: 'seller-13',
    sellerUserId: 13,
    location: 'Midsayap, Cotabato',
    image: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=600&auto=format&fit=crop&q=80'],
    description: 'King of Fruits! Creamy, bittersweet Puyat durian from volcanic soils in Cotabato.',
    organic: true,
    tradeable: true,
    lat: 7.1906,
    lng: 124.5381,
    priceHistory: [{ date: '2026-10-01', price: 240 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-mangosteen',
    name: 'Sweet Highland Mangosteen',
    category: 'Fruits',
    price: 160,
    unit: 'kg',
    stock: 50,
    rating: 4.9,
    reviews: 61,
    seller: 'Midsayap Gold Orchard',
    sellerId: 'seller-13',
    sellerUserId: 13,
    location: 'Midsayap, Cotabato',
    image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80'],
    description: 'Queen of Fruits! Juicy, snow-white arils packed with potent xanthones and natural antioxidants.',
    organic: true,
    tradeable: true,
    lat: 7.1906,
    lng: 124.5381,
    priceHistory: [{ date: '2026-10-01', price: 160 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-papaya',
    name: 'Red Lady Sweet Papaya',
    category: 'Fruits',
    price: 55,
    unit: 'kg',
    stock: 90,
    rating: 4.7,
    reviews: 49,
    seller: 'Midsayap Gold Orchard',
    sellerId: 'seller-13',
    sellerUserId: 13,
    location: 'Midsayap, Cotabato',
    image: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=600&auto=format&fit=crop&q=80'],
    description: 'Tree-ripened Red Lady hybrid papayas. Dense orange-red pulp, intensely sweet with very few seeds.',
    organic: true,
    tradeable: true,
    lat: 7.1906,
    lng: 124.5381,
    priceHistory: [{ date: '2026-10-01', price: 55 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-dragonfruit',
    name: 'Red Flesh Dragon Fruit',
    category: 'Fruits',
    price: 150,
    unit: 'kg',
    stock: 55,
    rating: 4.9,
    reviews: 63,
    seller: 'Midsayap Gold Orchard',
    sellerId: 'seller-13',
    sellerUserId: 13,
    location: 'Midsayap, Cotabato',
    image: 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1527325678964-54921661f888?w=600&auto=format&fit=crop&q=80'],
    description: 'Vibrant magenta-fleshed pitahaya harvested at peak ripeness. Juicy, rich in dietary fiber and prebiotics.',
    organic: true,
    tradeable: true,
    lat: 7.1906,
    lng: 124.5381,
    priceHistory: [{ date: '2026-10-01', price: 150 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },

  // 3. Rice -> Tacurong Rice Mills (Lilia Mendoza, id: 15, seller-15)
  {
    id: 'p-rice',
    name: 'Dinorado Rice',
    category: 'Rice',
    price: 58,
    unit: 'kg',
    stock: 300,
    rating: 4.9,
    reviews: 110,
    seller: 'Tacurong Rice Mills',
    sellerId: 'seller-15',
    sellerUserId: 15,
    location: 'Tacurong City, Sultan Kudarat',
    image: '/images/rice.jpg',
    photos: ['/images/rice.jpg'],
    description: 'Aromatic whole-grain Dinorado rice from Tacurong plains. Soft, fluffy texture when cooked.',
    organic: false,
    tradeable: true,
    lat: 6.6925,
    lng: 124.6764,
    priceHistory: [{ date: '2026-10-01', price: 58 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-blackrice',
    name: 'Organic Black Rice (Tapol)',
    category: 'Rice',
    price: 88,
    unit: 'kg',
    stock: 150,
    rating: 4.9,
    reviews: 69,
    seller: 'Tacurong Rice Mills',
    sellerId: 'seller-15',
    sellerUserId: 15,
    location: 'Tacurong City, Sultan Kudarat',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80'],
    description: 'Ancestral heirloom black rice rich in anthocyanins. Nutty flavor, low glycemic index, favored by health enthusiasts.',
    organic: true,
    tradeable: true,
    lat: 6.6925,
    lng: 124.6764,
    priceHistory: [{ date: '2026-10-01', price: 88 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },

  // 4. Grains -> Koronadal Grain Farms (Juanita Reyes, id: 12, seller-12)
  {
    id: 'p-corn',
    name: 'Sweet Yellow Corn',
    category: 'Grains',
    price: 45,
    unit: 'kg',
    stock: 80,
    rating: 4.7,
    reviews: 35,
    seller: 'Koronadal Grain Farms',
    sellerId: 'seller-12',
    sellerUserId: 12,
    location: 'Koronadal City, South Cotabato',
    image: '/images/corn.jpg',
    photos: ['/images/corn.jpg'],
    description: 'Juicy, golden sweet corn cobs from South Cotabato grain farms. Great for boiling or grilling.',
    organic: false,
    tradeable: true,
    lat: 6.5004,
    lng: 124.8436,
    priceHistory: [{ date: '2026-10-01', price: 45 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },

  // 5. Fish -> Lake Sebu Fisheries (Danilo Blaan, id: 17, seller-17)
  {
    id: 'p-tilapia',
    name: 'Lake Sebu Fresh Tilapia',
    category: 'Fish',
    price: 160,
    unit: 'kg',
    stock: 90,
    rating: 4.9,
    reviews: 67,
    seller: 'Lake Sebu Fisheries',
    sellerId: 'seller-17',
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
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-bangus',
    name: 'Fresh Boneless Bangus',
    category: 'Fish',
    price: 175,
    unit: 'kg',
    stock: 85,
    rating: 4.8,
    reviews: 83,
    seller: 'Lake Sebu Fisheries',
    sellerId: 'seller-17',
    sellerUserId: 17,
    location: 'Lake Sebu, South Cotabato',
    image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&auto=format&fit=crop&q=80'],
    description: 'Plump Sarangani Bay milkfish, deboned and packed immediately on flake ice. Tender, rich belly fat.',
    organic: false,
    tradeable: true,
    lat: 6.2255,
    lng: 124.7088,
    priceHistory: [{ date: '2026-10-01', price: 175 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },

  // 6. Poultry -> Koronadal Sunrise Poultry (Nestor Aquino, id: 16, seller-16)
  {
    id: 'p-chicken',
    name: 'Native Whole Chicken',
    category: 'Poultry',
    price: 320,
    unit: 'kg',
    stock: 25,
    rating: 4.8,
    reviews: 39,
    seller: 'Koronadal Sunrise Poultry',
    sellerId: 'seller-16',
    sellerUserId: 16,
    location: 'Koronadal City, South Cotabato',
    image: '/images/chicken.jpg',
    photos: ['/images/chicken.jpg'],
    description: 'Free-range native chicken raised on grass and corn. Superior taste and firmness for authentic tinola.',
    organic: true,
    tradeable: true,
    lat: 6.5004,
    lng: 124.8436,
    priceHistory: [{ date: '2026-10-01', price: 320 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-eggs',
    name: 'Free-Range Brown Eggs',
    category: 'Poultry',
    price: 220,
    unit: 'tray',
    stock: 75,
    rating: 4.8,
    reviews: 53,
    seller: 'Koronadal Sunrise Poultry',
    sellerId: 'seller-16',
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
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },

  // 7. Livestock -> Surallah Dairy Farm (Ramon Valdez, id: 18, seller-18)
  {
    id: 'p-milk',
    name: 'Fresh Carabao Milk',
    category: 'Livestock',
    price: 95,
    unit: 'liter',
    stock: 35,
    rating: 4.8,
    reviews: 36,
    seller: 'Surallah Dairy Farm',
    sellerId: 'seller-18',
    sellerUserId: 18,
    location: 'Surallah, South Cotabato',
    image: '/images/milk.jpg',
    photos: ['/images/milk.jpg'],
    description: 'Creamy, unpasteurized natural carabao milk collected at 5:00 AM. Ideal for kesong puti and pasture pastillas.',
    organic: true,
    tradeable: true,
    lat: 6.3753,
    lng: 124.7456,
    priceHistory: [{ date: '2026-10-01', price: 95 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },

  // 8. Farm Supplies -> Gensan Agri Supply (Roberto Tan, id: 14, seller-14)
  {
    id: 'p-fertilizer',
    name: 'Vermicast Organic Fertilizer',
    category: 'Farm Supplies',
    price: 250,
    unit: 'sack',
    stock: 65,
    rating: 4.9,
    reviews: 58,
    seller: 'Gensan Agri Supply',
    sellerId: 'seller-14',
    sellerUserId: 14,
    location: 'General Santos City',
    image: '/images/compost.jpg',
    photos: ['/images/compost.jpg'],
    description: '100% pure worm castings (vermicompost). Highly concentrated microbial inoculant to revitalize garden and farm soil.',
    organic: true,
    tradeable: true,
    lat: 6.1164,
    lng: 125.1716,
    priceHistory: [{ date: '2026-10-01', price: 250 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-seeds',
    name: 'Hybrid Ampalaya Seeds',
    category: 'Farm Supplies',
    price: 65,
    unit: 'pack',
    stock: 140,
    rating: 4.6,
    reviews: 29,
    seller: 'Gensan Agri Supply',
    sellerId: 'seller-14',
    sellerUserId: 14,
    location: 'General Santos City',
    image: '/images/seeds.jpg',
    photos: ['/images/seeds.jpg'],
    description: 'High germination (92%) disease-resistant bitter gourd seeds. Tested for SOCCSKSARGEN highland and lowland plots.',
    organic: true,
    tradeable: true,
    lat: 6.1164,
    lng: 125.1716,
    priceHistory: [{ date: '2026-10-01', price: 65 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
  {
    id: 'p-honey',
    name: 'Pure Wild Forest Honey',
    category: 'Farm Supplies',
    price: 320,
    unit: 'bottle',
    stock: 45,
    rating: 5,
    reviews: 115,
    seller: 'Gensan Agri Supply',
    sellerId: 'seller-14',
    sellerUserId: 14,
    location: 'General Santos City',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80',
    photos: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80'],
    description: 'Raw, unheated multifloral wild bee honey harvested sustainably from forested slopes.',
    organic: true,
    tradeable: true,
    lat: 6.1164,
    lng: 125.1716,
    priceHistory: [{ date: '2026-10-01', price: 320 }],
    isActive: true,
    is_active: true,
    isUnlisted: false,
    isDeleted: false,
  },
];

export const initialCategories: CategoryEntity[] = [
  { id: 'cat-veg', name: 'Vegetables', description: 'Fresh local leafy greens, roots and daily harvests', icon: 'Leaf', imageUrl: '/images/kangkong.jpg' },
  { id: 'cat-fruits', name: 'Fruits', description: 'Tree-ripened sweet Carabao mangoes, bananas & tropical harvests', icon: 'Apple', imageUrl: '/images/mango.jpg' },
  { id: 'cat-rice', name: 'Rice', description: 'Mindanao milled Dinorado, Sinandomeng, brown and black rice', icon: 'Wheat', imageUrl: '/images/rice.jpg' },
  { id: 'cat-grains', name: 'Grains', description: 'Mindanao sweet yellow corn, white flint, sorghum and grain feeds', icon: 'Wheat', imageUrl: '/images/corn.jpg' },
  { id: 'cat-supplies', name: 'Farm Supplies', description: 'Organic fertilizers, compost, planting seeds and farm tools', icon: 'Sprout', imageUrl: '/images/compost.jpg' },
  { id: 'cat-poultry', name: 'Poultry', description: 'Farm-fresh pasture brown eggs and poultry', icon: 'Egg', imageUrl: '/images/eggs.jpg' },
  { id: 'cat-livestock', name: 'Livestock', description: 'Farm-raised fresh dairy and pasture cattle', icon: 'Milk', imageUrl: '/images/milk.jpg' },
  { id: 'cat-fish', name: 'Fish', description: 'Lake Sebu spring tilapia and General Santos fresh catch', icon: 'Fish', imageUrl: '/images/tilapia.jpg' },
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
  listingReports: ListingReportEntity[];
}

class DatabaseStore {
  private data: DatabaseSchema;
  private isMySqlConnected: boolean = false;
  private lastFailureKind: DatabaseFailureKind | null = null;
  private lastFailureMessage: string | null = null;
  public readonly readyPromise: Promise<void>;
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;
  private wishlists: Map<number, string[]> = new Map();
  private inventoryMovements: Array<{
    id: string;
    productId: string;
    userId?: number;
    quantityDelta: number;
    reason: string;
    orderId?: string;
    createdAt: string;
  }> = [];
  private orderStatusEvents: Array<{
    id: string;
    orderId: string;
    fromStatus?: string;
    toStatus: string;
    actorUserId?: number;
    note?: string;
    createdAt: string;
  }> = [];

  constructor() {
    this.data = isEmbeddedFallbackAllowed() ? this.loadData() : this.emptySchema();
    this.readyPromise = this.checkMySqlConnection().catch((err) => {
      const classified = classifyDatabaseError(err);
      this.lastFailureKind = classified.kind;
      this.lastFailureMessage = classified.message;
      console.warn('Database connection initialization notice:', classified.kind, classified.message);
      this.startReconnectLoop();
    });
  }

  public async waitUntilReady() {
    await this.readyPromise;
  }

  public getIsMySqlConnected(): boolean {
    return this.isMySqlConnected;
  }

  public getReadiness() {
    const required = isDatabaseRequired();
    const embedded = isEmbeddedFallbackAllowed();
    const ready = this.isMySqlConnected || (!required && embedded);
    return {
      ready,
      databaseRequired: required,
      connected: this.isMySqlConnected,
      mode: this.isMySqlConnected ? 'postgresql' : embedded ? 'embedded_dev' : 'unavailable',
      failureKind: this.isMySqlConnected ? null : this.lastFailureKind,
      failureMessage: this.isMySqlConnected ? null : this.lastFailureMessage,
    };
  }

  public assertPersistentStore() {
    if (this.isMySqlConnected || isEmbeddedFallbackAllowed()) return;
    throw databaseUnavailableError();
  }

  private emptySchema(): DatabaseSchema {
    return {
      users: [],
      products: [],
      categories: [],
      orders: [],
      cart: [],
      seller_applications: [],
      reviews: [],
      posts: [],
      trades: [],
      notifications: [],
      messages: [],
      delivery_jobs: [],
      coupons: [],
      audit_logs: [],
      processed_webhooks: [],
      listingReports: [],
    };
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async checkMySqlConnection() {
    const maxAttempts = parseInt(process.env.DB_CONNECT_RETRIES || '5', 10);
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const conn = await pool.getConnection();
        await conn.query('SELECT 1');
        this.isMySqlConnected = true;
        this.lastFailureKind = null;
        this.lastFailureMessage = null;
        conn.release();
        console.log('✅ Connected to authoritative database instance (Supabase PostgreSQL).');
        await this.initMySqlSchemaAndData();
        return;
      } catch (e: any) {
        lastError = e;
        this.isMySqlConnected = false;
        const classified = classifyDatabaseError(e);
        this.lastFailureKind = classified.kind;
        this.lastFailureMessage = classified.message;
        const delay = Math.min(8000, 400 * 2 ** (attempt - 1));
        console.warn(
          `⚠️ Database connection attempt ${attempt}/${maxAttempts} failed [${classified.kind}]: ${classified.message}`
        );
        if (attempt < maxAttempts) {
          await this.sleep(delay);
        }
      }
    }

    if (isDatabaseRequired()) {
      console.error(
        `❌ Authoritative database is required and unavailable [${this.lastFailureKind}]. API will stay live but not ready.`
      );
    } else if (isEmbeddedFallbackAllowed()) {
      console.warn(
        '⚠️ Database is unreachable. Development embedded JSON store is enabled. This mode is forbidden in production.'
      );
    } else {
      console.error('❌ Database is unreachable and the embedded store is disabled.');
    }

    this.startReconnectLoop();

    if (lastError) {
      throw lastError;
    }
  }

  private startReconnectLoop() {
    if (this.reconnectTimer || this.isMySqlConnected) return;
    const interval = parseInt(process.env.DB_RECONNECT_MS || '20000', 10);
    this.reconnectTimer = setInterval(() => {
      void this.attemptReconnect();
    }, interval);
    if (typeof this.reconnectTimer.unref === 'function') {
      this.reconnectTimer.unref();
    }
  }

  private async attemptReconnect() {
    if (this.isMySqlConnected) return;
    try {
      const conn = await pool.getConnection();
      await conn.query('SELECT 1');
      this.isMySqlConnected = true;
      this.lastFailureKind = null;
      this.lastFailureMessage = null;
      conn.release();
      console.log('✅ Reconnected to authoritative database instance (Supabase PostgreSQL).');
      if (this.reconnectTimer) {
        clearInterval(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      await this.initMySqlSchemaAndData();
    } catch (e: any) {
      const classified = classifyDatabaseError(e);
      this.lastFailureKind = classified.kind;
      this.lastFailureMessage = classified.message;
    }
  }

  private async initMySqlSchemaAndData() {
    if (!this.isMySqlConnected) return;
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        const cleanSchema = schema
          .split('\n')
          .filter((line) => !line.trim().startsWith('--'))
          .join('\n');
        const statements = cleanSchema
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        for (const statement of statements) {
          try {
            await pool.query(statement);
          } catch (err: any) {
            // Table/index may already exist
          }
        }
        console.log('✅ MySQL schema tables verified and ready.');
      }

      try {
        const [wishlistRows]: any = await pool.query('SELECT user_id, product_id FROM wishlists');
        this.wishlists.clear();
        for (const row of wishlistRows || []) {
          const list = this.wishlists.get(Number(row.user_id)) || [];
          list.push(String(row.product_id));
          this.wishlists.set(Number(row.user_id), list);
        }
      } catch {
        // Table is created from schema.sql; ignore until first successful migrate.
      }

      await pool.query(
        "INSERT INTO roles (name, description) VALUES ('buyer', 'Marketplace buyer'), ('seller', 'Farm seller'), ('admin', 'Platform administrator'), ('delivery', 'Delivery rider'), ('delivery_man', 'Delivery personnel who handle order deliveries') ON CONFLICT (name) DO UPDATE SET description=EXCLUDED.description"
      );

      // Check if users table is populated; if empty, safely seed from current in-memory store
      const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM users');
      const count = Number(rows[0]?.count || 0);
      if (count > 0) {
        await this.hydrateFromMySql();
        return;
      }

      const allowDemoSeed = !disableDemoAccounts;
      const seedUsers = this.data.users.length > 0 ? this.data.users : allowDemoSeed ? initialUsers : [];
      const seedCategories = this.data.categories.length > 0 ? this.data.categories : initialCategories;
      const seedProducts = this.data.products.length > 0 ? this.data.products : initialProducts;
      const seedCoupons = this.data.coupons.length > 0 ? this.data.coupons : initialCoupons;

      if (count === 0 && seedUsers.length > 0) {
        console.log('🔄 Seeding empty database catalog from canonical marketplace records...');
        for (const u of seedUsers) {
          await pool.query(
            'INSERT INTO users (id, email, password_hash, first_name, last_name, phone, is_verified, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email',
            [u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone || null, Boolean(u.is_verified), u.is_active !== false]
          );
          for (const roleName of u.roles || ['buyer']) {
            await pool.query(
              'INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE name = ? ON CONFLICT (user_id, role_id) DO NOTHING',
              [u.id, roleName]
            );
          }
        }
        for (const c of seedCategories) {
          await pool.query(
            'INSERT INTO categories (id, name, description, icon, image_url, is_active) VALUES (?, ?, ?, ?, ?, true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name',
            [c.id, c.name, c.description, c.icon, c.imageUrl]
          );
        }
        for (const p of seedProducts) {
          await pool.query(
            'INSERT INTO products (id, seller_user_id, seller_id, category, name, description, price, unit, stock, rating, reviews_count, image, location, is_organic, is_active, is_unlisted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET stock=EXCLUDED.stock',
            [p.id, p.sellerUserId, p.sellerId, p.category, p.name, p.description, p.price, p.unit, p.stock, p.rating, p.reviews, p.image, p.location, Boolean(p.organic), p.isActive !== false, Boolean(p.isUnlisted)]
          );
        }
        for (const c of seedCoupons) {
          await pool.query(
            'INSERT INTO coupons (code, discount, type, min_spend, description, is_active) VALUES (?, ?, ?, ?, ?, true) ON CONFLICT (code) DO UPDATE SET discount=EXCLUDED.discount',
            [c.code, c.discount, c.type, c.minSpend, c.description]
          );
        }
        for (const o of this.data.orders) {
          await pool.query(
            'INSERT INTO orders (id, receipt_no, user_id, buyer_name, buyer_phone, address, subtotal, shipping_fee, shipping_discount, coupon_code, points_earned, points_redeemed, total, status, payment, payment_ref, payment_status, driver_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status',
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
        console.log('✅ Safely migrated catalog, user, and order records into database.');
        await this.hydrateFromMySql();
      } else if (count === 0) {
        console.warn('⚠️ Database users table is empty. Not seeding demo accounts into production automatically.');
      }
    } catch (err: any) {
      console.warn('⚠️ Notice during database schema init / migration:', err.message);
    }
  }

  private async hydrateFromMySql() {
    try {
      const [userRows]: any = await pool.query(
        `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone, u.profile_image,
                u.is_verified, u.is_active, u.suspension_reason, u.created_at,
                STRING_AGG(r.name, ',') as roles
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id
         GROUP BY u.id`
      );
      const remoteUsers: UserEntity[] = (userRows || []).map((row: any) => ({
        id: Number(row.id),
        email: row.email,
        password_hash: row.password_hash,
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone || undefined,
        profile_image: row.profile_image || undefined,
        roles: normalizeRoles(row.roles),
        is_verified: Boolean(row.is_verified),
        is_active: Boolean(row.is_active),
        suspension_reason: row.suspension_reason || undefined,
        created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      }));

      // Preserve any local registered users that are not in PostgreSQL, backfilling them
      const remoteEmailSet = new Set(remoteUsers.map((u) => u.email.toLowerCase().trim()));
      const unmigratedLocalUsers = (this.data.users || []).filter((u) => !remoteEmailSet.has(u.email.toLowerCase().trim()));

      for (const localU of unmigratedLocalUsers) {
        try {
          const [ins]: any = await pool.query(
            'INSERT INTO users (email, password_hash, first_name, last_name, phone, is_verified, is_active) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash RETURNING id',
            [localU.email, localU.password_hash, localU.first_name, localU.last_name, localU.phone || null, localU.is_verified ? 1 : 0, localU.is_active ? 1 : 0]
          );
          const backfillId = ins[0]?.id || localU.id;
          localU.id = backfillId;
          for (const roleName of localU.roles || ['buyer']) {
            await pool.query(
              'INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE name = ? ON CONFLICT (user_id, role_id) DO NOTHING',
              [backfillId, roleName]
            );
          }
          remoteUsers.push(localU);
        } catch (err: any) {
          console.warn('Notice: could not sync unmigrated local user into PostgreSQL:', localU.email, err.message);
          remoteUsers.push(localU);
        }
      }

      this.data.users = remoteUsers;
      this.saveData();

      await pool.query("SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users))").catch(() => {});

      try {
        const [categoryRows]: any = await pool.query(
          'SELECT id, name, description, icon, image_url FROM categories WHERE is_active = true OR is_active IS NULL'
        );
        if (categoryRows?.length) {
          this.data.categories = categoryRows.map((row: any) => ({
            id: String(row.id),
            name: row.name,
            description: row.description || '',
            icon: row.icon || '',
            imageUrl: row.image_url || '',
          }));
        }
      } catch (err: any) {
        console.warn('Category hydrate skipped:', err.message);
      }

      try {
        const [productRows]: any = await pool.query(
          'SELECT * FROM products WHERE is_deleted IS NOT TRUE'
        );
        if (productRows?.length) {
          this.data.products = productRows.map((row: any) => ({
            id: String(row.id),
            name: row.name,
            category: row.category,
            price: Number(row.price),
            unit: row.unit,
            stock: Number(row.stock || 0),
            rating: Number(row.rating || 5),
            reviews: Number(row.reviews_count || 0),
            seller: row.seller_id,
            sellerId: row.seller_id,
            sellerUserId: Number(row.seller_user_id),
            location: row.location || '',
            image: row.image || '',
            photos: row.image ? [row.image] : [],
            description: row.description || '',
            organic: Boolean(row.is_organic),
            tradeable: false,
            lat: 0,
            lng: 0,
            created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
            isActive: row.is_active !== 0 && row.is_active !== false,
            is_active: row.is_active !== 0 && row.is_active !== false,
            isUnlisted: Boolean(row.is_unlisted),
            isDeleted: Boolean(row.is_deleted),
          }));
        }
      } catch (err: any) {
        console.warn('Product hydrate skipped:', err.message);
      }

      try {
        const [orderRows]: any = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        const [itemRows]: any = await pool.query('SELECT * FROM order_items');
        const itemsByOrder = new Map<string, any[]>();
        for (const item of itemRows || []) {
          const list = itemsByOrder.get(item.order_id) || [];
          list.push({
            productId: item.product_id,
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity),
            unit: item.unit || 'kg',
            image: item.image || '',
            seller: item.seller || '',
            sellerId: item.seller_id || '',
            sellerUserId: Number(item.seller_user_id),
            pickupLocation: item.pickup_location || '',
            prepStatus: item.prep_status || 'unpacked',
            prepNotes: item.prep_notes || undefined,
            sellerConfirmed: Boolean(item.seller_confirmed || item.prep_status === 'packed'),
            sellerConfirmedAt: item.seller_confirmed_at || (item.prep_status === 'packed' ? item.created_at : undefined),
          });
          itemsByOrder.set(item.order_id, list);
        }
        if (orderRows?.length) {
          this.data.orders = orderRows.map((row: any) => ({
            id: row.id,
            receiptNo: row.receipt_no,
            userId: Number(row.user_id),
            buyerName: row.buyer_name,
            buyerPhone: row.buyer_phone || undefined,
            items: itemsByOrder.get(row.id) || [],
            subtotal: Number(row.subtotal),
            shippingFee: Number(row.shipping_fee || 0),
            shippingDiscount: Number(row.shipping_discount || 0),
            couponCode: row.coupon_code || undefined,
            pointsEarned: Number(row.points_earned || 0),
            pointsRedeemed: Number(row.points_redeemed || 0),
            total: Number(row.total),
            status: row.status,
            payment: row.payment,
            paymentRef: row.payment_ref || undefined,
            paymentStatus: row.payment_status || 'pending',
            driverId: row.driver_id || undefined,
            address: row.address,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          }));
        }
      } catch (err: any) {
        console.warn('Order hydrate skipped:', err.message);
      }

      console.log(
        `✅ Hydrated in-memory cache from MySQL (${this.data.users.length} users, ${this.data.products.length} products, ${this.data.orders.length} orders).`
      );
    } catch (err: any) {
      console.warn('⚠️ MySQL hydrate failed:', err.message);
    }
  }

  public async executeMySql(query: string, params: any[] = []) {
    if (!this.isMySqlConnected) {
      if (isDatabaseRequired()) {
        throw databaseUnavailableError();
      }
      return;
    }
    try {
      await pool.query(query, params);
    } catch (err: any) {
      console.error(`MySQL persistence failure: ${err.message}`);
      if (isDatabaseRequired()) {
        throw databaseUnavailableError();
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
        if (disableDemoAccounts) {
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
        } else {
          for (const initUser of initialUsers) {
            if (!loadedUsers.some((u) => u.id === initUser.id || u.email.toLowerCase() === initUser.email.toLowerCase())) {
              loadedUsers.push(initUser);
            }
          }
        }

        return {
          users: loadedUsers,
          products: parsed.products || initialProducts,
          categories: loadedCategories,
          orders: parsed.orders || (disableDemoAccounts ? [] : initialOrders),
          cart: parsed.cart || [],
          seller_applications: parsed.seller_applications || [],
          reviews: parsed.reviews || initialReviews,
          posts: parsed.posts || [],
          trades: parsed.trades || [],
          notifications: parsed.notifications || (disableDemoAccounts ? [] : initialNotifications),
          messages: parsed.messages || [],
          delivery_jobs: parsed.delivery_jobs || (disableDemoAccounts ? [] : initialDeliveries),
          coupons: parsed.coupons || initialCoupons,
          audit_logs: parsed.audit_logs && parsed.audit_logs.length > 0 ? parsed.audit_logs : initialAuditLogs,
          processed_webhooks: parsed.processed_webhooks || [],
          listingReports: parsed.listingReports || parsed.listing_reports || [],
        };
      }
    } catch (err) {
      console.error('Error reading database file, using seeds:', err);
    }

    const defaultData: DatabaseSchema = {
      users: disableDemoAccounts ? [] : initialUsers,
      products: initialProducts,
      categories: initialCategories,
      orders: disableDemoAccounts ? [] : initialOrders,
      cart: [],
      seller_applications: [],
      reviews: initialReviews,
      posts: [],
      trades: [],
      notifications: disableDemoAccounts ? [] : initialNotifications,
      messages: [],
      delivery_jobs: disableDemoAccounts ? [] : initialDeliveries,
      coupons: initialCoupons,
      audit_logs: initialAuditLogs,
      processed_webhooks: [],
      listingReports: [],
    };

    this.saveData(defaultData);
    return defaultData;
  }

  public saveData(dataToSave?: DatabaseSchema) {
    if (!isEmbeddedFallbackAllowed()) {
      return;
    }
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
    const target = email.toLowerCase().trim();
    const SELLER_EMAIL_ALIASES: Record<string, string[]> = {
      'seller.vegetables@agrimarket.com': ['seller@agrimarket.com'],
      'seller@agrimarket.com': ['seller.vegetables@agrimarket.com'],
      'seller.fruits@agrimarket.com': ['seller.midsayap@agrimarket.com'],
      'seller.midsayap@agrimarket.com': ['seller.fruits@agrimarket.com'],
      'seller.rice@agrimarket.com': ['seller.tacurong@agrimarket.com'],
      'seller.tacurong@agrimarket.com': ['seller.rice@agrimarket.com'],
      'seller.grains@agrimarket.com': ['seller.koronadal@agrimarket.com'],
      'seller.koronadal@agrimarket.com': ['seller.grains@agrimarket.com'],
      'seller.fish@agrimarket.com': ['seller.lakesebu@agrimarket.com'],
      'seller.lakesebu@agrimarket.com': ['seller.fish@agrimarket.com'],
      'seller.supplies@agrimarket.com': ['seller.gensan@agrimarket.com'],
      'seller.gensan@agrimarket.com': ['seller.supplies@agrimarket.com'],
      'seller.livestock@agrimarket.com': ['seller.dairy@agrimarket.com'],
      'seller.dairy@agrimarket.com': ['seller.livestock@agrimarket.com'],
    };
    const candidates = [target, ...(SELLER_EMAIL_ALIASES[target] || [])];
    for (const cand of candidates) {
      const found = this.data.users.find((u) => u.email.toLowerCase() === cand);
      if (found) return found;
    }
    return undefined;
  }

  public addUser(user: Omit<UserEntity, 'id'> & { id?: number }) {
    const cleanEmail = user.email.toLowerCase().trim();
    const existingIdx = this.data.users.findIndex(
      (u) => (user.id && u.id === user.id) || u.email.toLowerCase().trim() === cleanEmail
    );
    const newId = user.id || (existingIdx !== -1 ? this.data.users[existingIdx].id : (this.data.users.length ? Math.max(...this.data.users.map((u) => u.id)) + 1 : 1));
    const newUser: UserEntity = { ...user, email: cleanEmail, roles: normalizeRoles(user.roles), id: newId };
    
    if (existingIdx !== -1) {
      this.data.users[existingIdx] = newUser;
    } else {
      this.data.users.push(newUser);
    }
    this.saveData();

    if (this.isMySqlConnected) {
      this.executeMySql(
        'INSERT INTO users (id, email, password_hash, first_name, last_name, phone, is_verified, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE email=VALUES(email), password_hash=VALUES(password_hash)',
        [newUser.id, newUser.email, newUser.password_hash, newUser.first_name, newUser.last_name, newUser.phone || null, newUser.is_verified ? 1 : 0, newUser.is_active ? 1 : 0]
      ).catch(() => {});

      for (const r of newUser.roles) {
        this.executeMySql(
          'INSERT IGNORE INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE name = ?',
          [newUser.id, r]
        ).catch(() => {});
      }

      this.executeMySql("SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users))").catch(() => {});
    }

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
    const normalized = normalizeRoles(roles);
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      user.roles = normalized;
      this.saveData();

      this.executeMySql('DELETE FROM user_roles WHERE user_id = ?', [userId])
        .then(async () => {
          for (const r of normalized) {
            await this.executeMySql(
              'INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE name = ? ON DUPLICATE KEY UPDATE user_id=user_id',
              [userId, r]
            );
          }
        })
        .catch((e) => console.warn('User roles MySQL sync notice:', e.message));

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
    const cleanId = String(id || '').trim();
    return this.data.products.find((p) => p.id === cleanId || p.id.toLowerCase() === cleanId.toLowerCase());
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
      const previous = this.data.products[idx];
      if (updates.stock !== undefined && Number(updates.stock) !== previous.stock) {
        this.recordInventoryMovement({
          productId: id,
          quantityDelta: Number(updates.stock) - previous.stock,
          reason: 'seller_adjust',
        });
      }
      this.data.products[idx] = { ...previous, ...updates };
      this.saveData();

      this.executeMySql(
        'UPDATE products SET name = COALESCE(?, name), description = COALESCE(?, description), category = COALESCE(?, category), price = COALESCE(?, price), stock = COALESCE(?, stock), unit = COALESCE(?, unit), image = COALESCE(?, image), location = COALESCE(?, location), rating = COALESCE(?, rating), reviews_count = COALESCE(?, reviews_count), is_active = COALESCE(?, is_active), is_unlisted = COALESCE(?, is_unlisted) WHERE id = ?',
        [
          updates.name || null,
          updates.description || null,
          updates.category || null,
          updates.price !== undefined ? updates.price : null,
          updates.stock !== undefined ? updates.stock : null,
          updates.unit || null,
          updates.image || null,
          updates.location || null,
          updates.rating !== undefined ? updates.rating : null,
          updates.reviews !== undefined ? updates.reviews : null,
          updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : null,
          updates.isUnlisted !== undefined ? (updates.isUnlisted ? 1 : 0) : null,
          id,
        ]
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
  public hydrateOrderStatusHistory(order: OrderEntity): OrderEntity {
    if (order.statusHistory && order.statusHistory.length > 0) {
      return order;
    }
    const history: OrderStatusAudit[] = [];
    history.push({
      status: 'Pending',
      changedBy: order.userId,
      changedByName: order.buyerName || 'Buyer',
      changedByRole: 'buyer',
      timestamp: order.createdAt || new Date().toISOString(),
      note: 'Order placed by buyer',
    });

    if (order.sellerConfirmedAt) {
      history.push({
        status: 'Confirmed',
        changedByName: 'Farmer Juan (Seller)',
        changedByRole: 'seller',
        timestamp: order.sellerConfirmedAt,
        note: 'Harvest confirmed by farm stall',
      });
    }

    if (order.prepStatus === 'packing' || order.status === 'Preparing') {
      history.push({
        status: 'Preparing',
        changedByName: 'Farmer Juan (Seller)',
        changedByRole: 'seller',
        timestamp: order.packedAt || order.sellerConfirmedAt || order.createdAt,
        note: order.packingNotes || 'Harvest crates being gathered and packed',
      });
    }

    if (order.prepStatus === 'packed' || order.status === 'Ready for Pickup') {
      history.push({
        status: 'Ready for Pickup',
        changedByName: 'Farmer Juan (Seller)',
        changedByRole: 'seller',
        timestamp: order.packedAt || order.sellerConfirmedAt || order.createdAt,
        note: 'Crates packed and staged for regional dispatch',
      });
    }

    if (order.shippedAt) {
      history.push({
        status: 'Shipped',
        changedBy: order.driverId,
        changedByName: 'Courier Dispatched',
        changedByRole: 'delivery',
        timestamp: order.shippedAt,
        note: 'Rider picked up harvest from farm',
      });
    }

    if (order.status === 'Out for delivery') {
      history.push({
        status: 'Out for delivery',
        changedBy: order.driverId,
        changedByName: 'Delivery Courier',
        changedByRole: 'delivery',
        timestamp: order.shippedAt || order.createdAt,
        note: 'Out for direct delivery across SOCCSKSARGEN',
      });
    }

    if (order.status === 'Delivered') {
      history.push({
        status: 'Delivered',
        changedBy: order.driverId,
        changedByName: 'Delivery Courier',
        changedByRole: 'delivery',
        timestamp: (order as any).deliveredAt || order.shippedAt || order.createdAt,
        note: 'Harvest safely received by customer',
      });
    }

    if (order.status === 'Cancelled') {
      history.push({
        status: 'Cancelled',
        changedByName: 'Platform',
        changedByRole: 'system',
        timestamp: new Date().toISOString(),
        note: order.rejectedReason || 'Order was cancelled',
      });
    }

    return {
      ...order,
      statusHistory: history,
    };
  }

  public getOrders() {
    return this.data.orders.map((o) => this.hydrateOrderStatusHistory(o));
  }

  public getOrderById(id: string) {
    const o = this.data.orders.find((o) => o.id === id || o.receiptNo === id);
    return o ? this.hydrateOrderStatusHistory(o) : undefined;
  }

  public getOrdersByUserId(userId: number) {
    return this.data.orders.filter((o) => o.userId === userId).map((o) => this.hydrateOrderStatusHistory(o));
  }

  public getOrdersBySellerId(sellerId: string, sellerUserId?: number) {
    const legacyMap: Record<string, number> = {
      'seller-1': 2,
      'seller-2': 13,
      'seller-3': 15,
      'seller-4': 12,
      'seller-5': 17,
      'seller-6': 14,
      'seller-7': 16,
      'seller-8': 18,
    };
    const effectiveUserId = sellerUserId || legacyMap[sellerId];

    return this.data.orders
      .filter((o) =>
        o.items.some(
          (item) =>
            item.sellerId === sellerId ||
            (effectiveUserId && item.sellerUserId === effectiveUserId) ||
            (effectiveUserId && item.sellerId === `seller-${effectiveUserId}`) ||
            (effectiveUserId && item.sellerId === `user-${effectiveUserId}`) ||
            (sellerId === 'seller-1' && (item.sellerUserId === 2 || item.sellerId === 'seller-2'))
        )
      )
      .map((o) => this.hydrateOrderStatusHistory(o));
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
      this.recordInventoryMovement({
        productId: item.productId,
        quantityDelta: -item.quantity,
        reason: 'order_deduct',
      });
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
        this.recordInventoryMovement({
          productId: item.productId,
          quantityDelta: item.quantity,
          reason: 'order_restore',
          orderId,
        });
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
    notes?: string,
    actorUserId?: number
  ): OrderEntity | null {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return null;

    const targetItem = order.items.find((item) => item.productId === productId);
    if (!targetItem) return null;

    if (actorUserId) {
      const user = this.getUserById(actorUserId);
      const isAdmin = user?.roles?.includes('admin');
      const isItemOwner =
        targetItem.sellerUserId === actorUserId ||
        targetItem.sellerId === `seller-${actorUserId}` ||
        targetItem.sellerId === `user-${actorUserId}` ||
        (user?.email === 'seller@agrimarket.com' && (targetItem.sellerId === 'seller-1' || targetItem.sellerUserId === 2));

      if (!isAdmin && !isItemOwner) {
        throw new Error(`Unauthorized: You are not the seller of product "${targetItem.name}" and cannot update its packaging or confirmation.`);
      }
    }

    const now = new Date().toISOString();
    const isPacked = prepStatus === 'packed';

    order.items = order.items.map((item) => {
      if (item.productId === productId) {
        return {
          ...item,
          prepStatus,
          prepNotes: notes !== undefined ? notes : item.prepNotes,
          packedAt: isPacked ? now : item.packedAt,
          sellerConfirmed: isPacked ? true : item.sellerConfirmed,
          sellerConfirmedAt: isPacked ? (item.sellerConfirmedAt || now) : item.sellerConfirmedAt,
        };
      }
      return item;
    });

    const allPacked = order.items.every((it) => it.prepStatus === 'packed');
    const allConfirmed = order.items.every((it) => it.sellerConfirmed || it.prepStatus === 'packed');
    const anyPacking = order.items.some((it) => it.prepStatus === 'packing' || it.prepStatus === 'packed');
    order.prepStatus = allPacked ? 'packed' : anyPacking ? 'packing' : 'unpacked';

    if (allPacked && allConfirmed) {
      order.packedAt = now;
      if (order.status === 'Pending') {
        order.status = 'Confirmed';
        order.sellerConfirmedAt = now;
      }
    }

    this.saveData();
    return order;
  }

  public packSellerItems(orderId: string, sellerUserId: number, packingNotes?: string): OrderEntity | null {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return null;

    const user = this.getUserById(sellerUserId);
    const isAdmin = user?.roles?.includes('admin');
    const now = new Date().toISOString();

    let packedCount = 0;
    order.items = order.items.map((item) => {
      const isMyItem =
        isAdmin ||
        item.sellerUserId === sellerUserId ||
        item.sellerId === `seller-${sellerUserId}` ||
        item.sellerId === `user-${sellerUserId}` ||
        (user?.email === 'seller@agrimarket.com' && (item.sellerId === 'seller-1' || item.sellerUserId === 2));

      if (isMyItem) {
        packedCount++;
        return {
          ...item,
          prepStatus: 'packed' as const,
          packedAt: now,
          sellerConfirmed: true,
          sellerConfirmedAt: item.sellerConfirmedAt || now,
          prepNotes: packingNotes !== undefined ? packingNotes : item.prepNotes,
        };
      }
      return item;
    });

    if (packedCount === 0 && !isAdmin) {
      throw new Error('Unauthorized: You have no products in this order to pack.');
    }

    const allPacked = order.items.every((it) => it.prepStatus === 'packed');
    const allConfirmed = order.items.every((it) => it.sellerConfirmed || it.prepStatus === 'packed');
    const anyPacking = order.items.some((it) => it.prepStatus === 'packing' || it.prepStatus === 'packed');
    order.prepStatus = allPacked ? 'packed' : anyPacking ? 'packing' : 'unpacked';

    if (allPacked && allConfirmed) {
      order.packedAt = now;
      if (order.status === 'Pending') {
        order.status = 'Confirmed';
        order.sellerConfirmedAt = now;
      }
    }
    if (packingNotes !== undefined) order.packingNotes = packingNotes;

    this.saveData();
    return order;
  }

  public confirmSellerItems(
    orderId: string,
    sellerUserId: number,
    productId?: string
  ): { order: OrderEntity; confirmedCount: number; pendingCount: number } | null {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return null;

    const user = this.getUserById(sellerUserId);
    const isAdmin = user?.roles?.includes('admin');
    const now = new Date().toISOString();

    let confirmedCount = 0;
    order.items = order.items.map((item) => {
      const isMyItem =
        isAdmin ||
        item.sellerUserId === sellerUserId ||
        item.sellerId === `seller-${sellerUserId}` ||
        item.sellerId === `user-${sellerUserId}` ||
        (user?.email === 'seller@agrimarket.com' && (item.sellerId === 'seller-1' || item.sellerUserId === 2));

      if (productId ? item.productId === productId : isMyItem) {
        if (!isAdmin && !isMyItem) {
          throw new Error(`Unauthorized: You are not the seller of product "${item.name}" and cannot confirm it.`);
        }
        confirmedCount++;
        return {
          ...item,
          sellerConfirmed: true,
          sellerConfirmedAt: item.sellerConfirmedAt || now,
          prepStatus: 'packed' as const,
          packedAt: item.packedAt || now,
        };
      }
      return item;
    });

    if (confirmedCount === 0) {
      throw new Error('No products matching your seller profile found in this order to confirm.');
    }

    const pendingItems = order.items.filter((it) => !it.sellerConfirmed && it.prepStatus !== 'packed');
    const allPacked = order.items.every((it) => it.prepStatus === 'packed');
    const anyPacking = order.items.some((it) => it.prepStatus === 'packing' || it.prepStatus === 'packed');
    order.prepStatus = allPacked ? 'packed' : anyPacking ? 'packing' : 'unpacked';

    if (pendingItems.length === 0) {
      order.status = 'Confirmed';
      order.sellerConfirmedAt = now;
      order.packedAt = order.packedAt || now;
    }

    const sellerName = user ? `${user.first_name} ${user.last_name}`.trim() : 'Seller';
    const auditEntry: OrderStatusAudit = {
      status: order.status,
      changedBy: sellerUserId,
      changedByName: sellerName,
      changedByRole: user?.roles?.[0] || 'seller',
      timestamp: now,
      note:
        pendingItems.length === 0
          ? 'All products confirmed across all sellers. Order is confirmed for courier collection.'
          : `${sellerName} confirmed their produce (${confirmedCount} product(s)). Waiting for ${pendingItems.length} other product(s) from other sellers.`,
    };
    order.statusHistory = [...(order.statusHistory || []), auditEntry];

    this.saveData();
    return { order, confirmedCount, pendingCount: pendingItems.length };
  }

  public packOrder(orderId: string, packingNotes?: string, actorUserId?: number): OrderEntity | null {
    if (actorUserId) {
      const user = this.getUserById(actorUserId);
      if (user && !user.roles.includes('admin')) {
        return this.packSellerItems(orderId, actorUserId, packingNotes);
      }
    }
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return null;

    const now = new Date().toISOString();
    order.items = order.items.map((item) => ({
      ...item,
      prepStatus: 'packed' as const,
      packedAt: now,
      sellerConfirmed: true,
      sellerConfirmedAt: item.sellerConfirmedAt || now,
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

    if (!order.statusHistory || order.statusHistory.length === 0) {
      order.statusHistory = [
        {
          status: order.status,
          changedBy: order.userId,
          changedByName: order.buyerName || 'Buyer',
          changedByRole: 'buyer',
          timestamp: order.createdAt || new Date().toISOString(),
          note: 'Order placed by buyer',
        },
      ];
    }

    if (this.isMySqlConnected) {
      this.executeOrderTransaction(order).catch((err) => {
        console.error('MySQL Order Transaction Error:', err.message);
        if (isDatabaseRequired()) {
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
      if (isDatabaseRequired()) {
        throw new Error('Database persistence failed: Authoritative MySQL is not connected.');
      }
    }

    return order;
  }

  public updateOrderStatus(id: string, status: OrderEntity['status'], extra?: Partial<OrderEntity>, actorUserId?: number) {
    const idx = this.data.orders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      const previous = this.data.orders[idx].status;
      // If cancelled, restore stock once safely
      if (status === 'Cancelled') {
        this.restoreOrderStock(id);
      }

      const actorUser = actorUserId ? this.getUserById(actorUserId) : undefined;
      const actorRole = actorUser?.roles?.[0] || 'system';
      const actorName = actorUser ? `${actorUser.first_name} ${actorUser.last_name}`.trim() : 'Platform';

      const auditEntry: OrderStatusAudit = {
        status,
        changedBy: actorUserId,
        changedByName: actorName,
        changedByRole: actorRole,
        timestamp: new Date().toISOString(),
        note: extra?.rejectedReason || extra?.packingNotes || undefined,
      };

      const existingHistory = this.data.orders[idx].statusHistory || [];
      const now = new Date().toISOString();

      let orderItems = this.data.orders[idx].items;
      const actorIsAdmin = actorUser?.roles?.includes('admin');
      if (status === 'Confirmed' && orderItems) {
        orderItems = orderItems.map((item) => {
          const isMyItem =
            actorIsAdmin ||
            !actorUserId ||
            item.sellerUserId === actorUserId ||
            item.sellerId === `seller-${actorUserId}` ||
            item.sellerId === `user-${actorUserId}` ||
            (actorUser?.email === 'seller@agrimarket.com' && (item.sellerId === 'seller-1' || item.sellerUserId === 2));

          if (isMyItem) {
            return {
              ...item,
              sellerConfirmed: true,
              sellerConfirmedAt: item.sellerConfirmedAt || now,
              prepStatus: item.prepStatus === 'unpacked' || !item.prepStatus ? 'packed' : item.prepStatus,
              packedAt: item.packedAt || now,
            };
          }
          return item;
        });
      }

      const allItemsConfirmed = (orderItems || []).every((it) => it.sellerConfirmed || it.prepStatus === 'packed');
      const allItemsPacked = (orderItems || []).every((it) => it.prepStatus === 'packed');
      const nextStatus = (status === 'Confirmed' && !allItemsConfirmed) ? 'Pending' : status;

      this.data.orders[idx] = {
        ...this.data.orders[idx],
        items: orderItems,
        status: nextStatus,
        sellerConfirmedAt: allItemsConfirmed ? (this.data.orders[idx].sellerConfirmedAt || now) : this.data.orders[idx].sellerConfirmedAt,
        prepStatus: allItemsPacked ? 'packed' : (orderItems || []).some(it => it.prepStatus === 'packing' || it.prepStatus === 'packed') ? 'packing' : 'unpacked',
        packedAt: allItemsPacked && !this.data.orders[idx].packedAt ? now : this.data.orders[idx].packedAt,
        ...extra,
        statusHistory: [...existingHistory, auditEntry],
      };
      this.recordOrderStatusEvent(id, previous, status, actorUserId, extra?.rejectedReason);

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

  public findReviewByUserAndProduct(userId: number, productId: string) {
    return this.data.reviews.find(
      (r) => r.userId === userId && r.productId === productId && r.status !== 'hidden'
    );
  }

  public addReview(review: ReviewEntity) {
    const duplicate = this.findReviewByUserAndProduct(review.userId, review.productId);
    if (duplicate) {
      const err: Error & { statusCode?: number; code?: string } = new Error(
        'You have already reviewed this product.'
      );
      err.statusCode = 409;
      err.code = 'DUPLICATE_REVIEW';
      throw err;
    }
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

  public updateTradeStatus(
    id: string,
    status: 'Accepted' | 'Declined' | 'Countered',
    counterDetails?: { counterQuantity?: number; counterCashOffset?: number; counterNote?: string; counterBy?: string; counterAt?: string }
  ) {
    const trade = this.data.trades.find((t) => t.id === id);
    if (trade) {
      trade.status = status;
      if (counterDetails) {
        trade.counterOffer = counterDetails;
      }
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

  public addDelivery(delivery: DeliveryJobEntity) {
    const existingIdx = this.data.delivery_jobs.findIndex((d) => d.id === delivery.id || d.orderId === delivery.orderId);
    if (existingIdx !== -1) {
      this.data.delivery_jobs[existingIdx] = { ...this.data.delivery_jobs[existingIdx], ...delivery, updatedAt: new Date().toISOString() };
      return this.data.delivery_jobs[existingIdx];
    }
    this.data.delivery_jobs.unshift(delivery);
    this.saveData();
    this.executeMySql(
      'INSERT INTO delivery_jobs (id, order_id, driver_id, buyer_name, buyer_phone, address, status, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=VALUES(status), lat=VALUES(lat), lng=VALUES(lng), driver_id=VALUES(driver_id)',
      [
        delivery.id,
        delivery.orderId,
        delivery.driverId,
        delivery.buyerName,
        delivery.buyerPhone || null,
        delivery.address,
        delivery.status,
        delivery.lat !== undefined ? delivery.lat : null,
        delivery.lng !== undefined ? delivery.lng : null,
      ]
    ).catch((e) => console.warn('Delivery job MySQL sync notice:', e.message));
    return delivery;
  }

  public updateDelivery(id: string, updates: Partial<DeliveryJobEntity>) {
    let job = this.data.delivery_jobs.find((d) => d.id === id || d.orderId === id);
    if (!job && updates.orderId) {
      job = {
        id: updates.id || id,
        orderId: updates.orderId,
        driverId: updates.driverId || 4,
        buyerName: updates.buyerName || '',
        buyerPhone: updates.buyerPhone,
        address: updates.address || '',
        status: updates.status || 'Pending',
        lat: updates.lat,
        lng: updates.lng,
        updatedAt: new Date().toISOString(),
      };
      this.data.delivery_jobs.unshift(job);
    }
    if (job) {
      Object.assign(job, updates, { updatedAt: new Date().toISOString() });
      if (updates.status) {
        const order = this.data.orders.find((o) => o.id === job!.orderId);
        if (order) {
          order.status = updates.status as OrderEntity['status'];
        }
      }
      this.saveData();

      this.executeMySql(
        'INSERT INTO delivery_jobs (id, order_id, driver_id, buyer_name, buyer_phone, address, status, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=VALUES(status), lat=VALUES(lat), lng=VALUES(lng), driver_id=VALUES(driver_id)',
        [
          job.id,
          job.orderId,
          job.driverId,
          job.buyerName,
          job.buyerPhone || null,
          job.address,
          job.status,
          job.lat !== undefined ? job.lat : null,
          job.lng !== undefined ? job.lng : null,
        ]
      ).catch((e) => console.warn('Delivery job MySQL sync notice:', e.message));

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

  public getWishlist(userId: number): string[] {
    return [...(this.wishlists.get(userId) || [])];
  }

  public addToWishlist(userId: number, productId: string): string[] {
    const current = this.wishlists.get(userId) || [];
    if (!current.includes(productId)) {
      this.wishlists.set(userId, [...current, productId]);
      this.executeMySql('INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)', [userId, productId]);
    }
    return this.getWishlist(userId);
  }

  public removeFromWishlist(userId: number, productId: string): string[] {
    const current = this.wishlists.get(userId) || [];
    this.wishlists.set(
      userId,
      current.filter((id) => id !== productId)
    );
    this.executeMySql('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [userId, productId]);
    return this.getWishlist(userId);
  }

  public recordInventoryMovement(entry: {
    productId: string;
    userId?: number;
    quantityDelta: number;
    reason: string;
    orderId?: string;
  }) {
    const movement = {
      id: `inv-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...entry,
    };
    this.inventoryMovements.unshift(movement);
    this.inventoryMovements = this.inventoryMovements.slice(0, 2000);
    this.executeMySql(
      'INSERT INTO inventory_movements (id, product_id, user_id, quantity_delta, reason, order_id) VALUES (?, ?, ?, ?, ?, ?)',
      [movement.id, movement.productId, movement.userId || null, movement.quantityDelta, movement.reason, movement.orderId || null]
    );
    return movement;
  }

  public getInventoryMovements(productId: string) {
    return this.inventoryMovements.filter((m) => m.productId === productId).slice(0, 50);
  }

  public recordOrderStatusEvent(
    orderId: string,
    fromStatus: string | undefined,
    toStatus: string,
    actorUserId?: number,
    note?: string
  ) {
    const event = {
      id: `ose-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      orderId,
      fromStatus,
      toStatus,
      actorUserId,
      note,
      createdAt: new Date().toISOString(),
    };
    this.orderStatusEvents.unshift(event);
    this.orderStatusEvents = this.orderStatusEvents.slice(0, 2000);
    this.executeMySql(
      'INSERT INTO order_status_events (id, order_id, from_status, to_status, actor_user_id, note) VALUES (?, ?, ?, ?, ?, ?)',
      [event.id, orderId, fromStatus || null, toStatus, actorUserId || null, note || null]
    );
    return event;
  }

  public getOrderStatusEvents(orderId: string) {
    return this.orderStatusEvents.filter((e) => e.orderId === orderId);
  }

  // --- Listing Reports & Moderation ---
  public getListingReports(statusFilter?: string) {
    let reports = this.data.listingReports || [];
    if (statusFilter && statusFilter !== 'all') {
      reports = reports.filter((r) => r.status === statusFilter);
    }
    return reports;
  }

  public addListingReport(report: ListingReportEntity) {
    if (!this.data.listingReports) {
      this.data.listingReports = [];
    }
    this.data.listingReports.unshift(report);
    this.saveData();
    return report;
  }

  public resolveListingReport(id: string, action: string, resolvedBy: string, notes?: string) {
    if (!this.data.listingReports) return null;
    const idx = this.data.listingReports.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    const report = this.data.listingReports[idx];
    report.status = action === 'dismiss' ? 'dismissed' : 'resolved';
    report.resolutionAction = action;
    report.resolvedAt = new Date().toISOString();
    report.resolvedBy = resolvedBy;
    if (notes) {
      report.details = report.details ? `${report.details} | Moderator Note: ${notes}` : `Moderator Note: ${notes}`;
    }

    if (action === 'flag_listing') {
      this.moderateProduct(report.productId, 'flag', `Report resolved: ${report.reason}`);
    } else if (action === 'delist_product') {
      this.moderateProduct(report.productId, 'delist', `Report resolved: ${report.reason}`);
    }

    this.saveData();
    return report;
  }
}

export const db = new DatabaseStore();
