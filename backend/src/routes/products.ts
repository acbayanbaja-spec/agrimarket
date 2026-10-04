import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

export type ProductItem = {
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
};

// Seed products representing certified SOCCSKSARGEN harvests
const initialProducts: ProductItem[] = [
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
    description: 'Aromatic whole-grain Dinorado rice from the plains of M’lang. Soft, fluffy texture when cooked.',
    organic: false,
    tradeable: true,
    lat: 6.9467,
    lng: 124.8803,
  },
];

const STORAGE_FILE = path.join(__dirname, '../../uploads/products_cache.json');

// Load stored custom products from file cache if available
let productDatabase: ProductItem[] = [...initialProducts];

try {
  if (fs.existsSync(STORAGE_FILE)) {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
    const saved = JSON.parse(raw);
    if (Array.isArray(saved) && saved.length > 0) {
      productDatabase = saved;
    }
  }
} catch (e) {
  // Use memory fallback
}

const persistProducts = () => {
  try {
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(productDatabase, null, 2), 'utf-8');
  } catch (err) {
    // Ignore fs errors in container environments
  }
};

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', (req: Request, res: Response) => {
  const { category, search, sellerId, minPrice, maxPrice } = req.query;

  let results = [...productDatabase];

  if (category && category !== 'All') {
    results = results.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.seller.toLowerCase().includes(q)
    );
  }

  if (sellerId) {
    results = results.filter((p) => p.sellerId === String(sellerId) || String(p.sellerUserId) === String(sellerId));
  }

  if (minPrice) {
    results = results.filter((p) => p.price >= Number(minPrice));
  }

  if (maxPrice) {
    results = results.filter((p) => p.price <= Number(maxPrice));
  }

  res.json({
    success: true,
    message: 'Products retrieved successfully',
    data: {
      products: results,
      total: results.length,
    },
  });
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', (req: Request, res: Response) => {
  const product = productDatabase.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      data: null,
    });
  }

  res.json({
    success: true,
    message: 'Product retrieved successfully',
    data: { product },
  });
});

// @route   POST /api/products
// @desc    Create new product (Saves to backend store and syncs across all devices)
// @access  Public / Authenticated
router.post('/', (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.name || !body.price) {
      return res.status(400).json({
        success: false,
        message: 'Product name and price are required',
        data: null,
      });
    }

    const newProduct: ProductItem = {
      id: body.id || `prod-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      name: body.name.trim(),
      category: body.category || 'Vegetables',
      price: Number(body.price),
      unit: body.unit || 'kg',
      stock: Number(body.stock ?? 20),
      rating: Number(body.rating ?? 5.0),
      reviews: Number(body.reviews ?? 0),
      seller: body.seller || 'SOCCSKSARGEN Farm Partner',
      sellerId: body.sellerId || `seller-${Date.now()}`,
      sellerUserId: Number(body.sellerUserId ?? 0),
      location: body.location || 'Koronadal City, South Cotabato',
      image: body.image || '/images/farm.jpg',
      photos: Array.isArray(body.photos) && body.photos.length ? body.photos : [body.image || '/images/farm.jpg'],
      description: body.description || '',
      organic: Boolean(body.organic),
      tradeable: body.tradeable ?? true,
      lat: Number(body.lat || 6.5004),
      lng: Number(body.lng || 124.8436),
      priceHistory: body.priceHistory || [{ date: new Date().toISOString().slice(0, 10), price: Number(body.price) }],
    };

    // Prepend new product so it appears at top of marketplace
    productDatabase = [newProduct, ...productDatabase.filter((p) => p.id !== newProduct.id)];
    persistProducts();

    res.status(201).json({
      success: true,
      message: 'Product created and listed successfully across SOCCSKSARGEN',
      data: { product: newProduct },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create product listing',
      data: null,
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product stock or details
// @access  Public / Authenticated
router.put('/:id', (req: Request, res: Response) => {
  const index = productDatabase.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      data: null,
    });
  }

  productDatabase[index] = {
    ...productDatabase[index],
    ...req.body,
  };
  persistProducts();

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product: productDatabase[index] },
  });
});

// @route   DELETE /api/products/:id
// @desc    Delete or unlist product
// @access  Public / Authenticated
router.delete('/:id', (req: Request, res: Response) => {
  productDatabase = productDatabase.filter((p) => p.id !== req.params.id);
  persistProducts();

  res.json({
    success: true,
    message: 'Product unlisted successfully',
    data: null,
  });
});

export default router;
