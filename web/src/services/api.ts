import axios from 'axios'

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL
  if (typeof window !== 'undefined' && window.location) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (!isLocalhost) {
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl
      }
      return 'https://agrimarket-backend.onrender.com'
    }
  }
  return envUrl || 'http://localhost:5000'
}

const api = axios.create({
  baseURL: `${getApiBaseUrl()}/api`,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = String(error.config?.url || '')
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register')
    const token = localStorage.getItem('token') || ''
    if (error.response?.status === 401 && !isAuthAttempt && !token.startsWith('local-') && !token.startsWith('demo-')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }

    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        error.message = 'Server connection timed out. The backend may be waking up from sleep (Render free tier), please wait a few seconds and try again.'
      } else if (error.message === 'Network Error' || !error.message) {
        error.message = 'Unable to connect to AgriMarket server. The backend may be waking up from sleep, please wait a moment and try again.'
      }
    }

    return Promise.reject(error)
  }
)

export default api
