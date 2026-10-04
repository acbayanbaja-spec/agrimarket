import { FileText, CheckCircle2, Package, Truck, Home } from 'lucide-react'
import type { Order } from '../context/StoreContext'

const steps: Array<{ key: Order['status']; label: string; icon: typeof FileText }> = [
  { key: 'Pending', label: 'Order Placed', icon: FileText },
  { key: 'Confirmed', label: 'Farm Confirmed', icon: Package },
  { key: 'Shipped', label: 'Rider Picked Up', icon: CheckCircle2 },
  { key: 'Out for delivery', label: 'In Transit', icon: Truck },
  { key: 'Delivered', label: 'Delivered', icon: Home },
]

const descriptions: Record<Order['status'], string> = {
  Pending: 'Order transmitted to the SOCCSKSARGEN farm stall. Awaiting farmer preparation.',
  Confirmed: 'Harvest confirmed and packed into crates. Local delivery rider dispatched for pickup.',
  Shipped: 'Rider collected fresh crates from the farm stall and departed for regional hub.',
  'Out for delivery': 'Rider is on the final drop-off route in SOCCSKSARGEN. Please have cash/GCash ready.',
  Delivered: 'Harvest safely received! Earned loyalty AgriCoins credited to your account.',
}

export const OrderTimeline = ({ status }: { status: Order['status'] }) => {
  const activeIndex = steps.findIndex((s) => s.key === status)
  const safeActive = activeIndex >= 0 ? activeIndex : 0

  return (
    <div className="bg-gradient-to-b from-gray-50/80 to-white rounded-2xl p-3.5 sm:p-4 border border-gray-100/90 shadow-sm">
      {/* Shopee & Lazada Stepper Line */}
      <div className="relative flex items-center justify-between mb-3 px-2 sm:px-4">
        {/* Continuous progress track */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-gray-200 z-0">
          <div
            className="h-full bg-gradient-to-r from-primary-600 to-emerald-500 transition-all duration-700 rounded-full"
            style={{ width: `${(safeActive / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Milestone Steps */}
        {steps.map((step, index) => {
          const isDone = index < safeActive
          const isCurrent = index === safeActive
          const Icon = step.icon

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCurrent
                    ? 'bg-primary-600 text-white shadow-md ring-4 ring-primary-100 scale-110'
                    : isDone
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-gray-400 border-2 border-gray-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span
                className={`mt-1.5 text-[10px] sm:text-[11px] font-semibold text-center whitespace-nowrap hidden sm:block ${
                  isCurrent
                    ? 'text-primary-800 font-bold'
                    : isDone
                    ? 'text-emerald-700'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Current Step Description Card */}
      <div className="bg-primary-50/70 border border-primary-100 rounded-xl px-3 py-2 text-center text-xs text-primary-900 font-medium flex items-center justify-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>{descriptions[status] || descriptions.Pending}</span>
      </div>
    </div>
  )
}

export default OrderTimeline
