import React, { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useStore, type Order } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'

type Props = {
  isOpen: boolean
  order: Order | null
  onClose: () => void
  onSuccess?: (orderId: string) => void
}

const REASONS = [
  'Changed my mind',
  'Need to modify produce items or quantity',
  'Incorrect drop-off address',
  'Delivery time won\'t work for me',
  'Found alternative harvest / price',
  'Ordered by mistake',
  'Other reasons',
]

export const CancelOrderModal: React.FC<Props> = ({ isOpen, order, onClose, onSuccess }) => {
  const { cancelOrder } = useStore()
  const { toast } = useToast()
  const [selectedReason, setSelectedReason] = useState(REASONS[0])
  const [customNote, setCustomNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !order) return null

  // Double check that order can be cancelled (only if not already farm-confirmed)
  const isPending = order.status === 'Pending'

  const handleCancel = async () => {
    if (!isPending) {
      toast('This order has already been confirmed by the farm stall and cannot be cancelled directly.')
      onClose()
      return
    }

    setIsSubmitting(true)
    const reasonText = customNote.trim() ? `${selectedReason} - ${customNote.trim()}` : selectedReason
    try {
      await cancelOrder(order.id, reasonText)
      toast(`Order #${order.id} was cancelled. Reserved stock has been restored.`)
      if (onSuccess) onSuccess(order.id)
      onClose()
    } catch {
      toast('Failed to cancel order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 animate-fade-in"
        aria-label="Close"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl p-6 animate-scale-up z-10 space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cancel Order?</h2>
            <p className="text-xs text-gray-500">Order #{order.id} · {order.receiptNo}</p>
          </div>
        </div>

        {!isPending ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            <p className="font-semibold">Order already confirmed</p>
            <p className="text-xs mt-1 text-amber-800">
              The farm stall has already confirmed or begun packing this harvest. You cannot cancel directly, but you can message the seller for assistance.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 leading-relaxed">
              Because the farm stall has not yet confirmed this harvest, you can cancel freely. Your reserved produce will be returned to the stall and no rider will be dispatched.
            </p>

            <div>
              <label htmlFor="cancel-reason" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Reason for Cancellation
              </label>
              <select
                id="cancel-reason"
                className="input-field text-sm"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
              >
                {REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="custom-notes" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Additional Notes (Optional)
              </label>
              <textarea
                id="custom-notes"
                rows={2}
                className="input-field text-sm"
                placeholder="Give details to help the farm stall understand..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                className="btn-outline flex-1 py-2.5 font-semibold"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-2xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Yes, Cancel</span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CancelOrderModal
