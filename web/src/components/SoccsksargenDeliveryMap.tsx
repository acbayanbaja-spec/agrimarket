import { useState } from 'react'
import { MapPin, Navigation, Compass, ExternalLink, ShieldCheck, Truck, Layers } from 'lucide-react'
import { soccsksargenPlaces, type SoccsksargenPlace } from '../data/locations'

type DeliveryMapProps = {
  activeLocation?: {
    lat: number
    lng: number
    address: string
    title?: string
  }
  allOrders?: Array<{
    id: string
    address: string
    buyerName?: string
    lat?: number
    lng?: number
    status: string
  }>
  onSelectPlace?: (place: SoccsksargenPlace) => void
  compact?: boolean
}

export const SOCCSKSARGEN_CENTER = {
  lat: 6.38,
  lng: 124.95,
  name: 'SOCCSKSARGEN (Region XII) Central Hub',
}

const REGIONAL_HUBS: SoccsksargenPlace[] = [
  { city: 'Koronadal City', province: 'South Cotabato', label: 'Koronadal Regional Center', lat: 6.5004, lng: 124.8436 },
  { city: 'General Santos City', province: 'General Santos', label: 'GenSan Port & Fish Port Hub', lat: 6.1164, lng: 125.1716 },
  { city: 'Polomolok', province: 'South Cotabato', label: 'Polomolok Pineapple & Veg Hub', lat: 6.2214, lng: 125.0647 },
  { city: 'Tacurong City', province: 'Sultan Kudarat', label: 'Tacurong Rice & Grain Hub', lat: 6.6925, lng: 124.6764 },
  { city: 'Kidapawan City', province: 'Cotabato', label: 'Kidapawan Fruit & Highland Hub', lat: 7.0083, lng: 125.0894 },
  { city: 'Alabel', province: 'Sarangani', label: 'Alabel & Sarangani Coastal Hub', lat: 6.1022, lng: 125.2906 },
]

export const SoccsksargenDeliveryMap = ({
  activeLocation,
  allOrders = [],
  onSelectPlace,
  compact = false,
}: DeliveryMapProps) => {
  const [selectedHub, setSelectedHub] = useState<SoccsksargenPlace>(REGIONAL_HUBS[0])
  const [mapEngine, setMapEngine] = useState<'osm' | 'google'>('osm')

  const targetLat = activeLocation?.lat || selectedHub.lat
  const targetLng = activeLocation?.lng || selectedHub.lng
  const targetLabel = activeLocation?.title || activeLocation?.address || selectedHub.label

  // OpenStreetMap bbox bounding coordinates centered squarely on Region XII / location
  const delta = compact ? 0.04 : 0.08
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${targetLng - delta}%2C${targetLat - delta}%2C${targetLng + delta}%2C${targetLat + delta}&layer=mapnik&marker=${targetLat}%2C${targetLng}`

  // Google Maps explicit Region XII query to ensure it never defaults outside SOCCSKSARGEN
  const googleEmbedUrl = `https://maps.google.com/maps?q=${targetLat},${targetLng}+(${encodeURIComponent(targetLabel + ', SOCCSKSARGEN, Philippines')})&t=&z=13&ie=UTF8&iwloc=&output=embed`

  const gmapsDirections = `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`
  const wazeDirections = `https://www.waze.com/ul?ll=${targetLat},${targetLng}&navigate=yes`

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden transition-all duration-300">
      {/* Header bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-soil-900 via-primary-950 to-primary-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary-600/30 border border-primary-400/30 flex items-center justify-center text-primary-300 shadow-inner">
            <Truck className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-base sm:text-lg">SOCCSKSARGEN Dispatch Map</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary-500/30 text-primary-200 border border-primary-400/30">
                Region XII
              </span>
            </div>
            <p className="text-xs text-primary-200/80 mt-0.5 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-secondary-400" />
              <span>Target: <strong>{targetLabel}</strong></span>
              <span className="hidden sm:inline font-mono opacity-70">({targetLat.toFixed(4)}° N, {targetLng.toFixed(4)}° E)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Map Layer Toggle */}
          <div className="inline-flex rounded-xl bg-white/10 p-1 backdrop-blur-md border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setMapEngine('osm')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                mapEngine === 'osm' ? 'bg-primary-600 text-white shadow-sm' : 'text-primary-100 hover:text-white'
              }`}
            >
              OpenStreetMap (Zero Block)
            </button>
            <button
              type="button"
              onClick={() => setMapEngine('google')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                mapEngine === 'google' ? 'bg-primary-600 text-white shadow-sm' : 'text-primary-100 hover:text-white'
              }`}
            >
              Google GPS
            </button>
          </div>

          <a
            href={gmapsDirections}
            target="_blank"
            rel="noreferrer"
            className="btn-primary bg-primary-600 hover:bg-primary-500 text-white text-xs py-1.5 px-3 inline-flex items-center gap-1.5 shadow-sm"
          >
            <Navigation className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Directions</span>
          </a>
        </div>
      </div>

      {/* Hub Quick Filter Tabs */}
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-gray-500 font-semibold uppercase text-[10px] shrink-0 mr-1 flex items-center gap-1">
          <Compass className="h-3 w-3" /> Quick Hubs:
        </span>
        {REGIONAL_HUBS.map((hub) => {
          const isSelected = selectedHub.city === hub.city && !activeLocation
          return (
            <button
              key={hub.city}
              type="button"
              onClick={() => {
                setSelectedHub(hub)
                onSelectPlace?.(hub)
              }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full font-medium transition-all duration-200 shrink-0 ${
                isSelected
                  ? 'bg-primary-700 text-white shadow-sm shadow-primary-700/20 ring-2 ring-primary-700/20'
                  : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-100'
              }`}
            >
              📍 {hub.city}
            </button>
          )
        })}
      </div>

      {/* Embedded Map Frame */}
      <div className={`relative w-full ${compact ? 'h-52' : 'h-72 sm:h-96'} bg-gray-100`}>
        <iframe
          title="SOCCSKSARGEN Region XII Delivery Map"
          className="w-full h-full border-0"
          src={mapEngine === 'osm' ? osmUrl : googleEmbedUrl}
          loading="lazy"
          allowFullScreen
        />

        {/* Live GPS badge overlay */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-gray-100 text-[11px] font-medium text-gray-700 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>SOCCSKSARGEN Dispatch Zone</span>
          <span className="text-gray-400">|</span>
          <span className="text-primary-800 font-bold">100% Region XII Covered</span>
        </div>
      </div>

      {/* Map Action Footer */}
      <div className="p-3 sm:p-4 bg-white flex flex-wrap items-center justify-between gap-3 text-xs border-t border-gray-100">
        <div className="flex items-center gap-2 text-gray-600">
          <ShieldCheck className="h-4 w-4 text-primary-600 shrink-0" />
          <span>Riders restricted to SOCCSKSARGEN provincial borders for same-day harvest freshness.</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <a
            href={gmapsDirections}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:text-primary-800 px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Google Maps <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href={wazeDirections}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-800 px-2 py-1 rounded-lg hover:bg-sky-50 transition-colors"
          >
            Waze GPS <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  )
}

export default SoccsksargenDeliveryMap
