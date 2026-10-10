import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import Seo from '../components/Seo'

const MessagesPage = () => {
  const { messages, orders, sendSms, myListings } = useStore()
  const { user, hasRole } = useAuth()
  const [body, setBody] = useState('Your harvest order is confirmed and being prepared fresh.')
  const [notice, setNotice] = useState('')

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

  const [orderId, setOrderId] = useState(relevantOrders.find((order) => order.status !== 'Delivered')?.id || relevantOrders[0]?.id || '')
  const activeOrder = relevantOrders.find((order) => order.id === orderId) || relevantOrders[0]

  const mine = useMemo(
    () =>
      messages.filter((item) => {
        if (activeOrder) return item.orderId === activeOrder.id
        if (!user) return true
        return item.toUserId === user.id || item.fromUserId === user.id
      }),
    [messages, user, activeOrder]
  )

  const send = (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || !activeOrder || !body.trim()) return
    const isSeller = hasRole('seller')
    const isDelivery = hasRole('delivery') || hasRole('admin')
    const fromRole = isSeller ? 'seller' : isDelivery ? 'delivery' : 'buyer'
    const toBuyer = isDelivery || isSeller
    const phone = toBuyer ? activeOrder.buyerPhone : user.phone
    const sent = sendSms({
      orderId: activeOrder.id,
      fromRole,
      fromName: `${user.firstName} ${user.lastName}`,
      fromUserId: user.id,
      toUserId: toBuyer ? activeOrder.userId : (activeOrder.driverId || 4),
      phone,
      body: body.trim(),
    })
    setNotice(
      phone
        ? `SMS ${sent.status} to ${phone}. It also appears in notifications.`
        : 'Saved in-app. Add a mobile number to send a true SMS copy.'
    )
    setBody('')
  }

  return (
    <div className="page-shell max-w-2xl">
      <Seo title="SMS & messages" description="Sellers and riders text buyers about harvest prep and delivery windows." path="/messages" />
      <h1 className="text-4xl font-bold mb-2">SMS & Chat inbox</h1>
      <p className="text-gray-600 mb-6">Sellers and delivery partners can coordinate order prep and dispatch with registered buyers.</p>
      <div className="card space-y-4">
        {relevantOrders.length > 0 && (
          <label className="block text-sm">
            <span className="label">Order thread</span>
            <select className="input-field" value={activeOrder?.id || ''} onChange={(event) => setOrderId(event.target.value)}>
              {relevantOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id} · {order.buyerName} · {order.status}
                </option>
              ))}
            </select>
          </label>
        )}
        {activeOrder && (
          <p className="text-sm text-gray-500">
            {activeOrder.buyerName} · {activeOrder.buyerPhone || 'no phone on file'} · {activeOrder.address}
          </p>
        )}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {mine.length === 0 && <p className="text-sm text-gray-500">No messages yet. Send an update about harvest packing or delivery details.</p>}
          {mine.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl px-4 py-3 ${
                item.fromRole === 'seller' ? 'bg-emerald-50 border border-emerald-100' : item.fromRole === 'delivery' ? 'bg-primary-50' : 'bg-gray-50'
              }`}
            >
              <p className="text-xs text-gray-500">
                <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mr-1">[{item.fromRole}]</span>
                {item.fromName} · {item.orderId} · {item.phone || 'in-app'} · {item.channel === 'sms' ? 'SMS' : 'app'} · {item.status || 'sent'}
              </p>
              <p className="mt-1 text-sm text-gray-900">{item.body}</p>
            </div>
          ))}
        </div>
        <form onSubmit={send} className="space-y-3">
          <textarea className="input-field" rows={3} value={body} onChange={(event) => setBody(event.target.value)} />
          <button type="submit" className="btn-primary" disabled={!user || !activeOrder || !body.trim()}>
            {hasRole('seller') ? 'Send message to Buyer' : hasRole('delivery') ? 'SMS the buyer' : 'Reply to seller / rider'}
          </button>
        </form>
        {notice && <p className="text-sm text-primary-800">{notice}</p>}
      </div>
    </div>
  )
}

export default MessagesPage
