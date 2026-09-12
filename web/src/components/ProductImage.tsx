import { useEffect, useState } from 'react'

type Props = {
  src?: string
  alt: string
  className?: string
}

const FALLBACK = '/images/fallback.svg'

function backupFor(src: string) {
  if (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png') || src.endsWith('.webp')) {
    return src.replace(/\.(jpg|jpeg|png|webp)$/i, '.svg')
  }
  return FALLBACK
}

const ProductImage = ({ src, alt, className }: Props) => {
  const initial = src || FALLBACK
  const [current, setCurrent] = useState(initial)

  useEffect(() => {
    setCurrent(src || FALLBACK)
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
