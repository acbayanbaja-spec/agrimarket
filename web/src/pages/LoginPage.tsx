import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const LoginPage = () => {
  const { login, isAuthenticated, ready, hasRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (ready && isAuthenticated) {
    const destination = from || (hasRole('admin') ? '/admin-dashboard' : hasRole('delivery') ? '/delivery' : hasRole('seller') ? '/seller-dashboard' : '/marketplace')
    return <Navigate to={destination} replace />
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const nextUser = await login(email.trim(), password)
      const roles = nextUser.roles
      const destination = from || (roles.includes('admin') ? '/admin-dashboard' : roles.includes('delivery') ? '/delivery' : roles.includes('seller') ? '/seller-dashboard' : '/marketplace')
      navigate(destination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell grid lg:grid-cols-2 gap-10 items-center">
      <div className="hidden lg:block rounded-3xl overflow-hidden min-h-[520px] bg-cover bg-center" style={{ backgroundImage: "url('/images/farm.jpg')" }}>
        <div className="h-full bg-primary-900/50 p-10 text-white flex flex-col justify-end">
          <h2 className="text-4xl font-bold">Welcome back to the farm stall.</h2>
          <p className="mt-3 text-primary-100">Buyers, sellers, and admins all use the same door. Your dashboard waits after you sign in.</p>
        </div>
      </div>
      <div className="card max-w-md mx-auto w-full">
        <div className="flex items-center gap-2 mb-6">
          <Leaf className="text-primary-600" />
          <h1 className="text-3xl font-bold">Log in</h1>
        </div>
        <p className="text-gray-600 mb-6">Use your AgriMarket email. Demo accounts work even if the API is waking up.</p>
        {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required className="input-field" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@farm.ph" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" required className="input-field" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-primary-700 font-medium">Forgot password?</Link>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Log in'}
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-6">
          New here? <Link to="/register" className="text-primary-700 font-semibold">Create an account</Link>
        </p>
        <div className="mt-6 rounded-xl bg-soil-50 p-4 text-xs text-gray-600 space-y-1">
          <p className="font-semibold text-gray-800">Demo access</p>
          <p>Admin: admin@agrimarket.com / admin123</p>
          <p>Seller: seller@agrimarket.com / seller123</p>
          <p>Buyer: buyer@agrimarket.com / buyer123</p>
          <p>Delivery: driver@agrimarket.com / driver123</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
