import React, { useState, useEffect } from 'react'

type Props = {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
}

const QuantityStepper = ({ value, min = 1, max, onChange, disabled }: Props) => {
  const [typed, setTyped] = useState<string>(String(value))

  useEffect(() => {
    setTyped(String(value))
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    setTyped(raw)
    const num = parseInt(raw, 10)
    if (!isNaN(num) && num >= min && num <= max) {
      onChange(num)
    }
  }

  const handleBlur = () => {
    const num = parseInt(typed, 10)
    if (isNaN(num) || num < min) {
      setTyped(String(min))
      onChange(min)
    } else if (num > max) {
      setTyped(String(max))
      onChange(max)
    } else {
      setTyped(String(num))
      onChange(num)
    }
  }

  return (
    <div className="inline-flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <button
        type="button"
        className="h-10 w-9 text-base font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 transition-colors"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        disabled={disabled}
        value={typed}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur()
          }
        }}
        className="w-12 h-10 text-center font-bold text-gray-900 border-x border-gray-100 bg-transparent focus:outline-none focus:bg-primary-50/40 text-sm"
        aria-label="Enter quantity directly"
      />
      <button
        type="button"
        className="h-10 w-9 text-base font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 transition-colors"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}

export default QuantityStepper
