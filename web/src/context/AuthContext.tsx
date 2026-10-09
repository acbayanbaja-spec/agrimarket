import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { getErrorMessage } from '../lib/utils'

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
  { id: 1, email: 'admin@agrimarket.com', password: 'admin123', firstName: 'Admin', lastName: 'User', phone: '+639123456789', roles: ['admin', 'buyer'] },
  { id: 2, email: 'seller@agrimarket.com', password: 'seller123', firstName: 'Maria', lastName: 'Santos', phone: '+639171112233', roles: ['seller', 'buyer'] },
  { id: 3, email: 'buyer@agrimarket.com', password: 'buyer123', firstName: 'Juan', lastName: 'Cruz', phone: '+639189998877', roles: ['buyer'] },
  { id: 4, email: 'driver@agrimarket.com', password: 'driver123', firstName: 'Rico', lastName: 'Driver', phone: '+639175551111', roles: ['delivery'] },
  { id: 12, email: 'seller.koronadal@agrimarket.com', password: 'seller123', firstName: 'Juanita', lastName: 'Reyes', phone: '+639172223344', roles: ['seller', 'buyer'] },
  { id: 13, email: 'seller.midsayap@agrimarket.com', password: 'seller123', firstName: 'Eduardo', lastName: 'Dizon', phone: '+639173334455', roles: ['seller', 'buyer'] },
  { id: 14, email: 'seller.gensan@agrimarket.com', password: 'seller123', firstName: 'Roberto', lastName: 'Tan', phone: '+639174445566', roles: ['seller', 'buyer'] },
  { id: 15, email: 'seller.tacurong@agrimarket.com', password: 'seller123', firstName: 'Lilia', lastName: 'Mendoza', phone: '+639175556677', roles: ['seller', 'buyer'] },
  { id: 16, email: 'seller.poultry@agrimarket.com', password: 'seller123', firstName: 'Nestor', lastName: 'Aquino', phone: '+639176667788', roles: ['seller', 'buyer'] },
  { id: 17, email: 'seller.lakesebu@agrimarket.com', password: 'seller123', firstName: 'Danilo', lastName: 'Blaan', phone: '+639177778899', roles: ['seller', 'buyer'] },
]

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
  const roles = Array.isArray(rolesRaw)
    ? (rolesRaw as string[])
    : typeof rolesRaw === 'string'
      ? rolesRaw.split(',').map((role) => role.trim()).filter(Boolean)
      : fallbackRoles

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
  const all = [...demoAccounts, ...readLocalUsers()]
  return all.find((account) => account.email.toLowerCase() === email.toLowerCase() && account.password === password)
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    const local = findLocalAccount(email, password)
    if (local) {
      const nextUser = withApprovedRoles(normalizeUser(local))
      setSession(nextUser, `local-${local.id}`)
      return nextUser
    }
    try {
      const { data } = await api.post('/auth/login', { email, password })
      const payload = data.data || data
      const nextUser = withApprovedRoles(normalizeUser(payload.user))
      setSession(nextUser, payload.token)
      return nextUser
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to sign in. Check your email and password.'))
    }
  }

  const register = async (payload: RegisterPayload) => {
    try {
      const { data } = await api.post('/auth/register', payload)
      const body = data.data || data
      const nextUser = normalizeUser(body.user)
      setSession(nextUser, body.token)
    } catch (error) {
      const existing = [...demoAccounts, ...readLocalUsers()].find(
        (account) => account.email.toLowerCase() === payload.email.toLowerCase()
      )
      if (existing) {
        throw new Error('An account with this email already exists.')
      }

      const apiMessage = getErrorMessage(error, '')
      const networkFailed = !('response' in (error as object) && (error as { response?: unknown }).response)

      if (!networkFailed && apiMessage && !apiMessage.toLowerCase().includes('network')) {
        throw new Error(apiMessage)
      }

      const localUser: LocalAccount = {
        ...payload,
        id: Date.now(),
        roles: ['buyer'],
      }
      writeLocalUsers([...readLocalUsers(), localUser])
      setSession(withApprovedRoles(normalizeUser(localUser)), `local-${localUser.id}`)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
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
    [user, token, ready]
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
