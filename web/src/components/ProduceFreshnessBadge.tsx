import React, { useState } from 'react'
import { Sparkles, Clock, Thermometer, ShieldAlert, Check, HelpCircle } from 'lucide-react'

type Props = {
  category?: string
  productName?: string
  className?: string
}

export const ProduceFreshnessBadge = ({
  category = 'Vegetables',
  productName = 'Fresh Harvest',
  className = '',
}: Props) => {
  const [showDetails, setShowDetails] = useState(false)

  // Determine freshness guidelines by agricultural category
  const getGuideline = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'vegetables':
        return {
          daysSinceHarvest: 1,
          shelfLifeDays: '5–7 days',
          storage: 'Store in cool ventilated bin (10–14°C) or vegetable crisper.',
          optimalWindow: 'Peak crispness in first 3 days',
          tip: 'Do not wash until ready to prepare; moisture accelerates wilting.',
        }
      case 'fruits':
        return {
          daysSinceHarvest: 2,
          shelfLifeDays: '7–12 days',
          storage: 'Room temperature until ripe; refrigerate to prolong shelf life.',
          optimalWindow: 'Consume within 5 days of ripening',
          tip: 'Keep bananas and mangoes separate to prevent premature ripening of nearby fruits.',
        }
      case 'fishery':
        return {
          daysSinceHarvest: 0,
          shelfLifeDays: '2–3 days (iced)',
          storage: 'Maintain continuous ice pack coverage (0–4°C).',
          optimalWindow: 'Best consumed or frozen within 24 hours of delivery',
          tip: 'Rinse with clean cold water and pat dry before chilling or cooking.',
        }
      case 'grains':
        return {
          daysSinceHarvest: 14,
          shelfLifeDays: '6–12 months',
          storage: 'Store in airtight sack/container in dry dark pantry.',
          optimalWindow: 'Fragrant aromatic peak within 3 months of milling',
          tip: 'Add dry bay leaves to container to naturally deter grain weevils (bukbok).',
        }
      default:
        return {
          daysSinceHarvest: 1,
          shelfLifeDays: '5–10 days',
          storage: 'Keep in dry, cool conditions away from direct sunlight.',
          optimalWindow: 'Consume at peak freshness',
          tip: 'Inspect packaging upon arrival and store in appropriate containers.',
        }
    }
  }

  const guide = getGuideline(category)

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition shadow-2xs"
        title="View harvest freshness and shelf-life instructions"
      >
        <Sparkles className="h-3 w-3 text-emerald-600 animate-spin-slow" />
        <span>Fresh Harvest (Day {guide.daysSinceHarvest})</span>
        <HelpCircle className="h-3 w-3 text-emerald-500 opacity-70" />
      </button>

      {showDetails && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDetails(false)} />
          <div className="absolute left-0 mt-2 z-50 w-72 p-4 bg-white rounded-2xl shadow-xl border border-gray-200 text-xs text-gray-700 space-y-2.5 animate-scale-up">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
              <span className="font-extrabold text-xs text-gray-900">Freshness & Shelf Life Guide</span>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Days Since Harvest:</span>
                <span className="font-bold text-emerald-800">
                  {guide.daysSinceHarvest === 0 ? 'Same Day Catch/Pick' : `${guide.daysSinceHarvest} day(s) ago`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estimated Shelf Life:</span>
                <span className="font-bold text-gray-900">{guide.shelfLifeDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Peak Flavor Window:</span>
                <span className="font-bold text-primary-800">{guide.optimalWindow}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1 text-[11px]">
              <p className="font-bold text-gray-800 flex items-center gap-1">
                <Thermometer className="h-3.5 w-3.5 text-blue-600" />
                Storage Recommendation:
              </p>
              <p className="text-gray-600 leading-snug">{guide.storage}</p>
            </div>

            <p className="text-[10px] text-emerald-700 italic">💡 Tip: {guide.tip}</p>
          </div>
        </>
      )}
    </div>
  )
}

export default ProduceFreshnessBadge
