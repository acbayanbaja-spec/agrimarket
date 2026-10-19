import React, { useState } from 'react'
import {
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  Phone,
  FileText,
  Sparkles,
  Send,
  HelpCircle,
  Coins,
} from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { formatPeso } from '../lib/utils'

type Props = {
  isOpen: boolean
  onClose: () => void
  productId?: string
  productName?: string
  sellerName?: string
  unit?: string
  currentPrice?: number
}

export const BulkQuotationModal = ({
  isOpen,
  onClose,
  productId = '',
  productName = 'Produce',
  sellerName = 'Farm Partner',
  unit = 'kg',
  currentPrice = 50,
}: Props) => {
  const { notify } = useStore()
  const { user } = useAuth()

  const [businessName, setBusinessName] = useState('')
  const [targetQuantity, setTargetQuantity] = useState(50)
  const [targetPricePerUnit, setTargetPricePerUnit] = useState(Math.round(currentPrice * 0.85))
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toISOString().slice(0, 10)
  })
  const [frequency, setFrequency] = useState<'One-time Spot Order' | 'Weekly Contract' | 'Bi-Weekly' | 'Monthly'>(
    'One-time Spot Order'
  )
  const [contactPhone, setContactPhone] = useState(user?.phone || '')
  const [notes, setNotes] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (!isOpen) return null

  const estimatedTotalBudget = targetQuantity * targetPricePerUnit

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Dispatch notification to seller and user
    notify({
      userId: 'all',
      title: 'B2B Wholesale Quotation Request',
      message: `${businessName || user?.firstName || 'Buyer'} requested quote for ${targetQuantity} ${unit} of ${productName} (${formatPeso(estimatedTotalBudget)}).`,
      href: '/seller-dashboard',
    })

    setIsSubmitted(true)
    window.setTimeout(() => {
      setIsSubmitted(false)
      onClose()
    }, 2500)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-200 animate-scale-up space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">B2B Wholesale Volume Quotation</h3>
              <p className="text-xs text-gray-500">Commercial farmgate purchase agreement</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="font-extrabold text-lg text-gray-900">Quotation Request Dispatched!</h4>
            <p className="text-xs text-gray-600 max-w-sm mx-auto">
              Your wholesale volume quote for <strong className="text-gray-900">{productName}</strong> has been transmitted directly to <strong>{sellerName}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">Target Produce:</span>
                <p className="font-extrabold text-sm text-gray-900">{productName}</p>
                <p className="text-[11px] text-gray-500">Seller: {sellerName}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-400">Standard Retail:</span>
                <p className="font-bold text-gray-800">{formatPeso(currentPrice)} / {unit}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Business / Establishment Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gensan Grill & Catering"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="input-field text-xs py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Contact Mobile Number:
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0917-xxx-xxxx"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="input-field text-xs py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Requested Volume ({unit}):
                </label>
                <input
                  type="number"
                  min={10}
                  required
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(Math.max(1, Number(e.target.value)))}
                  className="input-field text-xs py-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Target Price per {unit} (₱):
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={targetPricePerUnit}
                  onChange={(e) => setTargetPricePerUnit(Math.max(1, Number(e.target.value)))}
                  className="input-field text-xs py-2 font-bold"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Needed By Date:
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="input-field text-xs py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Supply Frequency:
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="input-field text-xs py-2"
                >
                  <option value="One-time Spot Order">One-time Spot Order</option>
                  <option value="Weekly Contract">Weekly Contract</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Specific Packaging & Logistics Notes:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Need crate packaging, washed and sorted for restaurant kitchen use."
                className="input-field text-xs"
              />
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">Estimated Total Order Budget:</span>
              <span className="text-base font-extrabold text-amber-950">{formatPeso(estimatedTotalBudget)}</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline py-2 px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Wholesale Request</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default BulkQuotationModal
