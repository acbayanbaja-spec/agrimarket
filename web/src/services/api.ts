import axios from 'axios'
import { resolveApiOrigin } from '../config/apiOrigin'

const api = axios.create({
  baseURL: `${resolveApiOrigin()}/api`,
  timeout: 60000,
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
    const pathname = window.location.pathname
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')
    const isPublicPage = pathname === '/' || pathname.startsWith('/marketplace') || pathname.startsWith('/products') || pathname.startsWith('/categories') || pathname.startsWith('/prices') || pathname.startsWith('/trades')

    if (error.response?.status === 401) {
      const activeToken = localStorage.getItem('token')
      // If user had an active real session token that expired, clear it
      if (activeToken && !activeToken.startsWith('local-') && !activeToken.startsWith('demo-')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Only redirect to login if user was on a protected private route (e.g., /checkout, /orders, /profile)
        if (!isAuthAttempt && !isAuthPage && !isPublicPage) {
          window.location.href = '/login'
        }
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
