export function formatPeso(amount: number) {
  return `₱${Math.round(amount).toLocaleString('en-PH')}`
}

export function stockLabel(stock: number) {
  if (stock <= 0) return 'Out of stock'
  if (stock <= 20) return 'Low stock'
  return 'In stock'
}
