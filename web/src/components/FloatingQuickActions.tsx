import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, ArrowUp, Smartphone, Heart, Sparkles } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import DownloadAppModal from './DownloadAppModal'

export const FloatingQuickActions = () => {
  const { wishlist, unreadCount } = useStore()
  const { isAuthenticated, hasRole } = useAuth()
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <aside aria-label="Quick Actions" className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2.5">
        {/* Floating Download Mobile App Pill */}
        <button
          type="button"
          onClick={() => setIsDownloadOpen(true)}
          className="group flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-primary-700 hover:from-emerald-500 hover:to-primary-600 text-white pl-3 pr-3.5 py-2 rounded-full shadow-lg shadow-emerald-900/20 hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20 text-xs font-bold animate-fade-up"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
          </span>
          <Smartphone className="h-4 w-4" />
          <span className="hidden sm:inline">Download App</span>
          <span className="text-[10px] bg-yellow-400 text-emerald-950 font-extrabold px-1.5 py-0.2 rounded-full uppercase">
            Sync
          </span>
        </button>

        {/* Floating Wishlist Shortcut - hidden for delivery rider */}
        {!hasRole('delivery') && wishlist.length > 0 && (
          <Link
            to="/marketplace"
            className="flex items-center justify-center w-11 h-11 bg-white hover:bg-rose-50 text-rose-600 rounded-full shadow-md border border-rose-100 hover:scale-105 transition-all relative"
            title="Wishlist Items"
          >
            <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-sm">
              {wishlist.length}
            </span>
          </Link>
        )}

        {/* Floating Chat / Messages Shortcut */}
        <Link
          to={isAuthenticated ? '/messages' : '/login'}
          className="flex items-center justify-center w-11 h-11 bg-soil-900 hover:bg-primary-700 text-white rounded-full shadow-md border border-white/20 hover:scale-105 transition-all relative"
          title="Direct Farm Chat & SMS"
        >
          <MessageSquare className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center animate-pop">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Back to top button */}
        {showBackToTop && (
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur text-gray-700 hover:text-primary-700 rounded-full shadow-md border border-gray-200 hover:scale-105 transition-all"
            aria-label="Back to top"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </aside>

      <DownloadAppModal isOpen={isDownloadOpen} onClose={() => setIsDownloadOpen(false)} />
    </>
  )
}

export default FloatingQuickActions
