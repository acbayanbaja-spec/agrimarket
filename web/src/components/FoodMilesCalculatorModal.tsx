import React, { useState } from 'react'
import {
  Leaf,
  MapPin,
  TrendingDown,
  Truck,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { soccsksargenPlaces } from '../data/locations'

type Props = {
  isOpen: boolean
  onClose: () => void
  farmOrigin?: string
  productName?: string
}

export const FoodMilesCalculatorModal = ({
  isOpen,
  onClose,
  farmOrigin = 'Polomolok, South Cotabato',
  productName = 'Fresh Local Harvest',
}: Props) => {
  const [buyerLocation, setBuyerLocation] = useState<string>('General Santos City')

  if (!isOpen) return null

  // Approximate road distance calculation within SOCCSKSARGEN
  const calculateDistanceKm = (from: string, to: string) => {
    if (from.toLowerCase().includes(to.toLowerCase()) || to.toLowerCase().includes(from.toLowerCase())) {
      return 8
    }
    if (from.includes('Polomolok') && to.includes('General Santos')) return 18
    if (from.includes('Polomolok') && to.includes('Koronadal')) return 42
    if (from.includes('Kidapawan') && to.includes('General Santos')) return 118
    if (from.includes('Kidapawan') && to.includes('Koronadal')) return 78
    if (from.includes('Lake Sebu') && to.includes('Koronadal')) return 45
    if (from.includes('Tupi') && to.includes('General Santos')) return 32
    if (from.includes('Alabel') && to.includes('General Santos')) return 16
    return 35 // default regional transit
  }

  const localDistance = calculateDistanceKm(farmOrigin, buyerLocation)
  const conventionalSupermarketDistance = 1150 // typical produce trucked from Manila or imported
  const savedKm = conventionalSupermarketDistance - localDistance
  const savedCo2Kg = Math.round((savedKm * 0.17) * 10) / 10 // approx 0.17 kg CO2/ton-km
  const freshHours = Math.round(localDistance / 35 * 10) / 10 + 1

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-200 animate-scale-up space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Leaf className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Farm-to-Fork Food Miles & Carbon Badge</h3>
              <p className="text-xs text-gray-500">Environmental sustainability impact assessment</p>
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

        {/* Produce and Route selector */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-semibold">Agricultural Produce:</span>
            <span className="font-extrabold text-gray-900">{productName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-semibold">Farm Origin:</span>
            <span className="font-bold text-emerald-800 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              {farmOrigin}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/60">
            <span className="text-gray-700 font-bold">Your Delivery Town:</span>
            <select
              value={buyerLocation}
              onChange={(e) => setBuyerLocation(e.target.value)}
              className="input-field text-xs py-1 px-2 font-bold w-48 bg-white"
            >
              <option value="General Santos City">General Santos City</option>
              <option value="Koronadal City">Koronadal City</option>
              <option value="Polomolok">Polomolok, South Cotabato</option>
              <option value="Tupi">Tupi, South Cotabato</option>
              <option value="Tacurong City">Tacurong City</option>
              <option value="Kidapawan City">Kidapawan City</option>
              <option value="Alabel">Alabel, Sarangani</option>
              <option value="Surallah">Surallah, South Cotabato</option>
            </select>
          </div>
        </div>

        {/* Impact Visualizer */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider">Local Food Transit</span>
            <p className="text-2xl font-black text-emerald-800">{localDistance} km</p>
            <p className="text-[11px] text-emerald-700 font-medium">Estimated {freshHours}h from harvest to gate</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider">CO₂ Emissions Avoided</span>
            <p className="text-2xl font-black text-amber-800">−{savedCo2Kg} kg</p>
            <p className="text-[11px] text-amber-700 font-medium">vs imported supermarket logistics</p>
          </div>
        </div>

        {/* Sustainability Badge */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center gap-3.5 shadow-md">
          <ShieldCheck className="h-9 w-9 text-emerald-200 shrink-0" />
          <div className="text-xs">
            <p className="font-extrabold text-sm">Certified Low-Miles Micro-Regional Harvest</p>
            <p className="text-emerald-100/90 text-[11px] leading-relaxed mt-0.5">
              Purchasing this lot directly supports family farmers in Region 12 while eliminating cold-storage cross-island shipping emissions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary w-full py-2.5 text-xs font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default FoodMilesCalculatorModal
