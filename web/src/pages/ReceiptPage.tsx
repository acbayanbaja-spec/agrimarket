import { Link, useParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { formatPeso } from '../lib/utils'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'

const ReceiptPage = () => {
  const { id } = useParams()
  const { orders } = useStore()
  const order = orders.find((item) => item.id === id)

  if (!order) {
    return (
      <div className="page-shell text-center">
        <h1 className="text-3xl font-bold mb-3">Receipt not found</h1>
        <Link to="/orders" className="btn-primary">Back to orders</Link>
      </div>
    )
  }

  return (
    <div className="page-shell max-w-2xl">
      <Seo title={`Receipt ${order.receiptNo}`} description="Printable AgriMarket purchase receipt." path={`/orders/${order.id}/receipt`} />
      <div className="card print:shadow-none" id="receipt">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-primary-700 font-semibold">AgriMarket</p>
            <h1 className="text-3xl font-bold">Official receipt</h1>
            <p className="text-gray-500 text-sm mt-1">{order.receiptNo}</p>
          </div>
          <button type="button" className="btn-outline print:hidden" onClick={() => window.print()}>Print</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
          <p><span className="text-gray-500">Sold to</span><br />{order.buyerName}<br />{order.buyerPhone}</p>
          <p><span className="text-gray-500">Ship to</span><br />{order.address}</p>
          <p><span className="text-gray-500">Payment</span><br />{order.payment} {order.paymentRef ? `· ${order.paymentRef}` : ''}</p>
          <p><span className="text-gray-500">Date</span><br />{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <table className="w-full mt-6 text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Item</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.productId} className="border-b border-gray-100">
                <td className="py-3 flex items-center gap-2">
                  <ProductImage src={item.image} alt="" className="h-8 w-8 rounded object-cover" />
                  {item.name}
                </td>
                <td>{item.quantity}</td>
                <td>{formatPeso(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPeso(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{formatPeso(order.shippingFee)}</span></div>
          <div className="flex justify-between"><span>Shipping discount {order.couponCode ? `(${order.couponCode})` : ''}</span><span>-{formatPeso(order.shippingDiscount)}</span></div>
          <div className="flex justify-between"><span>Harvest points used on shipping</span><span>-{order.pointsRedeemed} pts</span></div>
          <div className="flex justify-between"><span>Harvest points earned</span><span>+{order.pointsEarned} pts</span></div>
          <div className="flex justify-between font-bold text-lg pt-2"><span>Total</span><span>{formatPeso(order.total)}</span></div>
        </div>
      </div>
    </div>
  )
}

export default ReceiptPage
