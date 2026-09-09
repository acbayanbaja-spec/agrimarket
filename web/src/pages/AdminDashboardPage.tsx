import { Link } from 'react-router-dom'
import { useStore, type Order } from '../context/StoreContext'
import { formatPeso } from '../lib/utils'

const statuses: Order['status'][] = ['Pending', 'Confirmed', 'Shipped', 'Delivered']

const AdminDashboardPage = () => {
  const { products, orders, applications, reviewApplication, removeProduct, updateOrderStatus } = useStore()
  const pendingApps = applications.filter((item) => item.status === 'Pending')
  const revenue = orders.reduce((sum, order) => sum + order.total, 0)

  return (
    <div className="page-shell space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Admin dashboard</h1>
        <p className="text-gray-600 mt-2">Review sellers, listings, and marketplace orders.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Listings', value: products.length },
          { label: 'Orders', value: orders.length },
          { label: 'Pending sellers', value: pendingApps.length },
          { label: 'GMV', value: formatPeso(revenue) },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Seller applications</h2>
        {applications.length === 0 ? (
          <p className="text-gray-600">No applications yet.</p>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <article key={application.id} className="border-b border-gray-100 pb-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-semibold">{application.farmName}</p>
                    <p className="text-sm text-gray-500">{application.name} · {application.location}</p>
                    <p className="text-sm text-gray-700 mt-2">{application.description}</p>
                  </div>
                  <span className="text-sm font-semibold">{application.status}</span>
                </div>
                {application.status === 'Pending' && (
                  <div className="flex gap-2 mt-3">
                    <button type="button" className="btn-primary py-2" onClick={() => reviewApplication(application.id, 'Approved')}>Approve</button>
                    <button type="button" className="btn-outline py-2" onClick={() => reviewApplication(application.id, 'Rejected')}>Reject</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Orders</h2>
        {orders.length === 0 ? (
          <p className="text-gray-600">No marketplace orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{order.id} · {formatPeso(order.total)}</p>
                  <p className="text-sm text-gray-500">{order.address}</p>
                </div>
                <select className="input-field w-44" value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value as Order['status'])}>
                  {statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Catalog moderation</h2>
        <ul className="space-y-3">
          {products.map((product) => (
            <li key={product.id} className="flex items-center justify-between gap-3">
              <Link to={`/products/${product.id}`} className="hover:text-primary-700">{product.name}</Link>
              <button type="button" className="text-sm text-red-600" onClick={() => removeProduct(product.id)}>Unlist</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default AdminDashboardPage
