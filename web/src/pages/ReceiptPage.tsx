import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, MessageSquare, Printer, Truck } from 'lucide-react'
import { useStore, type Order } from '../context/StoreContext'
import { formatPeso } from '../lib/utils'
import { getEstimatedDeliveryDate } from '../lib/commerce'
import api from '../services/api'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'
import CancelOrderModal from '../components/CancelOrderModal'
import ContactSellerModal from '../components/ContactSellerModal'

const ReceiptPage = () => {
  const { id } = useParams()
  const { orders } = useStore()
  const [remoteOrder, setRemoteOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)

  const cleanId = String(id || '').trim().toLowerCase()

  // Match from store state
  const stateOrder = orders.find((item) => {
    const itemId = String(item.id || '').trim().toLowerCase()
    return itemId === cleanId
  })

  // Match from local storage fallback
  const localOrder: Order | undefined = (() => {
    try {
      const raw = localStorage.getItem('agrimarket.orders')
      if (raw) {
        const list: Order[] = JSON.parse(raw)
        return list.find((item) => String(item.id || '').trim().toLowerCase() === cleanId)
      }
    } catch {}
    return undefined
  })()

  const order = stateOrder || localOrder || remoteOrder

  useEffect(() => {
    if (!order && id) {
      setIsLoading(true)
      api
        .get<{ data?: { order?: Order } }>(`/orders/${id}`)
        .then((res: any) => {
          if (res.data?.data?.order) {
            setRemoteOrder(res.data.data.order)
          }
        })
        .catch(() => undefined)
        .finally(() => setIsLoading(false))
    }
  }, [id, order])

  if (!order) {
    return (
      <div className="page-shell text-center max-w-md mx-auto">
        <div className="card p-8 animate-fade-up">
          <h1 className="text-3xl font-bold mb-3">{isLoading ? 'Loading receipt...' : 'Receipt not found'}</h1>
          <p className="text-gray-600 mb-6">
            {isLoading
              ? 'Fetching order details from central database...'
              : `Order #${id} could not be located.`}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/orders" className="btn-primary">Back to orders</Link>
            <Link to="/marketplace" className="btn-outline">Browse produce</Link>
          </div>
        </div>
      </div>
    )
  }

  const items = Array.isArray(order.items) ? order.items : []
  const subtotal = Number(order.subtotal) || 0
  const shippingFee = Number(order.shippingFee) || 0
  const shippingDiscount = Number(order.shippingDiscount) || 0
  const pointsRedeemed = Number(order.pointsRedeemed) || 0
  const pointsEarned = Number(order.pointsEarned) || 0
  const total = Number(order.total) || (subtotal + shippingFee - shippingDiscount)
  const isPending = order.status === 'Pending'
  const deliveryEstimate = getEstimatedDeliveryDate(order.createdAt)

  return (
    <div className="page-shell max-w-2xl space-y-4">
      <Seo title={`Receipt ${order.receiptNo}`} description="Printable AgriMarket purchase receipt." path={`/orders/${order.id}/receipt`} />

      {/* Top Navigation & Status */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link to="/orders" className="text-sm font-semibold text-gray-600 hover:text-gray-900 inline-flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to My Purchases
        </Link>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              order.status === 'Delivered'
                ? 'bg-emerald-100 text-emerald-800'
                : order.status === 'Cancelled'
                ? 'bg-rose-100 text-rose-800'
                : isPending
                ? 'bg-amber-100 text-amber-800'
                : 'bg-primary-100 text-primary-800'
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <div className="card print:shadow-none animate-fade-up" id="receipt">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-primary-700 font-semibold tracking-wide uppercase">AgriMarket SOCCSKSARGEN</p>
            <h1 className="text-3xl font-bold mt-1">Official receipt</h1>
            <p className="text-gray-500 text-sm mt-1">{order.receiptNo} · Order #{order.id}</p>
          </div>
          <button
            type="button"
            className="btn-outline print:hidden inline-flex items-center gap-1.5"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>

        {/* Estimated Delivery Date on Receipt */}
        {order.status !== 'Cancelled' && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-xl py-2 px-3 mt-4 print:border-gray-200 print:bg-transparent">
            <Truck className="h-4 w-4 text-emerald-600 shrink-0 print:hidden" />
            <span>Estimated Delivery: <strong>{deliveryEstimate.dateRange}</strong></span>
            <span className="text-emerald-400 print:hidden">·</span>
            <span className="text-emerald-700 print:text-gray-600">{deliveryEstimate.etaText}</span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
          <p><span className="text-gray-500 block text-xs uppercase font-bold">Sold to</span>{order.buyerName || 'Buyer'}<br />{order.buyerPhone || 'Mobile on file'}</p>
          <p><span className="text-gray-500 block text-xs uppercase font-bold">Ship to</span>{order.address}</p>
          <p><span className="text-gray-500 block text-xs uppercase font-bold">Payment</span>{order.payment} {order.paymentRef ? `· Ref: ${order.paymentRef}` : ''}</p>
          <p><span className="text-gray-500 block text-xs uppercase font-bold">Date</span>{new Date(order.createdAt || Date.now()).toLocaleString()}</p>
        </div>

        <table className="w-full mt-6 text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200 text-gray-500">
              <th className="py-2.5 font-semibold">Item</th>
              <th className="py-2.5 font-semibold text-center">Qty</th>
              <th className="py-2.5 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const itemPrice = Number(item.price) || 0
              const itemQty = Number(item.quantity) || 1
              return (
                <tr key={item.productId || Math.random()}>
                  <td className="py-3 flex items-center gap-2">
                    <ProductImage src={item.image} alt="" className="h-8 w-8 rounded object-cover print:hidden" />
                    <div>
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <span className="block text-xs text-gray-500">{item.seller || 'Farm Stall'}</span>
                    </div>
                  </td>
                  <td className="text-center">{itemQty}</td>
                  <td className="text-right font-medium">{formatPeso(itemPrice * itemQty)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="mt-6 pt-4 border-t border-gray-100 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPeso(subtotal)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{formatPeso(shippingFee)}</span></div>
          {shippingDiscount > 0 && (
            <div className="flex justify-between text-primary-700"><span>Shipping discount {order.couponCode ? `(${order.couponCode})` : ''}</span><span>-{formatPeso(shippingDiscount)}</span></div>
          )}
          {pointsRedeemed > 0 && (
            <div className="flex justify-between text-amber-800"><span>Harvest points used on shipping</span><span>-{pointsRedeemed} pts</span></div>
          )}
          {pointsEarned > 0 && (
            <div className="flex justify-between text-amber-800"><span>Harvest points earned</span><span>+{pointsEarned} pts</span></div>
          )}
          <div className="flex justify-between font-bold text-lg pt-3 border-t text-gray-900">
            <span>Total</span>
            <span className="text-primary-800">{formatPeso(total)}</span>
          </div>
        </div>

        {/* Action Controls for Buyer */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={() => setContactModalOpen(true)}
            className="btn-primary py-2.5 px-4 font-semibold text-sm inline-flex items-center gap-2 shadow-xs"
          >
            <MessageSquare className="h-4 w-4" /> Contact Farm Seller
          </button>

          {isPending && (
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              className="text-xs sm:text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <AlertTriangle className="h-4 w-4" /> Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={cancelModalOpen}
        order={order}
        onClose={() => setCancelModalOpen(false)}
        onSuccess={() => {
          if (remoteOrder) setRemoteOrder({ ...remoteOrder, status: 'Cancelled' })
        }}
      />

      {/* Contact Seller Modal */}
      <ContactSellerModal
        isOpen={contactModalOpen}
        order={order}
        onClose={() => setContactModalOpen(false)}
      />
    </div>
  )
}

export default ReceiptPage
