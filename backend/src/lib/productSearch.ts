export const AGRICULTURAL_UNITS = [
  'kg',
  'kilo',
  'kilos',
  'kilogram',
  'kilograms',
  'g',
  'gram',
  'grams',
  'sack',
  'sacks',
  'bundle',
  'bundles',
  'piece',
  'pieces',
  'pc',
  'pcs',
  'tray',
  'trays',
  'crate',
  'crates',
  'liter',
  'liters',
  'l',
  'bunch',
  'bunches',
  'pack',
  'packs',
  'box',
  'boxes',
  'bag',
  'bags',
  'kaing',
  'basket',
  'baskets',
  'dozen',
  'dozens',
  'head',
  'heads',
  'punnet',
  'tali',
  'tiklis',
  'tin',
  'can',
  'pot',
  'net',
];

export type ProductSearchable = {
  id: string;
  name: string;
  category: string;
  description?: string;
  location?: string;
  seller?: string;
  sellerId?: string;
  sellerUserId?: number;
  price: number;
  stock: number;
  organic?: boolean;
  rating?: number;
  reviews?: number;
  created_at?: string;
};

export type ProductSearchQuery = {
  category?: string;
  search?: string;
  sellerId?: string;
  seller?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  organic?: boolean;
  stock?: 'all' | 'in' | 'low' | 'out';
  sort?: string;
  page?: number;
  pageSize?: number;
  maxPageSize?: number;
};

function relevanceScore(product: ProductSearchable, query: string): number {
  if (!query) return (product.rating || 0) * 10 + (product.reviews || 0);
  const q = query.toLowerCase();
  const name = product.name.toLowerCase();
  const category = product.category.toLowerCase();
  const seller = (product.seller || '').toLowerCase();
  const location = (product.location || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  if (name === q) return 1000;
  if (name.split(/\s+/).includes(q)) return 900;
  if (name.startsWith(q)) return 800;
  if (name.includes(q)) return 600;
  if (category.includes(q)) return 420;
  if (seller.includes(q)) return 320;
  if (location.includes(q)) return 220;
  if (description.includes(q)) return 120;
  return 0;
}

export function isAllowedUnit(unit: string): boolean {
  return AGRICULTURAL_UNITS.includes(String(unit || '').trim().toLowerCase());
}

export function searchProducts<T extends ProductSearchable>(products: T[], query: ProductSearchQuery) {
  const search = String(query.search || '').trim().toLowerCase();
  const category = String(query.category || '').trim();
  const stock = query.stock || 'all';
  const sort = query.sort || 'featured';
  const pageSize = Math.min(query.maxPageSize || 48, Math.max(1, Number(query.pageSize || 24)));
  const page = Math.max(1, Number(query.page || 1));

  let results = products.filter((product) => {
    if (category && category !== 'All' && product.category.toLowerCase() !== category.toLowerCase()) {
      return false;
    }
    if (query.sellerId) {
      const sellerId = String(query.sellerId);
      if (product.sellerId !== sellerId && String(product.sellerUserId) !== sellerId) return false;
    }
    if (query.seller && (product.seller || '').toLowerCase() !== String(query.seller).toLowerCase()) {
      return false;
    }
    if (query.minPrice !== undefined && product.price < query.minPrice) return false;
    if (query.maxPrice !== undefined && product.price > query.maxPrice) return false;
    if (query.location && !(product.location || '').toLowerCase().includes(String(query.location).toLowerCase())) {
      return false;
    }
    if (query.organic && !product.organic) return false;
    if (stock === 'in' && product.stock <= 0) return false;
    if (stock === 'low' && !(product.stock > 0 && product.stock <= 10)) return false;
    if (stock === 'out' && product.stock > 0) return false;
    if (search) {
      return relevanceScore(product, search) > 0;
    }
    return true;
  });

  results = [...results].sort((a, b) => {
    if (sort === 'price-asc' || sort === 'price_asc') return a.price - b.price;
    if (sort === 'price-desc' || sort === 'price_desc') return b.price - a.price;
    if (sort === 'newest') return String(b.created_at || '').localeCompare(String(a.created_at || ''));
    if (sort === 'stock') return a.stock - b.stock;
    if (sort === 'sales') return (b.reviews || 0) - (a.reviews || 0);
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
    return relevanceScore(b, search) - relevanceScore(a, search);
  });

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = results.slice(start, start + pageSize);

  return {
    products: pageItems,
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function suggestProducts<T extends ProductSearchable>(products: T[], rawQuery: string, limit = 8) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return products
      .filter((p) => p.stock > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  }
  return products
    .filter((p) => relevanceScore(p, query) > 0)
    .sort((a, b) => relevanceScore(b, query) - relevanceScore(a, query))
    .slice(0, limit);
}

export function relatedProducts<T extends ProductSearchable>(products: T[], product: T, limit = 4) {
  return products
    .filter((item) => item.id !== product.id && item.category === product.category && item.stock > 0)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit);
}
