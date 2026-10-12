type OrderLike = {
  userId: number;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{ sellerUserId?: number; sellerId?: string; productId: string; quantity: number; price: number }>;
};

type ProductLike = {
  id: string;
  name: string;
  stock: number;
  category?: string;
  sellerUserId?: number;
  isUnlisted?: boolean;
  isActive?: boolean;
};

type UserLike = {
  id: number;
  roles: string[];
  is_active?: boolean;
};

const completed = (status: string) => status === 'Delivered';
const countedSale = (status: string) => status !== 'Cancelled';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function orderValue(order: OrderLike, role: string, userId: number) {
  if (role === 'seller') {
    return order.items
      .filter((item) => item.sellerUserId === userId || item.sellerId === `seller-${userId}`)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
  return order.total;
}

function buildCharts(orders: OrderLike[], products: ProductLike[], role: string, userId: number) {
  const now = new Date();
  const counted = orders.filter((order) => completed(order.status));
  const series = MONTHS.map((label, index) => {
    const monthOrders = counted.filter((order) => new Date(order.createdAt).getMonth() === index);
    const daily = monthOrders
      .filter((order) => new Date(order.createdAt).toDateString() === now.toDateString() && index === now.getMonth())
      .reduce((sum, order) => sum + orderValue(order, role, userId), 0);
    const monthly = monthOrders.reduce((sum, order) => sum + orderValue(order, role, userId), 0);
    const yearly = counted
      .filter((order) => new Date(order.createdAt).getFullYear() === now.getFullYear())
      .reduce((sum, order) => sum + orderValue(order, role, userId), 0);
    return { label, daily, monthly, yearly };
  });
  const buckets: Record<string, number> = {};
  counted.forEach((order) => {
    order.items.forEach((item) => {
      if (role === 'seller' && item.sellerUserId !== userId && item.sellerId !== `seller-${userId}`) return;
      const product = products.find((entry) => entry.id === item.productId);
      const key = product?.category || 'Other';
      buckets[key] = (buckets[key] || 0) + item.price * item.quantity;
    });
  });
  return {
    series,
    categories: Object.entries(buckets).map(([name, value]) => ({ name, value })),
  };
}

export function computeRoleAnalytics(input: {
  role: string;
  userId: number;
  orders: OrderLike[];
  products: ProductLike[];
  users: UserLike[];
  deliveries?: Array<{ driverId?: number; status: string }>;
  range?: '7d' | '30d' | 'year' | 'all';
}) {
  const { role, userId, orders, products, users, deliveries = [], range = 'all' } = input;

  let startDate: Date | null = null;
  const now = new Date();
  if (range === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  const rangeOrders = startDate
    ? orders.filter((o) => new Date(o.createdAt) >= startDate!)
    : orders;

  if (role === 'admin') {
    const gmv = rangeOrders.filter((o) => completed(o.status)).reduce((sum, o) => sum + o.total, 0);
    return {
      role,
      range,
      metrics: {
        gmv,
        orderCount: rangeOrders.filter((o) => countedSale(o.status)).length,
        cancelledOrders: rangeOrders.filter((o) => o.status === 'Cancelled').length,
        userCount: users.length,
        activeSellers: users.filter((u) => u.roles.includes('seller') && u.is_active !== false).length,
        activeListings: products.filter((p) => p.isActive !== false && !p.isUnlisted).length,
        lowStock: products.filter((p) => p.stock > 0 && p.stock <= 10).length,
      },
      ...buildCharts(rangeOrders, products, role, userId),
    };
  }

  if (role === 'seller') {
    const sellerOrders = rangeOrders.filter((o) =>
      o.items.some((item) => item.sellerUserId === userId || item.sellerId === `seller-${userId}`)
    );
    const delivered = sellerOrders.filter((o) => completed(o.status));
    const sales = delivered.reduce((sum, order) => {
      return (
        sum +
        order.items
          .filter((item) => item.sellerUserId === userId || item.sellerId === `seller-${userId}`)
          .reduce((itemSum, item) => itemSum + item.price * item.quantity, 0)
      );
    }, 0);
    const ownProducts = products.filter((p) => p.sellerUserId === userId);
    return {
      role,
      range,
      metrics: {
        sales,
        orderCount: sellerOrders.filter((o) => countedSale(o.status)).length,
        deliveredCount: delivered.length,
        listingCount: ownProducts.length,
        lowStock: ownProducts.filter((p) => p.stock > 0 && p.stock <= 10).length,
        outOfStock: ownProducts.filter((p) => p.stock <= 0).length,
      },
      ...buildCharts(sellerOrders, products, role, userId),
    };
  }

  if (role === 'delivery') {
    const assigned = deliveries.filter((d) => d.driverId === userId);
    return {
      role,
      range,
      metrics: {
        assignedDeliveries: assigned.length,
        completedDeliveries: assigned.filter((d) => d.status === 'Delivered').length,
        inTransit: assigned.filter((d) => d.status === 'Out for delivery').length,
      },
      series: [],
      categories: [],
    };
  }

  const mine = rangeOrders.filter((o) => o.userId === userId);
  return {
    role: 'buyer',
    range,
    metrics: {
      orderCount: mine.length,
      spent: mine.filter((o) => completed(o.status)).reduce((sum, o) => sum + o.total, 0),
      openOrders: mine.filter((o) => !['Delivered', 'Cancelled'].includes(o.status)).length,
    },
    ...buildCharts(mine, products, 'buyer', userId),
  };
}
