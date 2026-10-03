import type { Order } from '../context/StoreContext'

const steps: Order['status'][] = ['Pending', 'Confirmed', 'Shipped', 'Out for delivery', 'Delivered']

const copy: Record<Order['status'], string> = {
  Pending: 'Waiting for the seller to confirm your harvest',
  Confirmed: 'Seller packed it. A SOCCSKSARGEN rider is notified to pick up',
  Shipped: 'Rider collected the crate from the farm stall',
  'Out for delivery': 'Rider is on the way to your drop-off',
  Delivered: 'Harvest received',
}

const OrderTimeline = ({ status }: { status: Order['status'] }) => {
  const active = steps.indexOf(status)
  return (
    <ol className="grid grid-cols-5 gap-1 text-[10px] sm:text-xs">
      {steps.map((step, index) => {
        const done = index <= active
        return (
          <li key={step} className="text-center">
            <span className={`mx-auto mb-1 block h-2 rounded-full ${done ? 'bg-primary-600' : 'bg-gray-200'}`} />
            <span className={done ? 'font-semibold text-primary-800' : 'text-gray-400'}>{step}</span>
          </li>
        )
      })}
      <li className="col-span-5 mt-2 text-center text-gray-600">{copy[status]}</li>
    </ol>
  )
}

export default OrderTimeline
