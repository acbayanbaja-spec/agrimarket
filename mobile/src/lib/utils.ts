export function formatPeso(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function stockLabel(stock: number) {
  if (stock <= 0) return 'Out of stock'
  if (stock <= 20) return 'Low stock'
  return 'In stock'
}
