import React, { useState, useEffect } from 'react'
import {
  Bell,
  TrendingDown,
  CheckCircle2,
  Trash2,
  Coins,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { formatPeso } from '../lib/utils'

export type PriceAlertItem = {
  id: string
  productId: string
  productName: string
  currentPrice: number
  targetPrice: number
  unit: string
  createdAt: string
  active: boolean
}

type Props = {
  isOpen: boolean
  onClose: () => void
  product?: {
    id: string
    name: string
    price: number
    unit?: string
  }
}

export const PriceAlertModal = ({ isOpen, onClose, product }: Props) => {
  const { notify } = useStore()
  const [alerts, setAlerts] = useState<PriceAlertItem[]>(() => {
    try {
      const saved = localStorage.getItem('agrimarket.priceAlerts')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [targetPrice, setTargetPrice] = useState<number>(() => {
    return product ? Math.max(1, Math.round(product.price * 0.9)) : 50
  })
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (product) {
      setTargetPrice(Math.max(1, Math.round(product.price * 0.9)))
    }
  }, [product])

  if (!isOpen) return null

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    const newAlert: PriceAlertItem = {
      id: `alert-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      currentPrice: product.price,
      targetPrice,
      unit: product.unit || 'kg',
      createdAt: new Date().toISOString(),
      active: true,
    }

    const updated = [newAlert, ...alerts.filter((a) => a.productId !== product.id)]
    setAlerts(updated)
    localStorage.setItem('agrimarket.priceAlerts', JSON.stringify(updated))

    notify({
      userId: 'all',
      title: 'Price Alert Set',
      message: `We will notify you immediately when ${product.name} drops to ${formatPeso(targetPrice)} / ${product.unit || 'kg'}.`,
      href: `/products/${product.id}`,
    })

    setIsSaved(true)
    window.setTimeout(() => setIsSaved(false), 2000)
  }

  const handleRemoveAlert = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id)
    setAlerts(updated)
    localStorage.setItem('agrimarket.priceAlerts', JSON.stringify(updated))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-scale-up space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <TrendingDown className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Price Drop Alert Watchlist</h3>
              <p className="text-xs text-gray-500">Automated harvest discount notifications</p>
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

        {product && (
          <form onSubmit={handleAddAlert} className="space-y-3.5">
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-sm">{product.name}</span>
                <span className="font-bold text-gray-600">
                  Current: {formatPeso(product.price)} / {product.unit || 'kg'}
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                Set your desired purchase price. You will receive an instant notification when the farmer adjusts stock or price.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Notify me when price drops to:
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-500">₱</span>
                <input
                  type="number"
                  min={1}
                  max={product.price - 1}
                  required
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Math.max(1, Number(e.target.value)))}
                  className="input-field text-xs py-2 font-bold flex-1"
                />
                <span className="text-xs font-bold text-gray-600">/ {product.unit || 'kg'}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Bell className="h-4 w-4" />
              <span>{isSaved ? 'Price Alert Saved!' : 'Activate Price Alert'}</span>
            </button>
          </form>
        )}

        {/* Existing active alerts */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <p className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
            Your Active Price Alerts ({alerts.length})
          </p>
          {alerts.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No active price drop alerts right now.</p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {alerts.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-gray-900 truncate max-w-[180px]">{item.productName}</p>
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      Target: {formatPeso(item.targetPrice)} / {item.unit}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAlert(item.id)}
                    className="text-gray-400 hover:text-rose-600 p-1"
                    title="Remove alert"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline py-1.5 px-4 text-xs font-bold w-full"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default PriceAlertModal
