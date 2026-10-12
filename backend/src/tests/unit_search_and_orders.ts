import { isAllowedUnit, searchProducts, suggestProducts } from '../lib/productSearch';
import { canTransitionOrder } from '../lib/orderTransitions';
import { computeRoleAnalytics } from '../lib/analytics';

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const catalog = [
  {
    id: 'p1',
    name: 'Carabao Mango',
    category: 'Fruits',
    description: 'Sweet mango from Koronadal',
    location: 'Koronadal City, South Cotabato',
    seller: 'Maria Santos Farm',
    sellerId: 'seller-2',
    sellerUserId: 2,
    price: 120,
    stock: 8,
    organic: true,
    rating: 4.8,
    reviews: 20,
    created_at: '2026-01-02',
  },
  {
    id: 'p2',
    name: 'Tomato',
    category: 'Vegetables',
    description: 'Ripe salad tomato',
    location: 'Midsayap, Cotabato',
    seller: 'Eduardo Dizon Farm',
    sellerId: 'seller-13',
    sellerUserId: 13,
    price: 45,
    stock: 0,
    organic: false,
    rating: 4.2,
    reviews: 8,
    created_at: '2026-02-01',
  },
  {
    id: 'p3',
    name: 'Mango Puree',
    category: 'Processed',
    description: 'Processed mango',
    location: 'Koronadal City, South Cotabato',
    seller: 'Maria Santos Farm',
    sellerId: 'seller-2',
    sellerUserId: 2,
    price: 90,
    stock: 30,
    organic: false,
    rating: 4.0,
    reviews: 3,
    created_at: '2026-03-01',
  },
];

const mangoSearch = searchProducts(catalog, { search: 'mango', page: 1, pageSize: 1 });
assert(mangoSearch.total === 2, 'search should match mango products by name or description');
assert(mangoSearch.products[0].id === 'p1', 'exact/name match should rank first');
assert(mangoSearch.totalPages === 2, 'pagination should split results');

const inStock = searchProducts(catalog, { stock: 'in', sort: 'price-asc' });
assert(inStock.total === 2 && inStock.products[0].id === 'p3', 'in-stock sort by price should work');

const suggestions = suggestProducts(catalog, 'tom');
assert(suggestions[0].id === 'p2', 'suggestions should return tomato for tom');

assert(canTransitionOrder('Pending', 'Confirmed'), 'pending can be confirmed');
assert(!canTransitionOrder('Pending', 'Delivered'), 'pending cannot skip to delivered');
assert(!canTransitionOrder('Delivered', 'Cancelled'), 'delivered is terminal');
assert(canTransitionOrder('Confirmed', 'Cancelled'), 'confirmed can be cancelled');
assert(isAllowedUnit('kg') && isAllowedUnit('sack') && !isAllowedUnit('barrel'), 'agricultural units are validated');

const sellerAnalytics = computeRoleAnalytics({
  role: 'seller',
  userId: 2,
  orders: [
    {
      userId: 3,
      total: 240,
      status: 'Delivered',
      createdAt: '2026-04-01',
      items: [{ sellerUserId: 2, productId: 'p1', quantity: 2, price: 120 }],
    },
    {
      userId: 3,
      total: 45,
      status: 'Cancelled',
      createdAt: '2026-04-02',
      items: [{ sellerUserId: 2, productId: 'p1', quantity: 1, price: 45 }],
    },
  ],
  products: catalog,
  users: [{ id: 2, roles: ['seller'] }],
});
assert(sellerAnalytics.metrics.sales === 240, 'cancelled orders must not count as sales');
assert(sellerAnalytics.metrics.orderCount === 1, 'cancelled orders are excluded from sale counts');
assert(sellerAnalytics.series[3].monthly === 240, 'seller monthly series must exclude cancelled orders');

const buyerAnalytics = computeRoleAnalytics({
  role: 'buyer',
  userId: 3,
  orders: [
    {
      userId: 3,
      total: 240,
      status: 'Delivered',
      createdAt: '2026-04-01',
      items: [{ sellerUserId: 2, productId: 'p1', quantity: 2, price: 120 }],
    },
    {
      userId: 3,
      total: 90,
      status: 'Pending',
      createdAt: '2026-04-03',
      items: [{ sellerUserId: 2, productId: 'p3', quantity: 1, price: 90 }],
    },
  ],
  products: catalog,
  users: [{ id: 3, roles: ['buyer'] }],
});
assert(buyerAnalytics.metrics.spent === 240, 'buyer spend should count delivered orders only');
assert(buyerAnalytics.metrics.openOrders === 1, 'buyer open orders should exclude delivered and cancelled');
assert(buyerAnalytics.series[3].monthly === 240, 'buyer April series should count delivered mango order');
assert(buyerAnalytics.categories.some((row) => row.name === 'Fruits' && row.value === 240), 'buyer category chart should group delivered items');

console.log('unit_search_and_orders: all assertions passed');
