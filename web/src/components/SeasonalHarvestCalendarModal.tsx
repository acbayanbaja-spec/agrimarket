import React, { useState } from 'react'
import {
  Calendar,
  X,
  Search,
  CheckCircle,
  Clock,
  Sparkles,
  Leaf,
  Filter,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'

type CropSeasonality = {
  name: string
  category: string
  province: string
  peakMonths: number[] // 1-12
  moderateMonths: number[] // 1-12
  leanMonths: number[] // 1-12
  priceTrend: 'Lowest Price (Surplus)' | 'Stable' | 'Premium (High Demand)'
  tips: string
}

const REGION_12_CROPS: CropSeasonality[] = [
  {
    name: 'Dinorado Fragrant Rice',
    category: 'Grains',
    province: "M'lang & Tulunan, Cotabato",
    peakMonths: [3, 4, 10, 11],
    moderateMonths: [2, 5, 9, 12],
    leanMonths: [1, 6, 7, 8],
    priceTrend: 'Lowest Price (Surplus)',
    tips: 'Main wet-season harvest peaks in October-November. Best time to purchase sacks in bulk for year-round storage.',
  },
  {
    name: 'Long Purple Eggplant (Talong)',
    category: 'Vegetables',
    province: 'Polomolok & Tupi, South Cotabato',
    peakMonths: [1, 2, 3, 9, 10, 11, 12],
    moderateMonths: [4, 5, 8],
    leanMonths: [6, 7],
    priceTrend: 'Lowest Price (Surplus)',
    tips: 'Tender glossy harvest peaks year-round under irrigated mulch beds. Ideal for pinakbet and torta.',
  },
  {
    name: 'Carabao Sweet Mangoes',
    category: 'Fruits',
    province: 'Alabel & Malungon, Sarangani',
    peakMonths: [3, 4, 5, 6],
    moderateMonths: [2, 7],
    leanMonths: [1, 8, 9, 10, 11, 12],
    priceTrend: 'Lowest Price (Surplus)',
    tips: 'Peak sweetness reaches 18+ Brix in summer dry months. Off-season fruit uses induced flowering.',
  },
  {
    name: 'White Oyster Mushrooms',
    category: 'Vegetables',
    province: 'Koronadal City & Surallah',
    peakMonths: [6, 7, 8, 9, 10, 11, 12],
    moderateMonths: [1, 2, 5],
    leanMonths: [3, 4],
    priceTrend: 'Stable',
    tips: 'Thrives during high ambient humidity in rainy months. Harvested within 12 hours of fruiting.',
  },
  {
    name: 'Sweet Cavendish Banana',
    category: 'Fruits',
    province: 'Tupi, South Cotabato',
    peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    moderateMonths: [],
    leanMonths: [],
    priceTrend: 'Stable',
    tips: 'Continuous weekly harvest cycle supported by modern plantation irrigation in Matutum foothills.',
  },
  {
    name: 'Puyat Durian (Native)',
    category: 'Fruits',
    province: 'Kidapawan & Makilala, Cotabato',
    peakMonths: [8, 9, 10],
    moderateMonths: [7, 11],
    leanMonths: [1, 2, 3, 4, 5, 6, 12],
    priceTrend: 'Lowest Price (Surplus)',
    tips: 'Rich creamy golden flesh with mild aroma. Best prices at peak September-October farmgate drops.',
  },
  {
    name: 'Fresh Lake Sebu Tilapia',
    category: 'Fishery',
    province: 'Lake Sebu, South Cotabato',
    peakMonths: [1, 2, 3, 4, 9, 10, 11, 12],
    moderateMonths: [5, 8],
    leanMonths: [6, 7],
    priceTrend: 'Stable',
    tips: 'High-oxygen cold lake water prevents muddy taste (walang lasang gilik). Cleanest freshwater fish in Mindanao.',
  },
  {
    name: 'General Santos Yellowfin Tuna',
    category: 'Fishery',
    province: 'General Santos City Fish Port',
    peakMonths: [3, 4, 5, 9, 10, 11],
    moderateMonths: [1, 2, 6, 12],
    leanMonths: [7, 8],
    priceTrend: 'Lowest Price (Surplus)',
    tips: 'Sashimi-grade loins landed daily at Gensan Fish Port Complex. High seasonal tuna runs off Celebes Sea.',
  },
]

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const SeasonalHarvestCalendarModal = ({ isOpen, onClose }: Props) => {
  const currentMonthNum = new Date().getMonth() + 1 // 1-12
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum)
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')

  if (!isOpen) return null

  const filteredCrops = REGION_12_CROPS.filter((c) => {
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!c.name.toLowerCase().includes(q) && !c.province.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 animate-scale-up overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-800 to-primary-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300">
              <Calendar className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">SOCCSKSARGEN Seasonal Harvest Guide</h2>
              <p className="text-xs text-emerald-100">
                Optimal buying & planting windows across South Cotabato, Cotabato, Sultan Kudarat & Sarangani
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Filters and Month Selector */}
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/70 space-y-3 shrink-0">
          {/* 12 Months Pill Stepper */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {MONTH_NAMES.map((name, idx) => {
              const mNum = idx + 1
              const isSelected = selectedMonth === mNum
              const isCurrent = currentMonthNum === mNum
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedMonth(mNum)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1 ${
                    isSelected
                      ? 'bg-primary-700 text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span>{name.slice(0, 3)}</span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Current Month" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Category:</span>
              <div className="flex gap-1">
                {['All', 'Grains', 'Vegetables', 'Fruits', 'Fishery'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      categoryFilter === cat
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex-1 max-w-xs min-w-[200px]">
              <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crop or municipality..."
                className="input-field text-xs pl-8 py-1.5 w-full bg-white"
              />
            </div>
          </div>
        </div>

        {/* Crops List in Selected Month */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between pb-1">
            <p className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
              Produce Status for <span className="text-primary-800">{MONTH_NAMES[selectedMonth - 1]}</span>:
            </p>
            <span className="text-xs text-gray-400">{filteredCrops.length} crops tracked</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {filteredCrops.map((crop) => {
              const isPeak = crop.peakMonths.includes(selectedMonth)
              const isModerate = crop.moderateMonths.includes(selectedMonth)
              const isLean = crop.leanMonths.includes(selectedMonth)

              return (
                <div
                  key={crop.name}
                  className={`p-4 rounded-2xl border transition space-y-2 ${
                    isPeak
                      ? 'bg-emerald-50/60 border-emerald-200 shadow-xs'
                      : isModerate
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-50 border-gray-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900">{crop.name}</h4>
                      <p className="text-xs text-gray-500">{crop.province}</p>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isPeak
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isModerate
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {isPeak ? '🟢 Peak Harvest' : isModerate ? '🔵 In Supply' : '🟡 Lean Season'}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-600 leading-relaxed">{crop.tips}</p>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                    <span className="text-gray-500 font-semibold">Pricing Window:</span>
                    <span className="font-bold text-primary-800">{crop.priceTrend}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 shrink-0">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>Based on Department of Agriculture (DA Region XII) Farmgate Crop Schedules.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary py-1.5 px-4 text-xs font-bold"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  )
}

export default SeasonalHarvestCalendarModal
