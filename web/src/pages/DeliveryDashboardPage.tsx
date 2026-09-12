import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, type Order } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { formatPeso } from '../lib/utils'
import Seo from '../components/Seo'

const statuses: Order['status'][] = ['Pending', 'Confirmed', 'Shipped', 'Out for delivery', 'Delivered']

const DeliveryDashboardPage = () => {
  const { orders, updateOrderStatus, sendSms, messages } = useStore()
  const { user, hasRole } = useAuth()
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [flash, setFlash] = useState<Record<string, string>>({})

  const jobs = useMemo(() => {
    const mine = orders.filter((order) => {
      if (hasRole('admin')) return true
      if (!user) return false
      return order.driverId === user.id
    })
    return [...mine].sort((a, b) => Number(a.status === 'Delivered') - Number(b.status === 'Delivered'))
  }, [orders, user, hasRole])

  const pingBuyer = (order: Order) => {
    const body = notes[order.id] || 'Good day po! Your harvest is out for delivery.'
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
    if (order.status === 'Pending' || order.status === 'Confirmed' || order.status === 'Shipped') {
      updateOrderStatus(order.id, 'Out for delivery')
    }
    setFlash((current) => ({
      ...current,
      [order.id]: `SMS ${sent.status} to ${order.buyerPhone}. A copy is in the inbox and the buyer’s notifications.`,
    }))
  }

  return (
    <div className="page-shell space-y-6">
      <Seo title="Delivery desk" description="Riders update status and SMS buyers with ETAs." path="/delivery" />
      <div>
        <h1 className="text-4xl font-bold">Delivery desk</h1>
        <p className="text-gray-600 mt-2">GPS the drop-off, ping the buyer by SMS, and mark crates delivered.</p>
      </div>
      {jobs.length === 0 && (
        <div className="card text-center">
          <p className="text-gray-600">No assigned crates yet. New COD and GCash orders land here once a seller confirms them.</p>
        </div>
      )}
      {jobs.map((order) => {
        const thread = messages.filter((item) => item.orderId === order.id)
        return (
          <article key={order.id} className="card space-y-3">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-semibold">{order.id} · {order.buyerName}</p>
                <p className="text-sm text-gray-500">{order.address} · {order.buyerPhone || 'no mobile on file'}</p>
                <p className="text-sm">{formatPeso(order.total)} · {order.payment}</p>
              </div>
              <select
                className="input-field w-52"
                value={order.status}
                onChange={(event) => updateOrderStatus(order.id, event.target.value as Order['status'])}
              >
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
            {order.lat && order.lng && (
              <iframe title="Drop-off" className="w-full h-40 rounded-xl" src={`https://maps.google.com/maps?q=${order.lat},${order.lng}&z=12&output=embed`} />
            )}
            {thread.length > 0 && (
              <p className="text-sm text-gray-600">Last SMS: {thread[thread.length - 1].body}</p>
            )}
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
