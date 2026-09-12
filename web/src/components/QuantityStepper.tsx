type Props = {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
}

const QuantityStepper = ({ value, min = 1, max, onChange, disabled }: Props) => {
  return (
    <div className="inline-flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        className="h-10 w-10 text-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-[2.5rem] text-center font-semibold">{value}</span>
      <button
        type="button"
        className="h-10 w-10 text-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
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
