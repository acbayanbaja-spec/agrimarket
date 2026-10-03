import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, type Order } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { formatPeso } from '../lib/utils'
import Seo from '../components/Seo'
import OrderTimeline from '../components/OrderTimeline'

const riderStatuses: Order['status'][] = ['Out for delivery', 'Delivered']

const DeliveryDashboardPage = () => {
  const { orders, updateOrderStatus, sendSms, messages } = useStore()
  const { user, hasRole } = useAuth()
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [flash, setFlash] = useState<Record<string, string>>({})

  const jobs = useMemo(() => {
    const mine = orders.filter((order) => {
      if (order.status === 'Pending') return false
      if (hasRole('admin')) return true
      if (!user) return false
      return order.driverId === user.id
    })
    return [...mine].sort((a, b) => Number(a.status === 'Delivered') - Number(b.status === 'Delivered'))
  }, [orders, user, hasRole])

  const pingBuyer = (order: Order) => {
    const body = notes[order.id] || 'Good day po! Your harvest is out for delivery across SOCCSKSARGEN.'
    if (!order.buyerPhone) {
      setFlash((current) => ({ ...current, [order.id]: 'No buyer mobile on this order.' }))
      return
    }
    const sent = sendSms({
      orderId: order.id,
      fromRole: 'delivery',
      fromName: user ? `${user.firstName} ${user.lastName}` : 'Rider',
      fromUserId: user?.id,
      toUserId: order.userId,
      phone: order.buyerPhone,
      body,
    })
    if (order.status === 'Confirmed' || order.status === 'Shipped') {
      updateOrderStatus(order.id, 'Out for delivery')
    }
    setFlash((current) => ({
      ...current,
      [order.id]: `SMS ${sent.status} to ${order.buyerPhone}. A copy is in the inbox and the buyer’s notifications.`,
    }))
  }

  return (
    <div className="page-shell space-y-6">
      <Seo title="Delivery desk" description="Riders pick up confirmed harvests and SMS buyers with ETAs." path="/delivery" />
      <div className="animate-fade-up">
        <h1 className="text-4xl font-bold">Delivery desk</h1>
        <p className="text-gray-600 mt-2">You only see crates after the seller confirms. Pickup the harvest, then mark out for delivery.</p>
      </div>
      {jobs.length === 0 && (
        <div className="card text-center">
          <p className="text-gray-600">No pickup jobs yet. New COD and GCash orders land here once a seller confirms them.</p>
        </div>
      )}
      {jobs.map((order) => {
        const thread = messages.filter((item) => item.orderId === order.id)
        const harvest = order.items.map((item) => `${item.quantity}× ${item.name} (${item.pickupLocation || item.seller})`).join(', ')
        return (
          <article key={order.id} className="card space-y-3 animate-fade-up">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-semibold">{order.id} · {order.buyerName}</p>
                <p className="text-sm text-gray-500">Drop-off: {order.address} · {order.buyerPhone || 'no mobile on file'}</p>
                <p className="text-sm text-gray-700 mt-1">Pickup: {harvest}</p>
                <p className="text-sm">{formatPeso(order.total)} · {order.payment}</p>
              </div>
              {order.status === 'Confirmed' && <span className="chip bg-amber-100 text-amber-900">Ready for pickup</span>}
            </div>
            <OrderTimeline status={order.status} />
            {order.lat && order.lng && (
              <iframe title="Drop-off" className="w-full h-40 rounded-xl" src={`https://maps.google.com/maps?q=${order.lat},${order.lng}&z=12&output=embed`} />
            )}
            {thread.length > 0 && (
              <p className="text-sm text-gray-600">Last SMS: {thread[thread.length - 1].body}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {(order.status === 'Confirmed' || order.status === 'Shipped') && (
                <button
                  type="button"
                  className="btn-primary py-2"
                  onClick={() => updateOrderStatus(order.id, 'Out for delivery')}
                >
                  Mark picked up
                </button>
              )}
              {riderStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`btn-outline py-2 ${order.status === status ? 'bg-primary-600 text-white border-primary-600' : ''}`}
                  onClick={() => updateOrderStatus(order.id, status)}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="input-field"
                value={notes[order.id] ?? 'Good day po! Your harvest is out for delivery.'}
                onChange={(event) => setNotes((current) => ({ ...current, [order.id]: event.target.value }))}
              />
              <button type="button" className="btn-primary" onClick={() => pingBuyer(order)}>
                SMS buyer
              </button>
              <Link to="/messages" className="btn-outline">Inbox</Link>
            </div>
            {flash[order.id] && <p className="text-sm text-primary-800">{flash[order.id]}</p>}
          </article>
        )
      })}
    </div>
  )
}

export default DeliveryDashboardPage
