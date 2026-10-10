import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore, type Order } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { formatPeso } from '../lib/utils'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'
import OrderTimeline from '../components/OrderTimeline'

const OrdersPage = () => {
  const { myOrders } = useStore()
  const { hasRole } = useAuth()
  const isDelivery = hasRole('delivery')
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('status') || 'all'

  const filteredOrders = useMemo(() => {
    if (activeTab === 'to_pay' || activeTab === 'Pending') {
      return myOrders.filter((o) => o.status === 'Pending')
    }
    if (activeTab === 'to_ship' || activeTab === 'Confirmed') {
      return myOrders.filter((o) => o.status === 'Confirmed')
    }
    if (activeTab === 'to_receive' || activeTab === 'shipped' || activeTab === 'out_for_delivery') {
      return myOrders.filter((o) => o.status === 'Shipped' || o.status === 'Out for delivery')
    }
    if (activeTab === 'to_rate' || activeTab === 'Delivered') {
      return myOrders.filter((o) => o.status === 'Delivered')
    }
    return myOrders
  }, [myOrders, activeTab])

  const tabs = [
    { id: 'all', label: 'All', count: myOrders.length },
    { id: 'to_pay', label: 'To Pay', count: myOrders.filter((o) => o.status === 'Pending').length },
    { id: 'to_ship', label: 'To Ship', count: myOrders.filter((o) => o.status === 'Confirmed').length },
    { id: 'to_receive', label: 'To Receive', count: myOrders.filter((o) => o.status === 'Shipped' || o.status === 'Out for delivery').length },
    { id: 'to_rate', label: 'To Rate', count: myOrders.filter((o) => o.status === 'Delivered').length },
  ]

  return (
    <div className="page-shell">
      <Seo title="Purchase history" description="Track every harvest you bought, reprint receipts, and open rider messages." path="/orders" />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">My Purchases</h1>
          <p className="text-gray-600 text-sm mt-1">Receipts, regional drop-off status, and seller confirmation for every crate.</p>
        </div>
      </div>

      {/* Order Status Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar mb-6 pt-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSearchParams(tab.id === 'all' ? {} : { status: tab.id })}
            className={`pb-3 px-3 text-sm font-semibold whitespace-nowrap transition-colors relative ${
              activeTab === tab.id
                ? 'text-primary-700 border-b-2 border-primary-600 font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-primary-100 text-primary-800 font-bold' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4 font-medium">
            {activeTab === 'all'
              ? 'You have not placed an order yet.'
              : `No orders in "${tabs.find((t) => t.id === activeTab)?.label || activeTab}" right now.`}
          </p>
          {isDelivery ? (
            <Link to="/delivery" className="btn-primary">Open Delivery Desk</Link>
          ) : (
            <Link to="/marketplace" className="btn-primary">Shop fresh harvests</Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <article key={order.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-semibold text-lg">{order.id}</h2>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()} · {order.receiptNo}</p>
                </div>
                <span className="rounded-full bg-primary-50 text-primary-800 px-3 py-1 text-sm font-semibold">{order.status}</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-2 mb-4">
                {order.items.map((item) => (
                  <li key={item.productId} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <ProductImage src={item.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-medium text-gray-900">{item.name} × {item.quantity}</p>
                        <p className="text-xs text-gray-500">
                          Seller: <strong className="text-primary-800">{item.seller || 'Green Valley Farm'}</strong>
                        </p>
                      </div>
                    </div>
                    {item.pickupLocation && (
                      <span className="text-[11px] text-gray-400 font-medium">📍 {item.pickupLocation}</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500">{order.address} · {order.payment}{order.couponCode ? ` · ${order.couponCode}` : ''}</p>
              <p className="text-sm text-amber-800 mt-2">+{order.pointsEarned} pts earned{order.pointsRedeemed ? ` · ${order.pointsRedeemed} pts used on shipping` : ''}</p>
              <div className="mt-4"><OrderTimeline status={order.status} /></div>
              <p className="font-bold mt-3">{formatPeso(order.total)}</p>
              <div className="flex gap-3 mt-4">
                <Link to={`/orders/${order.id}/receipt`} className="btn-primary py-2">Receipt</Link>
                <Link to="/messages" className="btn-outline py-2">Rider SMS</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrdersPage
