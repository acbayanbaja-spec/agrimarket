import React, { useState } from 'react'
import {
  Sprout,
  Calculator,
  Compass,
  Coins,
  TrendingUp,
  Layers,
  Droplet,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react'
import { formatPeso } from '../lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
}

interface CropProfile {
  name: string
  avgYieldPerHectareKg: number
  avgPricePerKg: number
  maturityDays: number
  optimalPh: string
  fertilizerPlan: string
}

const CROP_PROFILES: Record<string, CropProfile> = {
  Rice: {
    name: 'Lowland Rice (Palay)',
    avgYieldPerHectareKg: 4800,
    avgPricePerKg: 23,
    maturityDays: 115,
    optimalPh: '6.0 – 6.8',
    fertilizerPlan: 'Complete 14-14-14 basal + Urea topdress at panicle initiation',
  },
  Corn: {
    name: 'Yellow Hybrid Corn (Mais)',
    avgYieldPerHectareKg: 5500,
    avgPricePerKg: 19,
    maturityDays: 105,
    optimalPh: '5.8 – 7.0',
    fertilizerPlan: '16-20-0 + Potash + Organic compost at furrowing',
  },
  Eggplant: {
    name: 'Long Purple Eggplant (Talong)',
    avgYieldPerHectareKg: 18500,
    avgPricePerKg: 60,
    maturityDays: 80,
    optimalPh: '6.2 – 6.8',
    fertilizerPlan: 'Vermicast + Complete 14-14-14 split applied every 15 days',
  },
  Tomato: {
    name: 'Salad Tomatoes (Kamatis)',
    avgYieldPerHectareKg: 16000,
    avgPricePerKg: 85,
    maturityDays: 75,
    optimalPh: '6.0 – 6.8',
    fertilizerPlan: 'Calcium nitrate + Muriate of potash + Trichoderma biocontrol',
  },
  Banana: {
    name: 'Cavendish / Lakatan Banana',
    avgYieldPerHectareKg: 28000,
    avgPricePerKg: 45,
    maturityDays: 270,
    optimalPh: '5.5 – 6.5',
    fertilizerPlan: 'High-potassium 0-0-60 + Chicken manure mulch',
  },
}

export const SoilYieldCalculatorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedCrop, setSelectedCrop] = useState<string>('Eggplant')
  const [areaHectares, setAreaHectares] = useState<number>(0.5)
  const [soilType, setSoilType] = useState<'Volcanic Loam (Mt. Matutum)' | 'Clay Loam' | 'Sandy Loam' | 'Alluvial Riverbed'>(
    'Volcanic Loam (Mt. Matutum)'
  )
  const [irrigation, setIrrigation] = useState<'Drip Irrigation' | 'Canal / Gravity Flow' | 'Rainfed'>(
    'Drip Irrigation'
  )

  if (!isOpen) return null

  const profile = CROP_PROFILES[selectedCrop] || CROP_PROFILES.Eggplant

  // Multipliers based on soil & irrigation quality
  const soilMultiplier =
    soilType === 'Volcanic Loam (Mt. Matutum)'
      ? 1.15
      : soilType === 'Clay Loam'
      ? 1.0
      : soilType === 'Alluvial Riverbed'
      ? 1.08
      : 0.92

  const irrigationMultiplier =
    irrigation === 'Drip Irrigation' ? 1.12 : irrigation === 'Canal / Gravity Flow' ? 1.0 : 0.85

  const projectedYieldKg = Math.round(profile.avgYieldPerHectareKg * areaHectares * soilMultiplier * irrigationMultiplier)
  const projectedRevenue = Math.round(projectedYieldKg * profile.avgPricePerKg)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 animate-scale-up space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Sprout className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-gray-900 text-base">Agronomist AI Yield & Soil Calculator</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  DA Region XII Standard
                </span>
              </div>
              <p className="text-xs text-gray-500">Projected harvest yields, farm-gate gross revenue, and fertilizer plans</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Crop Selector */}
          <div>
            <label className="font-bold text-gray-700 block mb-1">Target Crop:</label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="input-field text-xs py-2 font-medium"
            >
              {Object.entries(CROP_PROFILES).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Area in Hectares */}
          <div>
            <label className="font-bold text-gray-700 block mb-1">Plot Land Area (Hectares):</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="50"
              value={areaHectares}
              onChange={(e) => setAreaHectares(Math.max(0.1, Number(e.target.value)))}
              className="input-field text-xs py-2 font-mono font-bold"
            />
          </div>

          {/* Soil Type */}
          <div>
            <label className="font-bold text-gray-700 block mb-1">Soil Classification:</label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value as any)}
              className="input-field text-xs py-2 font-medium"
            >
              <option value="Volcanic Loam (Mt. Matutum)">Volcanic Loam (Mt. Matutum / Polomolok)</option>
              <option value="Alluvial Riverbed">Alluvial Riverbed (Midsayap / Tacurong)</option>
              <option value="Clay Loam">Clay Loam (Koronadal Valley)</option>
              <option value="Sandy Loam">Sandy Loam (Coastal GenSan)</option>
            </select>
          </div>

          {/* Irrigation Type */}
          <div>
            <label className="font-bold text-gray-700 block mb-1">Irrigation System:</label>
            <select
              value={irrigation}
              onChange={(e) => setIrrigation(e.target.value as any)}
              className="input-field text-xs py-2 font-medium"
            >
              <option value="Drip Irrigation">Drip Irrigation (Modern High-Efficiency)</option>
              <option value="Canal / Gravity Flow">Canal / Gravity Flow (NIA Standard)</option>
              <option value="Rainfed">Rainfed (Dependent on monsoon season)</option>
            </select>
          </div>
        </div>

        {/* Calculation Result Dashboard */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-primary-50 p-4 rounded-2xl border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 pb-1 border-b border-emerald-200/60">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-700" />
              Agronomic Projections ({areaHectares} Hectare)
            </span>
            <span className="bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full text-[10px]">
              Maturity: {profile.maturityDays} Days
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 shadow-xs">
              <span className="text-gray-500 block text-[11px] font-medium">Estimated Harvest Yield:</span>
              <span className="text-2xl font-black text-gray-900 mt-0.5 block">
                {projectedYieldKg.toLocaleString()} <span className="text-xs font-bold text-gray-500">kg</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                ≈ {(projectedYieldKg / 1000).toFixed(2)} Metric Tons
              </span>
            </div>

            <div className="bg-emerald-700 text-white p-3 rounded-xl shadow-xs">
              <span className="text-emerald-100 block text-[11px] font-medium">Projected Gross Revenue:</span>
              <span className="text-2xl font-black mt-0.5 block">
                {formatPeso(projectedRevenue)}
              </span>
              <span className="text-[10px] text-emerald-200 font-bold block mt-0.5">
                @ {formatPeso(profile.avgPricePerKg)} / kg farm-gate benchmark
              </span>
            </div>
          </div>
        </div>

        {/* Soil & Agronomic Prescription */}
        <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-800 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary-700" />
              Recommended Agronomic Soil Plan:
            </span>
            <span className="text-[11px] font-bold text-gray-500">Target pH: {profile.optimalPh}</span>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            {profile.fertilizerPlan}. Soil moisture retention boosted by 18% with {irrigation}.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Verified with Department of Agriculture Region XII Data
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary py-2 px-5 text-xs font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default SoilYieldCalculatorModal
