import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { formatPeso } from '../lib/utils'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'

const OrdersPage = () => {
  const { myOrders } = useStore()

  return (
    <div className="page-shell">
      <Seo title="Purchase history" description="Track every harvest you bought, reprint receipts, and open rider messages." path="/orders" />
      <h1 className="text-4xl font-bold mb-2">Purchase history</h1>
      <p className="text-gray-600 mb-8">Receipts, payment method, and delivery status for every crate you ordered.</p>
      {myOrders.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-600 mb-4">You have not placed an order yet.</p>
          <Link to="/marketplace" className="btn-primary">Shop the marketplace</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myOrders.map((order) => (
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
                  <li key={item.productId} className="flex items-center gap-3">
                    <ProductImage src={item.image} alt="" className="h-10 w-10 rounded object-cover" />
                    {item.name} × {item.quantity}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500">{order.address} · {order.payment}{order.couponCode ? ` · ${order.couponCode}` : ''}</p>
              <p className="text-sm text-amber-800 mt-2">+{order.pointsEarned} pts earned{order.pointsRedeemed ? ` · ${order.pointsRedeemed} pts used on shipping` : ''}</p>
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
