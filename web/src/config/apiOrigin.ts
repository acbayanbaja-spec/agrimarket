/**
 * Single production API origin for the web app.
 *
 * The Render service currently serving AgriMarket is agrimarket-0y5r.onrender.com.
 * agrimarket-backend.onrender.com returns 404 and must not be used as a fallback.
 * Override at build time with VITE_API_URL / VITE_SOCKET_URL.
 */
export const PRODUCTION_API_ORIGIN = 'https://agrimarket-0y5r.onrender.com'

function isLoopbackUrl(url: string): boolean {
  return url.includes('localhost') || url.includes('127.0.0.1')
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

export function resolveApiOrigin(): string {
  const envUrl = trimSlash(String(import.meta.env.VITE_API_URL || '').trim())
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname
    const isLocal = host === 'localhost' || host === '127.0.0.1'
    if (!isLocal) {
      if (envUrl && !isLoopbackUrl(envUrl)) return envUrl
      return PRODUCTION_API_ORIGIN
    }
    // Dev server proxies /api to the backend so 127.0.0.1 vs localhost never trips CORS.
    if (import.meta.env.DEV) return ''
  }
  return envUrl || 'http://localhost:5000'
}

export function resolveSocketOrigin(): string {
  const envUrl = trimSlash(String(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '').trim())
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname
    const isLocal = host === 'localhost' || host === '127.0.0.1'
    if (!isLocal) {
      if (envUrl && !isLoopbackUrl(envUrl)) return envUrl
      return PRODUCTION_API_ORIGIN
    }
    if (import.meta.env.DEV) return ''
  }
  return envUrl || 'http://localhost:5000'
}
