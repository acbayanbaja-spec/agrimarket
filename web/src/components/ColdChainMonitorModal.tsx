import React, { useState } from 'react'
import {
  Thermometer,
  Droplets,
  Truck,
  ShieldCheck,
  AlertTriangle,
  X,
  RefreshCw,
  MapPin,
  CheckCircle2,
  Clock,
  Compass,
} from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  productName?: string
  orderId?: string
  sellerLocation?: string
}

export const ColdChainMonitorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  productName = 'Fresh Harvest Produce',
  orderId = 'ORD-1002',
  sellerLocation = 'Polomolok, South Cotabato',
}) => {
  const [temperature, setTemperature] = useState(4.2) // °C
  const [humidity, setHumidity] = useState(88) // %
  const [reeferMode, setReeferMode] = useState<'Chilled (2-8°C)' | 'Controlled Ambient (12-16°C)' | 'Deep Freeze (-18°C)'>('Chilled (2-8°C)')
  const [isSimulating, setIsSimulating] = useState(false)

  if (!isOpen) return null

  const isTempOptimal = temperature >= 2 && temperature <= 8
  const isTempWarning = temperature > 8 && temperature <= 12
  const isTempCritical = temperature > 12

  const handleSimulateCycle = () => {
    setIsSimulating(true)
    setTimeout(() => {
      // fluctuate temperature within safe chilled boundaries
      setTemperature(Number((3.5 + Math.random() * 2.5).toFixed(1)))
      setHumidity(Math.floor(84 + Math.random() * 8))
      setIsSimulating(false)
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 animate-scale-up space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center shadow-xs">
              <Thermometer className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-gray-900 text-base">Cold Chain & Sensor Telemetry</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                  IoT Active
                </span>
              </div>
              <p className="text-xs text-gray-500">Real-time harvest temperature tracking for {orderId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Gauges */}
        <div className="grid grid-cols-2 gap-3">
          {/* Temperature Gauge */}
          <div className={`p-4 rounded-2xl border transition ${
            isTempOptimal
              ? 'bg-emerald-50/70 border-emerald-200'
              : isTempWarning
              ? 'bg-amber-50 border-amber-200'
              : 'bg-rose-50 border-rose-200'
          }`}>
            <div className="flex items-center justify-between text-xs text-gray-500 pb-1">
              <span className="font-bold flex items-center gap-1">
                <Thermometer className="h-3.5 w-3.5 text-cyan-600" />
                Transit Temp
              </span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                isTempOptimal
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-amber-200 text-amber-900'
              }`}>
                {isTempOptimal ? 'Optimal' : 'Caution'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-gray-900">{temperature}°</span>
              <span className="text-sm font-bold text-gray-500">C</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Target range: 2.0°C – 8.0°C</p>
          </div>

          {/* Humidity Gauge */}
          <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/60">
            <div className="flex items-center justify-between text-xs text-gray-500 pb-1">
              <span className="font-bold flex items-center gap-1 text-blue-900">
                <Droplets className="h-3.5 w-3.5 text-blue-600" />
                Humidity (RH)
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-200 text-blue-900">
                Preserved
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-gray-900">{humidity}%</span>
              <span className="text-sm font-bold text-gray-500">RH</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Prevents wilting & weight loss</p>
          </div>
        </div>

        {/* Transit Route Timeline */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-800">
            <span className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-primary-700" />
              Refrigerated Van Transit Waypoints
            </span>
            <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Sensor Feed
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] shrink-0 mt-0.5 font-bold">
                ✓
              </span>
              <div>
                <p className="font-bold text-gray-900">Dispatched from {sellerLocation}</p>
                <p className="text-[11px] text-gray-500">Initial core temp: 3.8°C | Pre-cooled produce loading</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[9px] shrink-0 mt-0.5 font-bold">
                •
              </span>
              <div>
                <p className="font-bold text-gray-900">In Transit: Polomolok – Koronadal Highway</p>
                <p className="text-[11px] text-gray-500">Rider Rico (09363894541) | Reefer active: 4.2°C</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 opacity-60">
              <span className="w-4 h-4 rounded-full border border-gray-300 bg-white flex items-center justify-center text-[9px] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-800">Final Destination Handover</p>
                <p className="text-[11px] text-gray-500">Customer contactless cold bag transfer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cold-Chain Guarantee Badge */}
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
          <div className="text-xs text-emerald-900">
            <p className="font-extrabold">PhilGAP Cold-Chain Integrity Guarantee</p>
            <p className="text-[11px] text-emerald-700">Zero thermal shock detected. 100% freshness guarantee on arrival.</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleSimulateCycle}
            disabled={isSimulating}
            className="btn-outline py-2 px-3 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Calibrating...' : 'Refresh Telemetry'}</span>
          </button>

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

export default ColdChainMonitorModal
