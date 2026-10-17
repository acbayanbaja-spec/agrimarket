import { useEffect, useState } from 'react'
import { resolveApiOrigin } from '../config/apiOrigin'

type Props = {
  src?: string
  alt: string
  className?: string
}

export const FALLBACK = '/images/fallback.svg'

export function resolveImageUrl(src?: string): string {
  if (!src || typeof src !== 'string') return FALLBACK
  const clean = src.trim()
  if (!clean) return FALLBACK

  // Data URLs, Blobs, or external URLs
  if (
    clean.startsWith('data:') ||
    clean.startsWith('blob:') ||
    clean.startsWith('http://') ||
    clean.startsWith('https://')
  ) {
    return clean
  }

  // Uploaded backend files: /uploads/... or uploads/...
  if (clean.startsWith('/uploads/') || clean.startsWith('uploads/')) {
    const path = clean.startsWith('/') ? clean : `/${clean}`
    const origin = resolveApiOrigin()
    return origin ? `${origin}${path}` : path
  }

  // Missing leading slash on bundled assets
  if (clean.startsWith('images/')) {
    return `/${clean}`
  }

  return clean
}

function backupFor(src: string): string {
  if (!src || typeof src !== 'string') return FALLBACK
  // Only attempt svg fallback for bundled sample images located in /images/
  if (src.includes('/images/') && (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png') || src.endsWith('.webp'))) {
    return src.replace(/\.(jpg|jpeg|png|webp)$/i, '.svg')
  }
  return FALLBACK
}

const ProductImage = ({ src, alt, className }: Props) => {
  const [current, setCurrent] = useState(() => resolveImageUrl(src))

  useEffect(() => {
    setCurrent(resolveImageUrl(src))
  }, [src])

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        const next = backupFor(current)
        if (current !== next) {
          setCurrent(next)
          return
        }
        if (current !== FALLBACK) setCurrent(FALLBACK)
      }}
    />
  )
}

export default ProductImage

