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
}

export interface OrderItemEntity {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  seller: string;
  sellerId: string;
  sellerUserId: number;
  pickupLocation: string;
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
  status: 'Pending' | 'Approved' | 'Rejected';
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
}

export interface CategoryEntity {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageUrl: string;
}

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'agrimarket_db.json');

// Initial seed accounts with pre-hashed passwords ('admin123', 'seller123', 'buyer123', 'driver123')
const defaultPasswordHash = bcrypt.hashSync('buyer123', 8);
const adminPasswordHash = bcrypt.hashSync('admin123', 8);
const sellerPasswordHash = bcrypt.hashSync('seller123', 8);
const driverPasswordHash = bcrypt.hashSync('driver123', 8);

const initialUsers: UserEntity[] = [
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
  { id: 'cat-veg', name: 'Vegetables', description: 'Fresh local crops and greens', icon: 'Leaf', imageUrl: '/images/kangkong.jpg' },
  { id: 'cat-fruits', name: 'Fruits', description: 'Tree-ripened tropical harvests', icon: 'Apple', imageUrl: '/images/mango.jpg' },
  { id: 'cat-grains', name: 'Rice & Grains', description: 'Mindanao milled rice and corn', icon: 'Wheat', imageUrl: '/images/rice.jpg' },
  { id: 'cat-poultry', name: 'Livestock & Poultry', description: 'Eggs, pasture meats & poultry', icon: 'Egg', imageUrl: '/images/eggs.jpg' },
  { id: 'cat-fish', name: 'Fisheries & Aquaculture', description: 'Lake Sebu and Gensan fresh catch', icon: 'Fish', imageUrl: '/images/tilapia.jpg' },
  { id: 'cat-inputs', name: 'Agricultural Supplies', description: 'Organic fertilizers, seeds and tools', icon: 'Sprout', imageUrl: '/images/compost.jpg' },
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
    try {
      const conn = await pool.getConnection();
      this.isMySqlConnected = true;
      conn.release();
      console.log('✅ Connected to external MySQL database instance.');
    } catch (e) {
      this.isMySqlConnected = false;
      console.log('ℹ️ Running on resilient high-performance local embedded data store.');
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
        return {
          users: parsed.users || initialUsers,
          products: parsed.products || initialProducts,
          categories: parsed.categories || initialCategories,
          orders: parsed.orders || initialOrders,
          cart: parsed.cart || [],
          seller_applications: parsed.seller_applications || [],
          reviews: parsed.reviews || initialReviews,
          posts: parsed.posts || [],
          trades: parsed.trades || [],
          notifications: parsed.notifications || initialNotifications,
          messages: parsed.messages || [],
          delivery_jobs: parsed.delivery_jobs || initialDeliveries,
          coupons: parsed.coupons || initialCoupons,
        };
      }
    } catch (err) {
      console.error('Error reading database file, using seeds:', err);
    }

    const defaultData: DatabaseSchema = {
      users: initialUsers,
      products: initialProducts,
      categories: initialCategories,
      orders: initialOrders,
      cart: [],
      seller_applications: [],
      reviews: initialReviews,
      posts: [],
      trades: [],
      notifications: initialNotifications,
      messages: [],
      delivery_jobs: initialDeliveries,
      coupons: initialCoupons,
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
      fs.writeFileSync(DB_FILE, JSON.stringify(toWrite, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database store:', err);
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
    return newUser;
  }

  public updateUser(id: number, updates: Partial<UserEntity>) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.saveData();
      return this.data.users[idx];
    }
    return null;
  }

  // --- Products ---
  public getProducts(includeInactive: boolean = false) {
    if (includeInactive) {
      return this.data.products;
    }
    return this.data.products.filter(
      (p) => p.isActive !== false && p.is_active !== false && !p.isUnlisted
    );
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
    return product;
  }

  public updateProduct(id: string, updates: Partial<ProductEntity>) {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.data.products[idx] = { ...this.data.products[idx], ...updates };
      this.saveData();
      return this.data.products[idx];
    }
    return null;
  }

  public deleteProduct(id: string) {
    const prevLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.products.length !== prevLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // --- Categories ---
  public getCategories() {
    return this.data.categories;
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
      o.items.some((item) => item.sellerId === sellerId || (sellerUserId && item.sellerUserId === sellerUserId))
    );
  }

  public addOrder(order: OrderEntity) {
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
    return order;
  }

  public updateOrderStatus(id: string, status: OrderEntity['status'], extra?: Partial<OrderEntity>) {
    const idx = this.data.orders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      this.data.orders[idx] = {
        ...this.data.orders[idx],
        status,
        ...extra,
      };

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

  public updateSellerApplicationStatus(id: string, status: 'Approved' | 'Rejected') {
    const app = this.data.seller_applications.find((a) => a.id === id);
    if (app) {
      app.status = status;
      app.reviewedAt = new Date().toISOString();
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
    return this.data.reviews.filter((r) => r.productId === productId);
  }

  public addReview(review: ReviewEntity) {
    this.data.reviews.unshift(review);

    // Update product rating and reviews count
    const productReviews = this.data.reviews.filter((r) => r.productId === review.productId);
    const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    this.updateProduct(review.productId, {
      rating: parseFloat(avg.toFixed(1)),
      reviews: productReviews.length,
    });

    this.saveData();
    return review;
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

  // --- Coupons ---
  public getCoupons() {
    return this.data.coupons.filter((c) => c.isActive);
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
}

export const db = new DatabaseStore();
