import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search,
  Phone,
  Video,
  Info,
  Pin,
  ChevronDown,
  ChevronUp,
  Plus,
  Image as ImageIcon,
  Smile,
  FileText,
  ThumbsUp,
  Send,
  Reply,
  X,
  Check,
  CheckCheck,
  Truck,
  Store,
  User as UserIcon,
  PenSquare as SquarePen,
  MessageCircle,
  ExternalLink,
  MapPin,
  PackageCheck,
  AlertCircle,
  Sparkles,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { useStore, SmsMessage } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { formatPeso } from '../lib/utils'
import Seo from '../components/Seo'

// Quick Messenger Sound FX using Web Audio API
function playMessengerPop() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08) // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.12)
  } catch {}
}

type ChatFilterTab = 'all' | 'sellers' | 'riders' | 'buyers' | 'orders'

interface ExtendedMessage extends SmsMessage {
  replyTo?: {
    id: string
    fromName: string
    body: string
  }
  reaction?: string
}

const QUICK_AGRICULTURAL_TEMPLATES = [
  '🌱 Harvest confirmed! Produce is fresh and ready for packing.',
  '📦 Packed in sanitized regional crates. Ready for rider pickup.',
  '🛵 Rider is en route to pickup farm lot.',
  '📍 Rider has arrived at drop-off location. Please receive.',
  '💵 Please prepare exact cash on delivery (COD).',
  '👍 Confirmed, thank you for supporting SOCCSKSARGEN farmers!'
]

const QUICK_EMOJIS = ['👍', '❤️', '🥕', '🥭', '🌾', '🛵', '🔥', '🙏']

const MessagesPage: React.FC = () => {
  const { messages, orders, sendSms, myListings } = useStore()
  const { user, hasRole } = useAuth()
  const [searchParams] = useSearchParams()
  const queryOrderId = searchParams.get('orderId')

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<ChatFilterTab>('all')
  const [inputText, setInputText] = useState('')
  const [replyingTo, setReplyingTo] = useState<{ id: string; fromName: string; body: string } | null>(null)
  const [showPinnedDetails, setShowPinnedDetails] = useState(false)
  const [showInfoSidebar, setShowInfoSidebar] = useState(false)
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [showEmojiBar, setShowEmojiBar] = useState(false)
  const [callModal, setCallModal] = useState<'audio' | 'video' | null>(null)
  const [reactions, setReactions] = useState<Record<string, string>>({})
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          setIsFullscreen((prev) => !prev)
        })
      } else {
        setIsFullscreen((prev) => !prev)
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false)
        })
      } else {
        setIsFullscreen(false)
      }
    }
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Orders accessible to current user
  const relevantOrders = useMemo(() => {
    if (!user) return orders
    if (hasRole('admin')) return orders
    if (hasRole('seller')) {
      const listingIds = new Set(myListings.map((p) => p.id))
      return orders.filter(
        (order) =>
          order.userId === user.id ||
          order.driverId === user.id ||
          order.items.some((i) => listingIds.has(i.productId) || i.sellerUserId === user.id)
      )
    }
    return orders.filter((order) => order.userId === user.id || order.driverId === user.id)
  }, [orders, user, hasRole, myListings])

  // Build Conversation Threads (Messenger Chats List)
  const threads = useMemo(() => {
    const list: Array<{
      id: string
      title: string
      subtitle: string
      role: 'seller' | 'delivery' | 'buyer' | 'order'
      avatar: string
      orderId?: string
      lastTime: string
      unreadCount: number
      targetUserId: number
      targetPhone?: string
    }> = []

    // 1. Thread for each relevant order
    relevantOrders.forEach((order) => {
      const orderMsgs = messages.filter((m) => m.orderId === order.id)
      const lastMsg = orderMsgs[orderMsgs.length - 1]
      const mainSeller = order.items?.[0]?.seller || 'Farm Seller'
      const isSeller = hasRole('seller')
      const isDelivery = hasRole('delivery')

      let title = `Order #${order.receiptNo || order.id.slice(-6)}`
      let role: 'seller' | 'delivery' | 'buyer' | 'order' = 'order'
      let targetUserId = order.userId
      let targetPhone = order.buyerPhone

      if (isSeller) {
        title = `${order.buyerName} (Buyer)`
        role = 'buyer'
        targetUserId = order.userId
        targetPhone = order.buyerPhone
      } else if (isDelivery) {
        title = `${order.buyerName} (Buyer)`
        role = 'buyer'
        targetUserId = order.userId
        targetPhone = order.buyerPhone
      } else {
        // Buyer view
        title = `${mainSeller} (Seller)`
        role = 'seller'
        targetUserId = Number(order.items?.[0]?.sellerUserId) || 2
        targetPhone = undefined
      }

      const subtitle = lastMsg ? `${lastMsg.fromName.split(' ')[0]}: ${lastMsg.body}` : `${order.items?.length || 1} items · ${order.status}`

      list.push({
        id: order.id,
        title,
        subtitle,
        role,
        avatar: order.items?.[0]?.image || '/images/farm.jpg',
        orderId: order.id,
        lastTime: lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
        unreadCount: order.status === 'Pending' ? 1 : 0,
        targetUserId,
        targetPhone,
      })
    })

    // 2. Default fallback contacts if no orders
    if (list.length === 0) {
      list.push(
        {
          id: 'contact-seller',
          title: 'Maria Santos (Vegetable Seller)',
          subtitle: 'Green Valley Farm · Polomolok',
          role: 'seller',
          avatar: '/images/kangkong.jpg',
          lastTime: '12:30 PM',
          unreadCount: 1,
          targetUserId: 2,
          targetPhone: '+639171112233',
        },
        {
          id: 'contact-fruit-seller',
          title: 'Eduardo Dizon (Fruit Producer)',
          subtitle: 'Midsayap Gold Orchard · Fruits',
          role: 'seller',
          avatar: '/images/mango.jpg',
          lastTime: '11:15 AM',
          unreadCount: 0,
          targetUserId: 13,
          targetPhone: '+639173334455',
        },
        {
          id: 'contact-rider',
          title: 'Rico Driver (Express Courier)',
          subtitle: 'Active Courier · SOCCSKSARGEN',
          role: 'delivery',
          avatar: '/images/rider-avatar.png',
          lastTime: '10:04 AM',
          unreadCount: 0,
          targetUserId: 4,
          targetPhone: '09363894541',
        }
      )
    }

    return list
  }, [relevantOrders, messages, hasRole])

  // Initial selected thread
  const [activeThreadId, setActiveThreadId] = useState<string>(() => {
    if (queryOrderId && threads.some((t) => t.orderId === queryOrderId)) return queryOrderId
    return threads[0]?.id || ''
  })

  // Synchronize when query changes
  useEffect(() => {
    if (queryOrderId && threads.some((t) => t.orderId === queryOrderId)) {
      setActiveThreadId(queryOrderId)
    }
  }, [queryOrderId, threads])

  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === activeThreadId) || threads[0]
  }, [threads, activeThreadId])

  const activeOrder = useMemo(() => {
    if (!activeThread?.orderId) return relevantOrders[0]
    return relevantOrders.find((o) => o.id === activeThread.orderId) || relevantOrders[0]
  }, [relevantOrders, activeThread])

  // Filter threads by search and category pill
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      // Tab filter
      if (filterTab === 'sellers' && t.role !== 'seller') return false
      if (filterTab === 'riders' && t.role !== 'delivery') return false
      if (filterTab === 'buyers' && t.role !== 'buyer') return false
      if (filterTab === 'orders' && t.role !== 'order') return false

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return t.title.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q)
      }
      return true
    })
  }, [threads, filterTab, searchQuery])

  // Messages in current active thread
  const activeMessages = useMemo(() => {
    if (!activeThread) return []
    if (activeThread.orderId) {
      return messages.filter((m) => m.orderId === activeThread.orderId)
    }
    return messages.filter(
      (m) =>
        m.toUserId === activeThread.targetUserId ||
        m.fromUserId === activeThread.targetUserId ||
        (user && (m.toUserId === user.id || m.fromUserId === user.id))
    )
  }, [messages, activeThread, user])

  // Scroll to bottom on new message or thread switch
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages.length, activeThreadId])

  // Send message handler
  const handleSendMessage = (textToSend?: string) => {
    const raw = (textToSend !== undefined ? textToSend : inputText).trim()
    if (!raw || !user) return

    const isSeller = hasRole('seller')
    const isDelivery = hasRole('delivery') || hasRole('admin')
    const fromRole = isSeller ? 'seller' : isDelivery ? 'delivery' : 'buyer'
    const toBuyer = isDelivery || isSeller
    const phone = activeThread?.targetPhone || (toBuyer && activeOrder ? activeOrder.buyerPhone : user.phone)
    const targetUserId = activeThread ? activeThread.targetUserId : toBuyer && activeOrder ? activeOrder.userId : 2

    sendSms({
      orderId: activeOrder ? activeOrder.id : `ORD-${Date.now()}`,
      fromRole,
      fromName: `${user.firstName} ${user.lastName}`.trim(),
      fromUserId: user.id,
      toUserId: targetUserId,
      phone,
      body: raw,
    })

    playMessengerPop()
    setInputText('')
    setReplyingTo(null)
    setShowEmojiBar(false)
    setShowTemplatesModal(false)
  }

  // Quick Like (Thumbs up)
  const handleQuickLike = () => {
    handleSendMessage('👍')
  }

  // Toggle Reaction on a message
  const handleToggleReaction = (messageId: string, emoji: string) => {
    setReactions((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === emoji ? '' : emoji
    }))
  }

  return (
    <div className={`bg-[#18191a] text-[#e4e6eb] font-sans select-none antialiased ${isFullscreen ? 'fixed inset-0 z-[9999] h-screen w-screen overflow-hidden' : 'w-full h-full flex flex-col overflow-hidden'}`}>
      {isFullscreen && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-600 px-4 py-1.5 flex items-center justify-between text-xs text-white shrink-0 shadow-md z-50">
          <span className="font-bold flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Full Screen Mode · Press ESC to exit</span>
          <button type="button" onClick={toggleFullscreen} className="px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold transition-colors flex items-center gap-1">
            <Minimize2 className="w-3 h-3" /> Exit Full Screen
          </button>
        </div>
      )}
      <Seo
        title="Messenger · Buyer, Seller & Rider Chat"
        description="Real-time Facebook Messenger dark mode communication between buyers, farm producers, and delivery couriers."
        path="/messages"
      />

      {/* Main Container */}
      <div className="flex-1 flex w-full h-full overflow-hidden">
        
        {/* ======================================================== */}
        {/* LEFT SIDEBAR: "Chats" (Messenger Dark Sidebar)           */}
        {/* ======================================================== */}
        <aside className="w-full sm:w-80 md:w-96 flex-shrink-0 bg-[#242526] border-r border-[#2f3031] flex flex-col h-full overflow-hidden">
          
          {/* Sidebar Header */}
          <div className="p-3 sm:p-4 pb-2 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                Chats
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live
                </span>
              </h1>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Messenger Network"
                  className="w-9 h-9 rounded-full bg-[#3a3b3c] hover:bg-[#4e4f50] flex items-center justify-center text-white transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-blue-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowTemplatesModal(true)}
                  title="New message / templates"
                  className="w-9 h-9 rounded-full bg-[#3a3b3c] hover:bg-[#4e4f50] flex items-center justify-center text-white transition-colors"
                >
                  <SquarePen className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>

            {/* Pill Search Bar */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-[#b0b3b8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Messenger"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#3a3b3c] hover:bg-[#444546] focus:bg-[#3a3b3c] text-white text-sm rounded-full pl-10 pr-8 py-2 placeholder-[#b0b3b8] outline-none border border-transparent focus:border-blue-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Tabs (Messenger style) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-semibold text-[#b0b3b8]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {(['all', 'sellers', 'riders', 'buyers', 'orders'] as ChatFilterTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={`px-3 py-1.5 rounded-full capitalize transition-all whitespace-nowrap ${
                    filterTab === tab
                      ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                      : 'hover:bg-[#3a3b3c] text-[#b0b3b8]'
                  }`}
                >
                  {tab === 'all' ? 'All Chats' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Thread List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1 messenger-scrollbar">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-10 px-4 text-[#b0b3b8]">
                <MessageCircle className="w-10 h-10 mx-auto text-[#4e4f50] mb-2" />
                <p className="text-sm font-semibold">No chats found</p>
                <p className="text-xs text-[#8a8d91] mt-1">Try searching another farmer, rider, or order.</p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = thread.id === activeThread?.id
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full text-left p-2.5 rounded-2xl flex items-center gap-3 transition-colors ${
                      isActive
                        ? 'bg-[#2d3f56] text-white shadow-sm'
                        : 'hover:bg-[#3a3b3c]/60 text-[#e4e6eb]'
                    }`}
                  >
                    {/* Contact Avatar with Online indicator */}
                    <div className="relative shrink-0">
                      <img
                        src={thread.avatar}
                        alt={thread.title}
                        className="w-12 h-12 rounded-full object-cover border border-[#3e4042] bg-[#3a3b3c]"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center font-bold text-white text-base absolute inset-0 -z-10">
                        {thread.title.charAt(0)}
                      </div>
                      {/* Green Online status dot */}
                      <span className="w-3.5 h-3.5 bg-emerald-500 border-2 border-[#242526] rounded-full absolute bottom-0 right-0" />
                    </div>

                    {/* Chat Text Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm truncate text-white">
                          {thread.title}
                        </span>
                        <span className="text-[11px] text-[#b0b3b8] shrink-0 ml-1">
                          {thread.lastTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-[#b0b3b8] truncate pr-2">
                          {thread.subtitle}
                        </p>
                        {thread.unreadCount > 0 && (
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0" />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* User Account Bar at Bottom of Sidebar */}
          {user && (
            <div className="p-3 bg-[#1e1f20] border-t border-[#2f3031] flex items-center justify-between shrink-0 mt-auto">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {user.firstName?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                    {hasRole('seller') ? 'Farm Seller' : hasRole('delivery') ? 'Rider' : 'Marketplace Buyer'}
                  </p>
                </div>
              </div>
              <Link
                to="/profile"
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium hover:underline"
              >
                Profile
              </Link>
            </div>
          )}
        </aside>

        {/* ======================================================== */}
        {/* RIGHT MAIN CHAT AREA (Messenger Dark Window)             */}
        {/* ======================================================== */}
        <main className="flex-1 flex flex-col bg-[#18191a] relative h-full overflow-hidden">
          
          {/* Chat Window Top Header */}
          <header className="px-4 py-3 bg-[#242526] border-b border-[#2f3031] flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={activeThread?.avatar || '/images/farm.jpg'}
                  alt={activeThread?.title}
                  className="w-10 h-10 rounded-full object-cover border border-[#3e4042] bg-[#3a3b3c]"
                />
                <span className="w-3 h-3 bg-emerald-500 border-2 border-[#242526] rounded-full absolute bottom-0 right-0" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white leading-tight truncate flex items-center gap-2">
                  {activeThread?.title || 'AgriMarket Message Feed'}
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#3a3b3c] text-emerald-300">
                    {activeThread?.role || 'verified'}
                  </span>
                </h2>
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active now · SOCCSKSARGEN Verified
                </p>
              </div>
            </div>

            {/* Action Buttons: Phone, Video, Info */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setCallModal('audio')}
                title="Start Voice Call"
                className="w-9 h-9 rounded-full hover:bg-[#3a3b3c] text-blue-400 flex items-center justify-center transition-colors"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setCallModal('video')}
                title="Start Video Call"
                className="w-9 h-9 rounded-full hover:bg-[#3a3b3c] text-blue-400 flex items-center justify-center transition-colors"
              >
                <Video className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isFullscreen ? 'bg-blue-600 text-white shadow-glow' : 'hover:bg-[#3a3b3c] text-blue-400'
                }`}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={() => setShowInfoSidebar(!showInfoSidebar)}
                title="Conversation & Order Details"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  showInfoSidebar ? 'bg-blue-600 text-white' : 'hover:bg-[#3a3b3c] text-blue-400'
                }`}
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Pinned Order Announcement Header (Matching Messenger image's pinned link!) */}
          {activeOrder && (
            <div className="bg-[#1f2022] border-b border-[#2f3031] px-4 py-2 flex items-center justify-between text-xs text-[#b0b3b8] shrink-0">
              <div className="flex items-center gap-2 truncate">
                <Pin className="w-3.5 h-3.5 text-blue-400 shrink-0 rotate-45" />
                <span className="font-semibold text-white truncate">
                  Order #{activeOrder.receiptNo || activeOrder.id.slice(-8)}
                </span>
                <span className="text-emerald-400 font-bold shrink-0">
                  {formatPeso(activeOrder.total)}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] uppercase shrink-0">
                  {activeOrder.status}
                </span>
                <span className="hidden md:inline text-gray-400 truncate">
                  · {activeOrder.buyerName} ({activeOrder.address})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPinnedDetails(!showPinnedDetails)}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 shrink-0 font-medium ml-2"
              >
                <span>{showPinnedDetails ? 'Hide' : 'Crates & Drop-off'}</span>
                {showPinnedDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Collapsible Order Drawer */}
          {showPinnedDetails && activeOrder && (
            <div className="bg-[#242526] border-b border-[#2f3031] p-4 text-xs animate-fade-down text-[#e4e6eb] space-y-3">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="bg-[#18191a] p-3 rounded-xl border border-[#3a3b3c]">
                  <p className="text-[10px] text-[#b0b3b8] font-bold uppercase">Buyer Drop-off</p>
                  <p className="font-semibold text-white mt-0.5">{activeOrder.buyerName}</p>
                  <p className="text-gray-400 truncate">{activeOrder.buyerPhone || 'No phone'}</p>
                  <p className="text-gray-400 truncate mt-1">{activeOrder.address}</p>
                </div>
                <div className="bg-[#18191a] p-3 rounded-xl border border-[#3a3b3c]">
                  <p className="text-[10px] text-[#b0b3b8] font-bold uppercase">Produce Items ({activeOrder.items?.length || 0})</p>
                  <div className="mt-1 space-y-1 max-h-24 overflow-y-auto">
                    {activeOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-gray-300">
                        <span className="truncate">{item.name} × {item.quantity} {item.unit || 'kg'}</span>
                        <span className="font-semibold text-white ml-2">{formatPeso(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#18191a] p-3 rounded-xl border border-[#3a3b3c] flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-[#b0b3b8] font-bold uppercase">Order Total & Status</p>
                    <p className="text-lg font-black text-emerald-400">{formatPeso(activeOrder.total)}</p>
                    <p className="text-[11px] text-gray-400">{activeOrder.payment} · {activeOrder.status}</p>
                  </div>
                  <Link
                    to={`/orders/${activeOrder.id}/receipt`}
                    className="inline-flex items-center gap-1 text-blue-400 hover:underline font-semibold mt-2"
                  >
                    View Official Receipt <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MESSAGES STREAM (Messenger Chat Bubbles)                  */}
          {/* ======================================================== */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#18191a]">
            {/* Ambient Watermark or Intro */}
            <div className="text-center py-4 text-[#8a8d91]">
              <div className="w-16 h-16 rounded-full bg-[#242526] border border-[#3a3b3c] mx-auto flex items-center justify-center text-emerald-400 mb-2">
                <Store className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">{activeThread?.title}</h3>
              <p className="text-xs text-[#b0b3b8] max-w-sm mx-auto mt-1">
                Direct encrypted conversation between buyer, seller, and delivery rider.
              </p>
              <div className="text-[11px] text-[#8a8d91] font-semibold tracking-wider uppercase mt-4">
                Today
              </div>
            </div>

            {/* Bubble list */}
            {activeMessages.map((msg) => {
              const isMe = user && (msg.fromUserId === user.id || msg.fromName.toLowerCase().includes(user.firstName?.toLowerCase() || ''))
              const currentReaction = reactions[msg.id]

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender Name above incoming bubble (Messenger style) */}
                  {!isMe && (
                    <span className="text-[11px] font-semibold text-[#b0b3b8] mb-1 ml-10 flex items-center gap-1.5">
                      {msg.fromName}
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#242526] text-emerald-300 uppercase">
                        {msg.fromRole}
                      </span>
                    </span>
                  )}

                  <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                    {/* Left avatar for incoming */}
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mb-1">
                        {msg.fromName.charAt(0)}
                      </div>
                    )}

                    <div className="relative">
                      {/* Quoted Message / Replying To Block (just like in the image!) */}
                      {msg.body.startsWith('↩') && (
                        <div className="mb-1 text-xs text-[#b0b3b8] italic flex items-center gap-1 pl-1">
                          <Reply className="w-3 h-3 text-blue-400" />
                          <span>Replying to previous update</span>
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words shadow-sm ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-[#3a3b3c] text-[#f0f2f5] rounded-bl-sm'
                        }`}
                      >
                        {msg.body}
                      </div>

                      {/* Reaction display badge if any */}
                      {currentReaction && (
                        <span className="absolute -bottom-2 right-2 bg-[#242526] border border-[#3a3b3c] rounded-full px-1.5 py-0.5 text-xs shadow-md">
                          {currentReaction}
                        </span>
                      )}
                    </div>

                    {/* Quick Action buttons on hover: Reply & React */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity self-center text-[#b0b3b8]">
                      <button
                        type="button"
                        onClick={() => setReplyingTo({ id: msg.id, fromName: msg.fromName, body: msg.body })}
                        title="Reply"
                        className="p-1 rounded-full hover:bg-[#3a3b3c] hover:text-white"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleReaction(msg.id, '❤️')}
                        title="Heart"
                        className="p-1 rounded-full hover:bg-[#3a3b3c] hover:text-red-400"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Message footer: timestamp and SMS badge */}
                  <div className={`flex items-center gap-1.5 text-[10px] text-[#8a8d91] mt-1 ${isMe ? 'mr-1' : 'ml-10'}`}>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>·</span>
                    <span className="capitalize">{msg.channel === 'sms' ? '📱 SMS' : '⚡ In-App'}</span>
                    {isMe && (
                      <span className="flex items-center text-blue-400 ml-1">
                        <CheckCheck className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Replying To Banner (Messenger style) */}
          {replyingTo && (
            <div className="px-4 py-2 bg-[#242526] border-t border-[#3a3b3c] flex items-center justify-between text-xs text-[#b0b3b8]">
              <div className="flex items-center gap-2 truncate">
                <Reply className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate">
                  Replying to <strong className="text-white">{replyingTo.fromName}</strong>: "{replyingTo.body}"
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-gray-400 hover:text-white ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Emoji Bar (Popup) */}
          {showEmojiBar && (
            <div className="px-4 py-2 bg-[#242526] border-t border-[#3a3b3c] flex items-center gap-3 overflow-x-auto">
              <span className="text-xs text-[#b0b3b8] font-bold">Quick react:</span>
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendMessage(emoji)}
                  className="text-lg hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* ======================================================== */}
          {/* BOTTOM INPUT BAR (Messenger Dark Pill Bar)               */}
          {/* ======================================================== */}
          <footer className="p-3 sm:p-4 bg-[#242526] border-t border-[#2f3031] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2 sm:gap-3"
            >
              {/* Plus (+) Quick Action Button */}
              <button
                type="button"
                onClick={() => setShowTemplatesModal(true)}
                title="Quick Harvest Templates"
                className="w-9 h-9 rounded-full bg-[#3a3b3c] hover:bg-[#4e4f50] text-blue-400 flex items-center justify-center shrink-0 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Photo Attachment Icon */}
              <button
                type="button"
                onClick={() => handleSendMessage('📸 [Crate inspection photo attached]')}
                title="Attach photo"
                className="w-9 h-9 rounded-full hover:bg-[#3a3b3c] text-blue-400 flex items-center justify-center shrink-0 transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Quick Preset / Sticker Icon */}
              <button
                type="button"
                onClick={() => setShowEmojiBar(!showEmojiBar)}
                title="Stickers / Emojis"
                className="w-9 h-9 rounded-full hover:bg-[#3a3b3c] text-blue-400 flex items-center justify-center shrink-0 transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Rounded Messenger Pill Input ("Aa") */}
              <div className="flex-1 relative flex items-center bg-[#3a3b3c] rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <input
                  type="text"
                  placeholder={
                    activeThread
                      ? `Aa (Message ${activeThread.title.split(' ')[0]}...)`
                      : 'Aa'
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full bg-transparent text-white text-sm outline-none placeholder-[#b0b3b8] pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiBar(!showEmojiBar)}
                  className="absolute right-3 text-[#b0b3b8] hover:text-white"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>

              {/* Thumbs Up (Like) or Send Button */}
              {inputText.trim().length > 0 ? (
                <button
                  type="submit"
                  title="Send message"
                  className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickLike}
                  title="Send Thumbs Up"
                  className="w-9 h-9 rounded-full hover:bg-[#3a3b3c] text-blue-500 hover:text-blue-400 flex items-center justify-center shrink-0 transition-transform active:scale-125"
                >
                  <ThumbsUp className="w-5 h-5" />
                </button>
              )}
            </form>
          </footer>
        </main>

        {/* ======================================================== */}
        {/* RIGHT INFO SIDEBAR (Toggled by info button)              */}
        {/* ======================================================== */}
        {showInfoSidebar && (
          <aside className="w-80 bg-[#242526] border-l border-[#2f3031] flex flex-col p-4 overflow-y-auto messenger-scrollbar h-full shrink-0 animate-fade-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#3a3b3c]">
              <h3 className="font-bold text-white text-sm">Thread Details</h3>
              <button
                type="button"
                onClick={() => setShowInfoSidebar(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-6 border-b border-[#3a3b3c]">
              <img
                src={activeThread?.avatar || '/images/farm.jpg'}
                alt=""
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-emerald-500/50 mb-2"
              />
              <h4 className="font-bold text-white text-base">{activeThread?.title}</h4>
              <p className="text-xs text-emerald-400 capitalize">{activeThread?.role} Participant</p>
            </div>

            {/* Quick Actions */}
            <div className="py-4 border-b border-[#3a3b3c] space-y-2">
              <p className="text-[10px] text-[#b0b3b8] font-bold uppercase tracking-wider">Quick Actions</p>
              <button
                type="button"
                onClick={() => setCallModal('audio')}
                className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#3a3b3c] text-sm text-[#e4e6eb] flex items-center gap-2.5 transition-colors"
              >
                <Phone className="w-4 h-4 text-blue-400" /> Call on Phone
              </button>
              <button
                type="button"
                onClick={() => setCallModal('video')}
                className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#3a3b3c] text-sm text-[#e4e6eb] flex items-center gap-2.5 transition-colors"
              >
                <Video className="w-4 h-4 text-blue-400" /> Start Video Inspection
              </button>
            </div>

            {/* Active Order Summary */}
            {activeOrder && (
              <div className="py-4 space-y-3">
                <p className="text-[10px] text-[#b0b3b8] font-bold uppercase tracking-wider">Active Harvest Order</p>
                <div className="bg-[#18191a] p-3 rounded-xl border border-[#3a3b3c] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Order ID</span>
                    <span className="font-mono font-bold text-white">#{activeOrder.receiptNo || activeOrder.id.slice(-6)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Status</span>
                    <span className="font-bold text-emerald-400 uppercase text-[10px]">{activeOrder.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Total</span>
                    <span className="font-bold text-white">{formatPeso(activeOrder.total)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#2f3031]">
                    <p className="text-[11px] text-gray-400 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>{activeOrder.address}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ======================================================== */}
      {/* QUICK TEMPLATES MODAL (+)                                */}
      {/* ======================================================== */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#242526] border border-[#3a3b3c] rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#3a3b3c]">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Agricultural Quick Updates</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplatesModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#b0b3b8]">
              Select a standard one-click update for instant SMS and in-app synchronization:
            </p>
            <div className="space-y-2">
              {QUICK_AGRICULTURAL_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(tmpl)}
                  className="w-full text-left p-3 rounded-2xl bg-[#3a3b3c]/60 hover:bg-[#3a3b3c] text-sm text-[#e4e6eb] hover:text-white transition-all border border-[#444546] flex items-center justify-between group"
                >
                  <span className="pr-2">{tmpl}</span>
                  <Send className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CALL SIMULATOR MODAL (Voice / Video)                     */}
      {/* ======================================================== */}
      {callModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#242526] border border-[#3a3b3c] rounded-3xl max-w-sm w-full p-8 text-center text-white shadow-2xl space-y-6">
            <div className="relative mx-auto w-24 h-24">
              <img
                src={activeThread?.avatar || '/images/farm.jpg'}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 animate-pulse"
              />
              <span className="w-5 h-5 bg-emerald-500 border-2 border-[#242526] rounded-full absolute bottom-1 right-1" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{activeThread?.title}</h3>
              <p className="text-xs text-emerald-400 mt-1">
                {callModal === 'video' ? 'Connecting live crop video stream...' : 'Calling via cellular carrier...'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {activeThread?.targetPhone || '+63 936 389 4541'}
              </p>
            </div>
            <div className="flex justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setCallModal(null)}
                className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 font-bold text-sm shadow-lg transition-transform active:scale-95"
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessagesPage
