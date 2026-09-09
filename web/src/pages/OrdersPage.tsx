import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { formatPeso } from '../lib/utils'

const OrdersPage = () => {
  const { myOrders } = useStore()

  return (
    <div className="page-shell">
      <h1 className="text-4xl font-bold mb-2">My orders</h1>
      <p className="text-gray-600 mb-8">Track harvests heading to your door.</p>
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
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <span className="rounded-full bg-primary-50 text-primary-800 px-3 py-1 text-sm font-semibold">{order.status}</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-1 mb-4">
                {order.items.map((item) => (
                  <li key={item.productId}>{item.name} × {item.quantity}</li>
                ))}
              </ul>
              <p className="text-sm text-gray-500">{order.address} · {order.payment}</p>
              <p className="font-bold mt-3">{formatPeso(order.total)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrdersPage
