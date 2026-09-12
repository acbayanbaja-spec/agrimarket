import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import Seo from '../components/Seo'

const MessagesPage = () => {
  const { messages, orders, sendSms } = useStore()
  const { user, hasRole } = useAuth()
  const [body, setBody] = useState('On the way po. Please prepare payment.')
  const [notice, setNotice] = useState('')

  const relevantOrders = useMemo(() => {
    if (!user) return orders
    if (hasRole('admin')) return orders
    return orders.filter((order) => order.userId === user.id || order.driverId === user.id)
  }, [orders, user, hasRole])

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
    const toBuyer = hasRole('delivery') || hasRole('admin')
    const phone = toBuyer ? activeOrder.buyerPhone : user.phone
    const sent = sendSms({
      orderId: activeOrder.id,
      fromRole: toBuyer ? 'delivery' : 'buyer',
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
      <Seo title="SMS & messages" description="Riders text buyers about delivery windows. Messages also land in notifications." path="/messages" />
      <h1 className="text-4xl font-bold mb-2">SMS inbox</h1>
      <p className="text-gray-600 mb-6">Delivery partners can text the buyer’s registered mobile. A copy stays here and in notifications.</p>
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
          {mine.length === 0 && <p className="text-sm text-gray-500">No messages yet. Riders can ping you when a crate is on the road.</p>}
          {mine.map((item) => (
            <div key={item.id} className={`rounded-2xl px-4 py-3 ${item.fromRole === 'delivery' ? 'bg-primary-50' : 'bg-gray-50'}`}>
              <p className="text-xs text-gray-500">
                {item.fromName} · {item.orderId} · {item.phone || 'in-app'} · {item.channel === 'sms' ? 'SMS' : 'app'} · {item.status || 'sent'}
              </p>
              <p className="mt-1">{item.body}</p>
            </div>
          ))}
        </div>
        <form onSubmit={send} className="space-y-3">
          <textarea className="input-field" rows={3} value={body} onChange={(event) => setBody(event.target.value)} />
          <button type="submit" className="btn-primary" disabled={!user || !activeOrder || !body.trim()}>
            {hasRole('delivery') ? 'SMS the buyer' : 'Reply to rider'}
          </button>
        </form>
        {notice && <p className="text-sm text-primary-800">{notice}</p>}
      </div>
    </div>
  )
}

export default MessagesPage
