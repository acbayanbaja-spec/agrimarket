import api from '../services/api'

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

export function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type || !file.type.startsWith('image/')) {
      return fileToDataUrl(file).then(resolve, reject)
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        if (width / maxWidth > height / maxHeight) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        } else {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, width)
      canvas.height = Math.max(1, height)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return fileToDataUrl(file).then(resolve, reject)
      }

      ctx.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(dataUrl)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      fileToDataUrl(file).then(resolve, reject)
    }

    img.src = objectUrl
  })
}

export async function uploadProductImage(file: File): Promise<string> {
  // 1. Generate lightweight compressed data URL (~50-80KB) so we have an instant client-side fallback
  const compressedDataUrl = await compressImage(file, 1200, 1200, 0.82)

  // 2. Try direct server upload to /api/upload
  try {
    const formData = new FormData()
    // NOTE: We do not manually set 'Content-Type' to allow Axios/browser to set multipart boundary automatically
    const res = await api.post<{ success?: boolean; data?: { url: string }; url?: string }>('/upload', formData, {
      timeout: 10000,
    })
    const uploadedUrl = res.data?.data?.url || (res.data as any)?.url
    if (uploadedUrl && typeof uploadedUrl === 'string') {
      return uploadedUrl
    }
  } catch (err) {
    console.warn('Backend image upload fallback to compressed data URL:', err)
  }

  return compressedDataUrl
}

export function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

export function recommendScore(rating: number, reviews: number) {
  return rating * Math.log10(reviews + 10)
}
