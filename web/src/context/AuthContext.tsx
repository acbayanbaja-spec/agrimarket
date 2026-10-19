import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { getErrorMessage } from '../lib/utils'
import { scrollToTopNow } from '../components/ScrollToTop'

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  phone?: string
  roles: string[]
}

interface AuthContextType {
  user: User | null
  token: string | null
  ready: boolean
  login: (email: string, password: string) => Promise<User>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>) => void
  addRole: (role: string) => void
  grantRole: (userId: number, role: string) => void
  isAuthenticated: boolean
  hasRole: (role: string) => boolean
}

export type RegisterPayload = {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

type LocalAccount = RegisterPayload & { id: number; roles: string[] }

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const LOCAL_USERS_KEY = 'agrimarket.localUsers'

const demoAccounts: LocalAccount[] = [
  { id: 1, email: 'admin@agrimarket.com', password: 'admin123', firstName: 'Admin', lastName: 'User', phone: '+639123456789', roles: ['admin'] },
  { id: 2, email: 'seller@agrimarket.com', password: 'seller123', firstName: 'Maria', lastName: 'Santos', phone: '+639171112233', roles: ['seller', 'buyer'] },
  { id: 3, email: 'buyer@agrimarket.com', password: 'buyer123', firstName: 'Juan', lastName: 'Cruz', phone: '+639189998877', roles: ['buyer'] },
  { id: 4, email: 'driver@agrimarket.com', password: 'driver123', firstName: 'Rico', lastName: 'Driver', phone: '+639175551111', roles: ['delivery'] },
  { id: 12, email: 'seller.koronadal@agrimarket.com', password: 'seller123', firstName: 'Juanita', lastName: 'Reyes', phone: '+639172223344', roles: ['seller', 'buyer'] },
  { id: 13, email: 'seller.midsayap@agrimarket.com', password: 'seller123', firstName: 'Eduardo', lastName: 'Dizon', phone: '+639173334455', roles: ['seller', 'buyer'] },
  { id: 14, email: 'seller.gensan@agrimarket.com', password: 'seller123', firstName: 'Roberto', lastName: 'Tan', phone: '+639174445566', roles: ['seller', 'buyer'] },
  { id: 15, email: 'seller.tacurong@agrimarket.com', password: 'seller123', firstName: 'Lilia', lastName: 'Mendoza', phone: '+639175556677', roles: ['seller', 'buyer'] },
  { id: 16, email: 'seller.poultry@agrimarket.com', password: 'seller123', firstName: 'Nestor', lastName: 'Aquino', phone: '+639176667788', roles: ['seller', 'buyer'] },
  { id: 17, email: 'seller.lakesebu@agrimarket.com', password: 'seller123', firstName: 'Danilo', lastName: 'Blaan', phone: '+639177778899', roles: ['seller', 'buyer'] },
  { id: 18, email: 'seller.dairy@agrimarket.com', password: 'seller123', firstName: 'Ramon', lastName: 'Valdez', phone: '+639178889900', roles: ['seller', 'buyer'] },
]

const sellerEmailAliases: Record<string, string> = {
  'seller.vegetables@agrimarket.com': 'seller@agrimarket.com',
  'seller.fruits@agrimarket.com': 'seller.midsayap@agrimarket.com',
  'seller.rice@agrimarket.com': 'seller.tacurong@agrimarket.com',
  'seller.grains@agrimarket.com': 'seller.koronadal@agrimarket.com',
  'seller.fish@agrimarket.com': 'seller.lakesebu@agrimarket.com',
  'seller.livestock@agrimarket.com': 'seller.dairy@agrimarket.com',
  'seller.supplies@agrimarket.com': 'seller.gensan@agrimarket.com',
}

function readLocalUsers(): LocalAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeLocalUsers(users: LocalAccount[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
}

function normalizeUser(raw: Record<string, unknown>, fallbackRoles: string[] = ['buyer']): User {
  const rolesRaw = raw.roles
  let roles = Array.isArray(rolesRaw)
    ? (rolesRaw as string[])
    : typeof rolesRaw === 'string'
      ? rolesRaw.split(',').map((role) => role.trim()).filter(Boolean)
      : fallbackRoles

  // Admin role is reserved exclusively for platform management; remove buyer role if present
  if (roles.includes('admin')) {
    roles = roles.filter((role) => role !== 'buyer')
  }

  return {
    id: Number(raw.id),
    email: String(raw.email),
    firstName: String(raw.firstName || raw.first_name || ''),
    lastName: String(raw.lastName || raw.last_name || ''),
    phone: raw.phone ? String(raw.phone) : undefined,
    roles,
  }
}

function persistSession(user: User, token: string) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

function approvedSellerIds(): number[] {
  try {
    const raw = localStorage.getItem('agrimarket.approvedSellers')
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

function withApprovedRoles(next: User): User {
  if (approvedSellerIds().includes(next.id) && !next.roles.includes('seller')) {
    return { ...next, roles: [...next.roles, 'seller'] }
  }
  return next
}

function findLocalAccount(email: string, password: string) {
  const normalized = email.trim().toLowerCase()
  const targetEmail = sellerEmailAliases[normalized] || normalized
  const all = [...readLocalUsers().reverse(), ...demoAccounts]
  return all.find((account) => {
    const accEmail = account.email.trim().toLowerCase()
    return (accEmail === targetEmail || accEmail === normalized) && account.password === password
  })
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(withApprovedRoles(JSON.parse(storedUser) as User))
    }
    setReady(true)
  }, [])

  const setSession = (nextUser: User, nextToken: string) => {
    setUser(nextUser)
    setToken(nextToken)
    persistSession(nextUser, nextToken)
  }

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim()
    try {
      const { data } = await api.post('/auth/login', { email: cleanEmail, password })
      const payload = data.data || data
      if (!payload?.token || !payload?.user) {
        throw new Error('Invalid response from server')
      }
      const nextUser = normalizeUser(payload.user)
      setSession(nextUser, payload.token)
      // Keep local credentials updated for offline / restart resilience
      const locals = readLocalUsers().filter((l) => l.email.trim().toLowerCase() !== cleanEmail.toLowerCase())
      writeLocalUsers([...locals, {
        email: cleanEmail,
        password,
        firstName: nextUser.firstName,
        lastName: nextUser.lastName,
        phone: nextUser.phone,
        id: nextUser.id,
        roles: nextUser.roles,
      }])
      return nextUser
    } catch (error: any) {
      const isNetworkError = !error?.response || error?.message?.includes('Network Error') || error?.code === 'ECONNABORTED' || error?.message?.includes('waking up')
      const isServerDown = error?.response?.status === 503 || error?.response?.status === 502 || error?.response?.status === 504
      const isAuthError = error?.response?.status === 401

      if (isNetworkError || isServerDown || isAuthError) {
        const localMatch = findLocalAccount(cleanEmail, password)
        if (localMatch) {
          // If the backend was reachable but returned 401 (e.g. backend was wiped or account was created during offline/local fallback),
          // silently auto-register/sync this account to the server now so both server & client are in sync
          if (isAuthError) {
            try {
              const regRes = await api.post('/auth/register', {
                email: localMatch.email,
                password,
                firstName: localMatch.firstName,
                lastName: localMatch.lastName,
                phone: localMatch.phone,
              })
              const regBody = regRes.data.data || regRes.data
              if (regBody?.token && regBody?.user) {
                const nextUser = normalizeUser(regBody.user)
                setSession(nextUser, regBody.token)
                return nextUser
              }
            } catch {
              // Silently proceed with local fallback session
            }
          }

          const nextUser: User = {
            id: localMatch.id,
            email: localMatch.email,
            firstName: localMatch.firstName,
            lastName: localMatch.lastName,
            phone: localMatch.phone,
            roles: localMatch.roles,
          }
          setSession(nextUser, `local-token-${Date.now()}`)
          return nextUser
        }
      }
      throw new Error(getErrorMessage(error, 'Invalid email or password.'))
    }
  }

  const register = async (payload: RegisterPayload) => {
    const cleanEmail = payload.email.trim()
    try {
      const { data } = await api.post('/auth/register', { ...payload, email: cleanEmail })
      const body = data.data || data
      if (!body?.token || !body?.user) {
        throw new Error('Registration failed')
      }
      const nextUser = normalizeUser(body.user)
      setSession(nextUser, body.token)
      // Save to local cache so credentials survive backend sleeping/restarts
      const locals = readLocalUsers().filter((l) => l.email.trim().toLowerCase() !== cleanEmail.toLowerCase())
      writeLocalUsers([...locals, {
        ...payload,
        email: cleanEmail,
        id: nextUser.id,
        roles: nextUser.roles,
      }])
    } catch (error: any) {
      const isNetworkError = !error?.response || error?.message?.includes('Network Error') || error?.code === 'ECONNABORTED' || error?.message?.includes('waking up')
      const isServerDown = error?.response?.status === 502 || error?.response?.status === 503 || error?.response?.status === 504
      if (isNetworkError || isServerDown) {
        const locals = readLocalUsers()
        if (locals.some((l) => l.email.trim().toLowerCase() === cleanEmail.toLowerCase())) {
          throw new Error('An account with this email already exists.')
        }
        const newLocal: LocalAccount = {
          ...payload,
          email: cleanEmail,
          id: Date.now(),
          roles: ['buyer'],
        }
        writeLocalUsers([...locals, newLocal])
        const nextUser: User = {
          id: newLocal.id,
          email: newLocal.email,
          firstName: newLocal.firstName,
          lastName: newLocal.lastName,
          phone: newLocal.phone,
          roles: newLocal.roles,
        }
        setSession(nextUser, `local-token-${Date.now()}`)
        return
      }
      throw new Error(getErrorMessage(error, 'Registration failed. Please check your details and try again.'))
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    scrollToTopNow()
    try {
      navigate('/login')
    } catch {
      window.location.href = '/login'
    }
  }

  const updateProfile = (updates: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>) => {
    if (!user) return
    const next = { ...user, ...updates }
    setUser(next)
    localStorage.setItem('user', JSON.stringify(next))
  }

  const persistAccountRoles = (userId: number, roles: string[]) => {
    const locals = readLocalUsers()
    if (!locals.some((account) => account.id === userId)) return
    writeLocalUsers(locals.map((account) => (account.id === userId ? { ...account, roles } : account)))
  }

  const addRole = (role: string) => {
    if (!user || user.roles.includes(role)) return
    const next = { ...user, roles: [...user.roles, role] }
    setUser(next)
    localStorage.setItem('user', JSON.stringify(next))
    persistAccountRoles(user.id, next.roles)
  }

  const grantRole = (userId: number, role: string) => {
    if (user && user.id === userId) {
      addRole(role)
      return
    }
    const locals = readLocalUsers()
    const target = locals.find((account) => account.id === userId)
    if (target && !target.roles.includes(role)) {
      persistAccountRoles(userId, [...target.roles, role])
    }
  }

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      ready,
      login,
      register,
      logout,
      updateProfile,
      addRole,
      grantRole,
      isAuthenticated: !!user,
      hasRole: (role: string) => user?.roles.includes(role) || false,
    }),
    [user, token, ready, navigate]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
