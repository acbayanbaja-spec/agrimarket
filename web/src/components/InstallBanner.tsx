import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Smartphone, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const InstallBanner = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(() => localStorage.getItem('agrimarket.hideInstall') === '1')
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (ios && !standalone) setIosHint(true)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (hidden || (!deferred && !iosHint)) return null

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  const dismiss = () => {
    localStorage.setItem('agrimarket.hideInstall', '1')
    setHidden(true)
  }

  return (
    <div className="bg-gradient-to-r from-primary-700 to-primary-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <Smartphone className="h-5 w-5 shrink-0" />
        <p className="flex-1 text-sm">
          Add AgriMarket to your phone like Shopee — Home Screen icon, cart, points, and harvests offline-ready.
        </p>
        {deferred ? (
          <button type="button" className="btn-primary bg-white text-primary-800 py-1.5 px-3 text-sm" onClick={install}>
            Install app
          </button>
        ) : (
          <Link to="/get-app" className="btn-primary bg-white text-primary-800 py-1.5 px-3 text-sm">
            How to install
          </Link>
        )}
        <button type="button" onClick={dismiss} aria-label="Dismiss" className="p-1 opacity-80 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default InstallBanner
