import React, { useState } from 'react'
import {
  Calendar,
  Lock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  X,
  Coins,
  Truck,
} from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { formatPeso } from '../lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
  productName?: string
  sellerName?: string
  sellerLocation?: string
  currentPrice?: number
  unit?: string
}

export const ForwardHarvestModal: React.FC<Props> = ({
  isOpen,
  onClose,
  productName = 'Long Purple Eggplant (Talong)',
  sellerName = 'Green Valley Farm',
  sellerLocation = 'Polomolok, South Cotabato',
  currentPrice = 60,
  unit = 'kg',
}) => {
  const { notify } = useStore()
  const { user } = useAuth()

  const [quantity, setQuantity] = useState(25)
  const [lockedPricePerUnit, setLockedPricePerUnit] = useState(Math.round(currentPrice * 0.9))
  const [targetHarvestDate, setTargetHarvestDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 21) // 3 weeks out
    return d.toISOString().slice(0, 10)
  })
  const [isReserved, setIsReserved] = useState(false)

  if (!isOpen) return null

  const totalContractValue = quantity * lockedPricePerUnit
  const downpaymentDeposit = Math.round(totalContractValue * 0.2) // 20% downpayment
  const balanceOnHarvest = totalContractValue - downpaymentDeposit

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsReserved(true)

    notify({
      userId: 'all',
      title: 'Forward Harvest Contract Created',
      message: `${user?.firstName || 'Buyer'} booked a forward harvest agreement with ${sellerName} for ${quantity} ${unit} of ${productName} (${formatPeso(totalContractValue)}).`,
    })

    setTimeout(() => {
      setIsReserved(false)
      onClose()
    }, 2500)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 animate-scale-up space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <Calendar className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-gray-900 text-base">Forward Harvest Agreement</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Pre-Harvest Lock
                </span>
              </div>
              <p className="text-xs text-gray-500">Book future crop batches at guaranteed farm-gate rates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Harvest Summary Card */}
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-gray-900 text-sm">{productName}</h4>
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              {sellerName}
            </span>
          </div>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            Target Harvest Window: <strong className="text-gray-800">{targetHarvestDate}</strong> ({sellerLocation})
          </p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Contract Quantity ({unit}):</label>
              <input
                type="number"
                min="5"
                max="5000"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(5, Number(e.target.value)))}
                className="input-field text-xs py-2 font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Locked Price per {unit}:</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={lockedPricePerUnit}
                  onChange={(e) => setLockedPricePerUnit(Math.max(1, Number(e.target.value)))}
                  className="input-field text-xs py-2 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Target Harvest Pickup Date:</label>
            <input
              type="date"
              value={targetHarvestDate}
              onChange={(e) => setTargetHarvestDate(e.target.value)}
              className="input-field text-xs py-2"
            />
          </div>

          {/* Deposit Breakdown */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Total Contract Value:</span>
              <span className="font-black text-gray-900 text-sm">{formatPeso(totalContractValue)}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Lock className="h-3 w-3" />
                20% Escrow Downpayment Today:
              </span>
              <span className="font-extrabold text-emerald-800 text-sm">{formatPeso(downpaymentDeposit)}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span>80% Balance Payable on Harvest Handover:</span>
              <span className="font-bold text-gray-700">{formatPeso(balanceOnHarvest)}</span>
            </div>
          </div>

          {/* Legal / Protection Notice */}
          <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center gap-2 text-[11px] text-blue-900">
            <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
            <span>Escrow deposit is 100% refundable if crop yield does not meet PhilGAP standards.</span>
          </div>

          {isReserved ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Forward Harvest Contract Locked! Farmer will notify you upon harvest.</span>
            </div>
          ) : (
            <button
              type="submit"
              className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <FileText className="h-4 w-4" />
              <span>Sign & Reserve Forward Harvest ({formatPeso(downpaymentDeposit)} Deposit)</span>
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default ForwardHarvestModal
