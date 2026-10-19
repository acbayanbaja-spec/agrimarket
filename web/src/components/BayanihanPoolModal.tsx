import React, { useState } from 'react'
import {
  Users,
  Sparkles,
  Clock,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  X,
  Plus,
  Coins,
  Package,
} from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { formatPeso } from '../lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
  productName?: string
  retailPrice?: number
  wholesalePrice?: number
  unit?: string
  poolTarget?: number // in units e.g. 50kg
  currentPledged?: number
}

export const BayanihanPoolModal: React.FC<Props> = ({
  isOpen,
  onClose,
  productName = 'Premium Mindanao Sinandomeng Rice',
  retailPrice = 52,
  wholesalePrice = 38,
  unit = 'kg',
  poolTarget = 50,
  currentPledged = 35,
}) => {
  const { notify } = useStore()
  const { user } = useAuth()

  const [pledgeQty, setPledgeQty] = useState(5)
  const [pledgedSoFar, setPledgedSoFar] = useState(currentPledged)
  const [hasJoined, setHasJoined] = useState(false)

  if (!isOpen) return null

  const progressPercent = Math.min(100, Math.round((pledgedSoFar / poolTarget) * 100))
  const discountPercent = Math.round(((retailPrice - wholesalePrice) / retailPrice) * 100)
  const remainingNeeded = Math.max(0, poolTarget - pledgedSoFar)

  const handleJoinPool = (e: React.FormEvent) => {
    e.preventDefault()
    const nextTotal = pledgedSoFar + pledgeQty
    setPledgedSoFar(nextTotal)
    setHasJoined(true)

    notify({
      userId: 'all',
      title: 'Bayanihan Pool Pledged!',
      message: `${user?.firstName || 'Buyer'} joined the ${productName} pool with ${pledgeQty} ${unit}. Group progress: ${Math.min(100, Math.round((nextTotal / poolTarget) * 100))}%!`,
    })

    setTimeout(() => {
      setHasJoined(false)
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
              <Users className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-gray-900 text-base">Bayanihan Group Harvest Pool</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Save {discountPercent}%
                </span>
              </div>
              <p className="text-xs text-gray-500">Pool orders with neighbors & get farm-wholesale prices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Produce Title & Pricing Comparison */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-gray-900 text-sm">{productName}</h4>
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Direct Farm Gate
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-gray-500 block text-[11px]">Individual Retail:</span>
              <span className="text-base font-bold text-gray-400 line-through">
                {formatPeso(retailPrice)} / {unit}
              </span>
            </div>

            <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-xs">
              <span className="text-emerald-100 block text-[11px]">Bayanihan Pool Price:</span>
              <span className="text-base font-black">
                {formatPeso(wholesalePrice)} / {unit}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar & Threshold */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-gray-800">
              Pool Progress: {pledgedSoFar} / {poolTarget} {unit}
            </span>
            <span className="text-emerald-700 font-extrabold">{progressPercent}% Unlocked</span>
          </div>

          <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-primary-600 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-600" />
              Closing in 14 hours 20 mins
            </span>
            <span className="font-bold text-gray-700">
              {remainingNeeded > 0 ? `${remainingNeeded} ${unit} needed to lock` : 'Target reached!'}
            </span>
          </div>
        </div>

        {/* Recent Pool Participants */}
        <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 space-y-2">
          <span className="text-xs font-bold text-gray-700 block">Recent Cooperative Pledges:</span>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-white">
                ML
              </div>
              <div className="w-7 h-7 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-white">
                JR
              </div>
              <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-white">
                ED
              </div>
            </div>
            <p className="text-[11px] text-gray-600">
              Maria, Juan, Eduardo + 4 neighbors pledged 35 {unit}
            </p>
          </div>
        </div>

        {/* Pledge Form */}
        <form onSubmit={handleJoinPool} className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-800">Your Pledge Amount ({unit}):</label>
            <div className="flex items-center gap-1.5">
              {[2, 5, 10, 20].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setPledgeQty(amt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    pledgeQty === amt
                      ? 'bg-primary-700 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
            <div>
              <span className="text-[11px] text-gray-500 block">Your Subtotal:</span>
              <span className="text-base font-extrabold text-primary-800">
                {formatPeso(pledgeQty * wholesalePrice)}
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              You save {formatPeso(pledgeQty * (retailPrice - wholesalePrice))}!
            </span>
          </div>

          {hasJoined ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>You successfully joined the Bayanihan Pool! Produce reserved.</span>
            </div>
          ) : (
            <button
              type="submit"
              className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <Users className="h-4 w-4" />
              <span>Join Bayanihan Pool & Lock Discount</span>
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default BayanihanPoolModal
