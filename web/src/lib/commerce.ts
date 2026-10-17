import type { Product } from '../data/catalog'

export const BUDGET_PRESETS = [50, 100, 150, 200, 300, 400]

export type ParsedSearch = {
  raw: string
  text: string
  budget?: number
}

export function parseSearchQuery(raw: string): ParsedSearch {
  const trimmed = raw.trim()
  if (!trimmed) return { raw: '', text: '' }

  const pesoHint = /budget|peso|php|₱/i.test(trimmed)
  const onlyAmount = /^(?:budget\s*)?(?:₱|php\s*)?(\d{2,5})\s*(?:pesos?|php)?\.?$/i.exec(trimmed)
  if (onlyAmount) {
    return { raw: trimmed, text: '', budget: Number(onlyAmount[1]) }
  }

  const embedded = trimmed.match(/(?:budget\s*)?(?:₱|php\s*)(\d{2,5})|(\d{2,5})\s*(?:pesos?|php)/i)
  if (embedded) {
    const budget = Number(embedded[1] || embedded[2])
    const text = trimmed.replace(embedded[0], '').replace(/\s+/g, ' ').trim()
    return { raw: trimmed, text, budget }
  }

  if (pesoHint) {
    const digits = trimmed.match(/(\d{2,5})/)
    if (digits) {
      return { raw: trimmed, text: trimmed.replace(digits[0], '').replace(/budget|pesos?|php|₱/gi, '').trim(), budget: Number(digits[1]) }
    }
  }

  return { raw: trimmed, text: trimmed }
}

export function pointsFromSpend(subtotal: number) {
  return Math.max(0, Math.floor(subtotal / 10))
}

export function harvestMeta(product: Product) {
  const price = typeof product?.price === 'number' && !isNaN(product.price) ? product.price : (Number(product?.price) || 0)
  const reviews = typeof product?.reviews === 'number' && !isNaN(product.reviews) ? product.reviews : (Number(product?.reviews) || 0)
  return {
    sold: Math.max(reviews * 7, 18),
    originalPrice: Math.round(price * 1.18),
    points: Math.max(1, Math.floor(price / 10)),
    eta: 'Same-day to next-day inside SOCCSKSARGEN',
    freshness: product?.organic ? 'Dawn-picked and cold-packed' : 'Packed the same morning',
    guarantee: 'Freshness guaranteed or harvest points back',
    origin: `${product?.seller || 'Farm Stall'} · ${product?.location || 'SOCCSKSARGEN'}`,
  }
}

export function matchProduct(product: Product, query: string) {
  if (!query) return true
  const haystack = `${product.name} ${product.seller} ${product.location} ${product.category} ${product.description}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export function getEstimatedDeliveryDate(createdAt?: string | number | Date) {
  const base = createdAt ? new Date(createdAt) : new Date()
  const validBase = isNaN(base.getTime()) ? new Date() : base
  const start = new Date(validBase)
  start.setDate(start.getDate() + 1)
  const end = new Date(validBase)
  end.setDate(end.getDate() + 2)

  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', weekday: 'short' }
  return {
    dateRange: `${start.toLocaleDateString('en-PH', opts)} – ${end.toLocaleDateString('en-PH', opts)}`,
    etaText: '1–2 Days (SOCCSKSARGEN Express)',
  }
}


export function filterByBudget<T extends { price: number; stock: number }>(products: T[], budget: number) {
  return products.filter((product) => product.stock > 0 && product.price <= budget).sort((a, b) => b.price - a.price)
}
