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
  const near = /laguna|nueva ecija|batangas|pampanga|quezon/i.test(product.location)
  return {
    sold: Math.max(product.reviews * 7, 18),
    originalPrice: Math.round(product.price * 1.18),
    points: Math.max(1, Math.floor(product.price / 10)),
    eta: near ? 'Arrives tomorrow' : '2–4 days',
    freshness: product.organic ? 'Dawn-picked and cold-packed' : 'Packed the same morning',
    guarantee: 'Freshness guaranteed or harvest points back',
    origin: `${product.seller} · ${product.location}`,
  }
}

export function matchProduct(product: Product, query: string) {
  if (!query) return true
  const haystack = `${product.name} ${product.seller} ${product.location} ${product.category} ${product.description}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export function filterByBudget<T extends { price: number; stock: number }>(products: T[], budget: number) {
  return products.filter((product) => product.stock > 0 && product.price <= budget).sort((a, b) => b.price - a.price)
}
