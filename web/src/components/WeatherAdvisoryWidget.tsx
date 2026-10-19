import React, { useState } from 'react'
import {
  CloudSun,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  Info,
  Calendar,
  Sparkles,
  MapPin,
  ChevronDown,
} from 'lucide-react'

type MunicipalityWeather = {
  municipality: string
  province: string
  temp: number
  condition: 'Sunny' | 'Partly Cloudy' | 'Light Rain' | 'Scattered Showers' | 'Thunderstorm'
  humidity: number
  windKph: number
  rainProbability: number
  pagasaStatus: 'Normal' | 'Advisory' | 'Heavy Rainfall Warning'
  farmingAdvice: string
  harvestingRating: 'Excellent' | 'Good' | 'Moderate' | 'Hold'
}

const REGION_12_WEATHER: Record<string, MunicipalityWeather> = {
  gensan: {
    municipality: 'General Santos City',
    province: 'South Cotabato',
    temp: 31,
    condition: 'Partly Cloudy',
    humidity: 72,
    windKph: 14,
    rainProbability: 25,
    pagasaStatus: 'Normal',
    farmingAdvice: 'Ideal conditions for tuna offloading, open-air sun drying of cacao beans, and inland vegetable packing.',
    harvestingRating: 'Excellent',
  },
  koronadal: {
    municipality: 'Koronadal City (Marbel)',
    province: 'South Cotabato',
    temp: 29,
    condition: 'Sunny',
    humidity: 68,
    windKph: 11,
    rainProbability: 15,
    pagasaStatus: 'Normal',
    farmingAdvice: 'Excellent weather for morning harvest of leafy greens and field transport to trading post.',
    harvestingRating: 'Excellent',
  },
  kidapawan: {
    municipality: 'Kidapawan City',
    province: 'Cotabato',
    temp: 27,
    condition: 'Scattered Showers',
    humidity: 84,
    windKph: 9,
    rainProbability: 55,
    pagasaStatus: 'Advisory',
    farmingAdvice: 'Afternoon rain expected near Mt. Apo foothills. Wrap fruit harvests in plastic crates and check drainage.',
    harvestingRating: 'Good',
  },
  tacurong: {
    municipality: 'Tacurong City',
    province: 'Sultan Kudarat',
    temp: 30,
    condition: 'Partly Cloudy',
    humidity: 70,
    windKph: 12,
    rainProbability: 30,
    pagasaStatus: 'Normal',
    farmingAdvice: 'Favorable conditions for mechanical palay harvesting and grain moisture testing.',
    harvestingRating: 'Excellent',
  },
  tupi: {
    municipality: 'Tupi',
    province: 'South Cotabato',
    temp: 26,
    condition: 'Partly Cloudy',
    humidity: 78,
    windKph: 10,
    rainProbability: 20,
    pagasaStatus: 'Normal',
    farmingAdvice: 'Cool mountain air ideal for pineapple picking and greenhouse flower harvest.',
    harvestingRating: 'Excellent',
  },
  alabel: {
    municipality: 'Alabel',
    province: 'Sarangani',
    temp: 32,
    condition: 'Sunny',
    humidity: 65,
    windKph: 16,
    rainProbability: 10,
    pagasaStatus: 'Normal',
    farmingAdvice: 'Low humidity favors copra sun-drying and coastal aquaculture aeration.',
    harvestingRating: 'Excellent',
  },
}

export const WeatherAdvisoryWidget = () => {
  const [selectedKey, setSelectedKey] = useState<string>('koronadal')
  const current = REGION_12_WEATHER[selectedKey] || REGION_12_WEATHER.koronadal

  const renderConditionIcon = (condition: MunicipalityWeather['condition']) => {
    switch (condition) {
      case 'Sunny':
        return <Sun className="h-7 w-7 text-amber-500 animate-spin-slow" />
      case 'Partly Cloudy':
        return <CloudSun className="h-7 w-7 text-amber-500" />
      case 'Light Rain':
      case 'Scattered Showers':
      case 'Thunderstorm':
        return <CloudRain className="h-7 w-7 text-blue-500 animate-bounce" />
      default:
        return <CloudSun className="h-7 w-7 text-amber-500" />
    }
  }

  return (
    <div className="card bg-gradient-to-br from-emerald-900 via-teal-900 to-primary-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-emerald-400/10 to-transparent pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-emerald-300">
            <CloudSun className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
              <span>Region XII Agri-Weather Advisory</span>
              <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                Live PAGASA Sync
              </span>
            </h3>
            <p className="text-[11px] text-emerald-200/80">Microclimate forecast & farmgate field advisory</p>
          </div>
        </div>

        {/* Municipality Selector */}
        <div className="relative">
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="appearance-none bg-white/15 hover:bg-white/20 border border-white/20 text-white font-bold text-xs py-1.5 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
          >
            {Object.entries(REGION_12_WEATHER).map(([key, data]) => (
              <option key={key} value={key} className="bg-gray-900 text-white">
                {data.municipality} ({data.province})
              </option>
            ))}
          </select>
          <ChevronDown className="h-3.5 w-3.5 text-white/70 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10 shrink-0">
            {renderConditionIcon(current.condition)}
          </div>
          <div>
            <span className="text-2xl font-black text-white">{current.temp}°C</span>
            <p className="text-[11px] font-bold text-emerald-200">{current.condition}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10 text-cyan-300 shrink-0">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white">{current.humidity}%</span>
            <p className="text-[11px] text-emerald-200/70">Relative Humidity</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10 text-sky-300 shrink-0">
            <Wind className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white">{current.windKph} km/h</span>
            <p className="text-[11px] text-emerald-200/70">Wind Speed</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10 text-blue-300 shrink-0">
            <CloudRain className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white">{current.rainProbability}%</span>
            <p className="text-[11px] text-emerald-200/70">Rain Probability</p>
          </div>
        </div>
      </div>

      {/* Field Advisory Message */}
      <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-xs text-emerald-100 flex items-start gap-2.5 relative z-10">
        <Sparkles className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-extrabold text-white mr-1.5">Farmer Field Advisory:</span>
          <span>{current.farmingAdvice}</span>
        </div>
        <span className="shrink-0 text-[10px] font-black uppercase bg-emerald-400 text-gray-950 px-2 py-0.5 rounded-md">
          {current.harvestingRating} Harvest Window
        </span>
      </div>
    </div>
  )
}

export default WeatherAdvisoryWidget
