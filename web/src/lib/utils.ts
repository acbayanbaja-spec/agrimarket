export function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(' ')
}

export function formatPeso(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string; error?: string } } }).response
    if (response?.data?.message) return response.data.message
    if (response?.data?.error) return response.data.error
    if (response?.status === 503) return 'The marketplace is temporarily unavailable. Please try again shortly.'
    if (response?.status === 404) return 'Cannot reach the AgriMarket API. The app may be pointing at the wrong backend URL.'
    if (response?.status === 500) return 'Server error. Please try again in a few moments.'
    if (response?.status === 401) return 'Invalid email or password. Please try again.'
    if (response?.status === 403) return 'Account is deactivated or unauthorized.'
    if (response?.status === 429) return 'Too many requests. Please wait a moment and try again.'
  }
  if (error instanceof Error && error.message) {
    if (error.message === 'Network Error' || error.message.includes('Network Error')) {
      return 'Unable to connect to AgriMarket server. The backend may be waking up from sleep (Render free tier), please wait a moment and try again.'
    }
    if (error.message.includes('status code 500')) {
      return 'Server temporarily unavailable. Please try again in a few moments.'
    }
    return error.message
  }
  return fallback
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

export function recommendScore(rating: number, reviews: number) {
  return rating * Math.log10(reviews + 10)
}
