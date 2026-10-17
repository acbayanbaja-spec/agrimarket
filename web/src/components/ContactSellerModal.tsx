import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Send, Store, X, ExternalLink } from 'lucide-react'
import { useStore, type Order } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

type Props = {
  isOpen: boolean
  order: Order | null
  onClose: () => void
}

const QUICK_QUESTIONS = [
  'When will my harvest be packed and ready?',
  'Can I update my delivery notes or address?',
  'Is the produce freshly harvested this morning?',
  'Please pack extra carefully.',
]

export const ContactSellerModal: React.FC<Props> = ({ isOpen, order, onClose }) => {
  const { messages, sendSms } = useStore()
  const { user } = useAuth()
  const { toast } = useToast()
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)

  const sellerName = order?.items?.[0]?.seller || 'Farm Partner Stall'
  const sellerLocation = order?.items?.[0]?.pickupLocation || 'SOCCSKSARGEN stall'
  const sellerUserId = Number(order?.items?.[0]?.sellerUserId) || 2

  const threadMessages = useMemo(() => {
    if (!order) return []
    return messages.filter((m) => m.orderId === order.id)
  }, [messages, order])

  if (!isOpen || !order) return null

  const handleSend = (contentToSend?: string) => {
    const body = (contentToSend || text).trim()
    if (!body || !user) return

    setIsSending(true)
    try {
      sendSms({
        orderId: order.id,
        fromRole: 'buyer',
        fromName: `${user.firstName} ${user.lastName}`,
        fromUserId: user.id,
        toUserId: sellerUserId,
        phone: order.buyerPhone || user.phone,
        body,
      })
      toast(`Message sent to ${sellerName}`)
      setText('')
    } catch {
      toast('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 animate-fade-in"
        aria-label="Close"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up z-10">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-primary-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-sm shrink-0">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{sellerName}</h2>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" title="Online" />
              </div>
              <p className="text-xs text-gray-500">
                Order <strong className="text-gray-700">#{order.id}</strong> · {sellerLocation}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Thread History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {threadMessages.length === 0 ? (
            <div className="text-center py-6">
              <div className="h-12 w-12 rounded-2xl bg-white border border-gray-200 text-primary-600 mx-auto flex items-center justify-center mb-2 shadow-xs">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Have questions about your order?</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                Chat directly with {sellerName} about harvest freshness, packaging notes, or delivery timing.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {threadMessages.map((msg) => {
                const isMe = msg.fromUserId === user?.id || msg.fromRole === 'buyer'
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        isMe
                          ? 'bg-primary-600 text-white rounded-br-xs shadow-xs'
                          : 'bg-white border border-gray-200/90 text-gray-900 rounded-bl-xs shadow-xs'
                      }`}
                    >
                      <p className="text-[11px] font-bold opacity-80 mb-0.5">
                        {isMe ? 'You' : `${msg.fromName} (${msg.fromRole})`}
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2.5 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider shrink-0 mr-1">Quick:</span>
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              disabled={isSending}
              className="text-xs font-medium text-gray-700 bg-gray-100 hover:bg-primary-50 hover:text-primary-800 border border-gray-200 rounded-full px-3 py-1 whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Input Footer */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Ask ${sellerName} about this order...`}
              className="input-field py-2.5 text-sm flex-1"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !text.trim()}
              className="btn-primary py-2.5 px-4 font-semibold inline-flex items-center gap-1.5 shrink-0 disabled:opacity-50 shadow-sm"
            >
              <span>Send</span>
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 pt-1">
            <span className="text-[11px] text-gray-400">Direct farm stall communication</span>
            <Link
              to={`/messages?orderId=${order.id}`}
              onClick={onClose}
              className="text-[11px] font-semibold text-primary-700 hover:underline inline-flex items-center gap-1"
            >
              Full Inbox <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactSellerModal
