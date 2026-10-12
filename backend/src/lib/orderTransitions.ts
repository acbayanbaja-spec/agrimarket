export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Out for delivery' | 'Delivered' | 'Cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Shipped',
  'Out for delivery',
  'Delivered',
  'Cancelled',
];

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Out for delivery', 'Cancelled'],
  Shipped: ['Out for delivery', 'Delivered', 'Cancelled'],
  'Out for delivery': ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  return ALLOWED[from]?.includes(to) || false;
}

export function orderProgressIndex(status: OrderStatus): number {
  const sequence: OrderStatus[] = ['Pending', 'Confirmed', 'Shipped', 'Out for delivery', 'Delivered'];
  if (status === 'Cancelled') return -1;
  return sequence.indexOf(status);
}
