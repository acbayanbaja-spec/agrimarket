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
      setUser(JSON.parse(storedUser))
    }
    setReady(true)
  }, [])

  const setSession = (nextUser: User, nextToken: string) => {
    setUser(nextUser)
    setToken(nextToken)
    persistSession(nextUser, nextToken)
  }

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      const payload = data.data || data
      const nextUser = normalizeUser(payload.user)
      setSession(nextUser, payload.token)
      return nextUser
    } catch (error) {
      const local = findLocalAccount(email, password)
      if (local) {
        const nextUser = normalizeUser(local)
        setSession(nextUser, `local-${local.id}`)
        return nextUser
      }
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
      setSession(normalizeUser(localUser), `local-${localUser.id}`)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const updateProfile = (updates: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>) => {
    if (!user) return
    const next = { ...user, ...updates }
    setUser(next)
    localStorage.setItem('user', JSON.stringify(next))
  }

  const addRole = (role: string) => {
    if (!user || user.roles.includes(role)) return
    const next = { ...user, roles: [...user.roles, role] }
    setUser(next)
    localStorage.setItem('user', JSON.stringify(next))
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
