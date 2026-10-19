import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, MessageSquare, Truck, Smartphone, Thermometer } from 'lucide-react'
import { useStore, type Order } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { formatPeso } from '../lib/utils'
import { getEstimatedDeliveryDate } from '../lib/commerce'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'
import OrderTimeline from '../components/OrderTimeline'
import CancelOrderModal from '../components/CancelOrderModal'
import ContactSellerModal from '../components/ContactSellerModal'
import LoadSmsDispatchModal from '../components/LoadSmsDispatchModal'
import ColdChainMonitorModal from '../components/ColdChainMonitorModal'

const OrdersPage = () => {
  const { myOrders } = useStore()
  const { hasRole } = useAuth()
  const isDelivery = hasRole('delivery')
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('status') || 'all'

  const [selectedCancelOrder, setSelectedCancelOrder] = useState<Order | null>(null)
  const [selectedContactOrder, setSelectedContactOrder] = useState<Order | null>(null)
  const [selectedSmsOrder, setSelectedSmsOrder] = useState<Order | null>(null)
  const [selectedColdChainOrder, setSelectedColdChainOrder] = useState<Order | null>(null)

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
    if (activeTab === 'cancelled' || activeTab === 'Cancelled') {
      return myOrders.filter((o) => o.status === 'Cancelled')
    }
    return myOrders
  }, [myOrders, activeTab])

  const tabs = [
    { id: 'all', label: 'All', count: myOrders.length },
    { id: 'to_pay', label: 'To Pay / Pending', count: myOrders.filter((o) => o.status === 'Pending').length },
    { id: 'to_ship', label: 'To Ship', count: myOrders.filter((o) => o.status === 'Confirmed').length },
    { id: 'to_receive', label: 'To Receive', count: myOrders.filter((o) => o.status === 'Shipped' || o.status === 'Out for delivery').length },
    { id: 'to_rate', label: 'To Rate', count: myOrders.filter((o) => o.status === 'Delivered').length },
    { id: 'cancelled', label: 'Cancelled', count: myOrders.filter((o) => o.status === 'Cancelled').length },
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
          {filteredOrders.map((order) => {
            const isPending = order.status === 'Pending'
            const deliveryEstimate = getEstimatedDeliveryDate(order.createdAt)
            const mainSeller = order.items?.[0]?.seller || 'SOCCSKSARGEN Farm Partner'

            return (
              <article key={order.id} className="card animate-fade-up">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-lg text-gray-900">Order #{order.id}</h2>
                      <span className="text-xs font-normal text-gray-400">· {order.receiptNo}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Placed: {new Date(order.createdAt || Date.now()).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        order.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'Cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-primary-100 text-primary-800'
                      }`}
                    >
                      {order.status === 'Pending'
                        ? (() => {
                            const confirmedCount = (order.items || []).filter((i) => i.prepStatus === 'packed' || i.sellerConfirmed).length
                            const totalCount = (order.items || []).length
                            return confirmedCount > 0
                              ? `Pending (${confirmedCount}/${totalCount} confirmed)`
                              : 'Waiting on Farm Confirmation'
                          })()
                        : order.status}
                    </span>
                  </div>
                </div>

                <ul className="text-sm text-gray-700 space-y-2 mb-4">
                  {(order.items || []).map((item) => (
                    <li key={item.productId || Math.random()} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-gray-50/70 border border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <ProductImage src={item.image} alt="" className="h-11 w-11 rounded-lg object-cover shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{item.name} × {item.quantity}</p>
                          <p className="text-xs text-gray-500 truncate">
                            Farm Stall: <strong className="text-primary-800">{item.seller || mainSeller}</strong>
                          </p>
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.prepStatus === 'packed' || item.sellerConfirmed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.prepStatus === 'packing'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {item.prepStatus === 'packed' || item.sellerConfirmed
                                ? '✓ Confirmed & Packed by Farm'
                                : item.prepStatus === 'packing'
                                ? '⏳ Farm is Packing Produce'
                                : '⏳ Awaiting Seller Confirmation'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-gray-900">{formatPeso((Number(item.price) || 0) * (Number(item.quantity) || 1))}</p>
                        {item.pickupLocation && (
                          <span className="text-[10px] text-gray-400 block">📍 {item.pickupLocation}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Estimated Delivery Date Bar */}
                {order.status !== 'Cancelled' && (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 rounded-xl px-3 py-2 mb-4">
                    <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Estimated Delivery: <strong>{deliveryEstimate.dateRange}</strong></span>
                    <span className="text-emerald-400">·</span>
                    <span className="text-emerald-700">{deliveryEstimate.etaText}</span>
                  </div>
                )}

                <div className="text-xs text-gray-600 space-y-1 mb-3 bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                  <p><span className="font-semibold text-gray-700">Drop-off:</span> {order.address}</p>
                  <p><span className="font-semibold text-gray-700">Payment:</span> {order.payment}{order.paymentRef ? ` (Ref: ${order.paymentRef})` : ''}</p>
                  <p className="text-amber-800">
                    +{Number(order.pointsEarned) || 0} pts earned
                    {order.pointsRedeemed ? ` · ${order.pointsRedeemed} pts used on shipping` : ''}
                  </p>
                </div>

                <div className="mt-4">
                  <OrderTimeline status={order.status} statusHistory={order.statusHistory} />
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                  <div>
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total</span>
                    <p className="font-extrabold text-lg sm:text-xl text-primary-800">{formatPeso(Number(order.total) || 0)}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Contact Seller Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedContactOrder(order)}
                      className="btn-primary py-2 px-3 text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-xs"
                      title="Chat directly with the farm seller"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Contact Seller</span>
                    </button>

                    {/* Rider SMS / Load SMS Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedSmsOrder(order)}
                      className="btn-outline py-2 px-3 text-xs sm:text-sm font-semibold inline-flex items-center gap-1 text-primary-700 border-primary-200 hover:bg-primary-50"
                      title="Send SMS or Phone Load SMS to Rider Rico (09363894541)"
                    >
                      <Smartphone className="h-4 w-4 text-primary-700" />
                      <span>Rider SMS</span>
                    </button>

                    {/* Cold Chain Sensor Telemetry */}
                    <button
                      type="button"
                      onClick={() => setSelectedColdChainOrder(order)}
                      className="btn-outline py-2 px-3 text-xs sm:text-sm font-semibold inline-flex items-center gap-1 text-cyan-700 border-cyan-200 hover:bg-cyan-50"
                      title="Inspect cold chain transit temperature"
                    >
                      <Thermometer className="h-4 w-4 text-cyan-600" />
                      <span>Cold Chain</span>
                    </button>

                    {/* Receipt Link */}
                    <Link
                      to={`/orders/${order.id}/receipt`}
                      className="btn-outline py-2 px-3 text-xs sm:text-sm font-semibold"
                    >
                      Receipt
                    </Link>

                    {/* Cancel Order (Only enabled if order is NOT already farm-confirmed) */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => setSelectedCancelOrder(order)}
                        className="text-xs sm:text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 font-semibold transition-colors inline-flex items-center gap-1"
                        title="Cancel this order before the farm confirms"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={Boolean(selectedCancelOrder)}
        order={selectedCancelOrder}
        onClose={() => setSelectedCancelOrder(null)}
      />

      {/* Contact Seller Modal */}
      <ContactSellerModal
        isOpen={Boolean(selectedContactOrder)}
        order={selectedContactOrder}
        onClose={() => setSelectedContactOrder(null)}
      />

      {/* Cellular Load SMS Dispatch Modal */}
      <LoadSmsDispatchModal
        isOpen={Boolean(selectedSmsOrder)}
        onClose={() => setSelectedSmsOrder(null)}
        orderId={selectedSmsOrder?.id}
        recipientRole="delivery"
        defaultRecipientPhone="09363894541"
        recipientName="Rider Rico"
      />

      {/* Cold Chain Monitor Modal */}
      <ColdChainMonitorModal
        isOpen={Boolean(selectedColdChainOrder)}
        onClose={() => setSelectedColdChainOrder(null)}
        orderId={selectedColdChainOrder?.id}
        productName={selectedColdChainOrder?.items?.[0]?.name || 'Produce'}
        sellerLocation={selectedColdChainOrder?.items?.[0]?.pickupLocation || 'Polomolok, South Cotabato'}
      />
    </div>
  )
}

export default OrdersPage
