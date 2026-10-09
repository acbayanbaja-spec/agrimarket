import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  try {
    window.history.scrollRestoration = 'manual'
  } catch {}
}

export const scrollToTopNow = () => {
  // Blur currently focused active element to avoid mobile browser auto-scrolling to it
  try {
    if (document.activeElement && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  } catch {}

  try {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
      window.scroll({ top: 0, left: 0, behavior: 'auto' })
    }
  } catch {}

  try {
    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = 0
    }
  } catch {}

  try {
    if (document.documentElement) {
      document.documentElement.scrollTop = 0
    }
  } catch {}

  try {
    if (document.body) {
      document.body.scrollTop = 0
    }
  } catch {}

  try {
    const root = document.getElementById('root')
    if (root) root.scrollTop = 0
  } catch {}

  try {
    const main = document.querySelector('main')
    if (main) main.scrollTop = 0
  } catch {}
}

export const ScrollToTop = () => {
  const location = useLocation()
  const { pathname, search, hash, key } = location

  useLayoutEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      try {
        window.history.scrollRestoration = 'manual'
      } catch {}
    }

    if (hash) {
      try {
        const element = document.getElementById(hash.replace('#', ''))
        if (element) {
          element.scrollIntoView()
          return
        }
      } catch {}
    }

    // Immediately reset scroll
    scrollToTopNow()

    // Repeat across animation frames and timeout checkpoints to overcome
    // mobile Safari / Chrome asynchronous touch scroll restorations, momentum, and late image layout shifts
    const frame1 = requestAnimationFrame(() => {
      scrollToTopNow()
      requestAnimationFrame(scrollToTopNow)
    })

    const timer1 = setTimeout(scrollToTopNow, 20)
    const timer2 = setTimeout(scrollToTopNow, 60)
    const timer3 = setTimeout(scrollToTopNow, 150)
    const timer4 = setTimeout(scrollToTopNow, 300)
    const timer5 = setTimeout(scrollToTopNow, 500)

    return () => {
      cancelAnimationFrame(frame1)
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      clearTimeout(timer5)
    }
  }, [pathname, search, hash, key])

  return null
}

export default ScrollToTop
