import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Bike, Leaf, Lock, ShieldCheck, Sparkles, Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const demos = [
  { label: 'Buyer', email: 'buyer@agrimarket.com', password: 'buyer123', hint: 'Shop SOCCSKSARGEN harvests' },
  { label: 'Seller (Green Valley)', email: 'seller@agrimarket.com', password: 'seller123', hint: 'Confirm tomato & rice orders' },
  { label: 'Seller (Poultry)', email: 'seller.poultry@agrimarket.com', password: 'seller123', hint: 'Confirm egg & poultry orders' },
  { label: 'Admin', email: 'admin@agrimarket.com', password: 'admin123', hint: 'Audit KYC & moderate catalog' },
  { label: 'Rider', email: 'driver@agrimarket.com', password: 'driver123', hint: 'Pick up confirmed crates' },
]

function homeFor(roles: string[]) {
  if (roles.includes('admin')) return '/admin-dashboard'
  if (roles.includes('delivery')) return '/delivery'
  if (roles.includes('seller')) return '/seller-dashboard'
  return '/marketplace'
}

function destinationFor(from: string | undefined, roles: string[]) {
  const shopPaths = ['/checkout', '/cart']
  if (from && !(roles.includes('delivery') && shopPaths.includes(from)) && !(roles.includes('seller') && shopPaths.includes(from)) && !(roles.includes('admin') && shopPaths.includes(from))) {
    return from
  }
  return homeFor(roles)
}

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
    const roles = ['admin', 'delivery', 'seller', 'buyer'].filter((role) => hasRole(role))
    return <Navigate to={destinationFor(from, roles)} replace />
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const nextUser = await login(email.trim(), password)
      navigate(destinationFor(from, nextUser.roles))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell grid lg:grid-cols-2 gap-8 items-center">
      <div className="relative overflow-hidden rounded-[2rem] min-h-[280px] lg:min-h-[560px] bg-gradient-to-br from-primary-800 via-primary-700 to-soil-900 text-white p-8 animate-fade-up">
        <div className="absolute -right-8 top-8 h-36 w-36 rounded-full bg-secondary-400/30 blur-2xl animate-float" />
        <div className="absolute left-10 bottom-10 h-24 w-24 rounded-full bg-white/10 blur-xl animate-float" style={{ animationDelay: '1s' }} />
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
          <Leaf className="h-4 w-4" /> SOCCSKSARGEN only
        </p>
        <h2 className="relative text-3xl sm:text-4xl font-bold mt-6 max-w-md">Harvests from farms in Region XII, delivered by local riders.</h2>
        <p className="relative mt-4 text-primary-100 max-w-md">
          Log in as a buyer or seller to open the marketplace. Guests cannot place orders until they have an account.
        </p>
        <ul className="relative mt-8 space-y-3 text-sm">
          {[
            { icon: Store, text: 'Sellers confirm every checkout before a rider is dispatched' },
            { icon: Bike, text: 'Riders get buyer info and pickup pin only when the crate is ready' },
            { icon: ShieldCheck, text: 'Buyers become sellers after a valid ID is approved by admin' },
          ].map((item) => (
            <li key={item.text} className="flex gap-3 items-start">
              <item.icon className="h-5 w-5 shrink-0 mt-0.5" />
              {item.text}
            </li>
          ))}
        </ul>
      </div>
      <div className="card max-w-md mx-auto w-full animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="h-10 w-10 rounded-2xl bg-primary-600 text-white grid place-items-center shadow-glow animate-pop">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="text-3xl font-bold">Log in</h1>
        </div>
        <p className="text-gray-600 mb-6">Use your AgriMarket email. Shop Now opens only after a buyer or seller session.</p>
        {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required className="input-field" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@farm.ph" autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" required className="input-field" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-primary-700 font-medium">Forgot password?</Link>
          </div>
          <button type="submit" className="btn-primary w-full min-h-[48px]" disabled={loading}>
            {loading ? 'Signing in…' : 'Log in to shop'}
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-6">
          New here? <Link to="/register" className="text-primary-700 font-semibold">Create a buyer account</Link>
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          {demos.map((demo) => (
            <button
              key={demo.email}
              type="button"
              className="rounded-2xl border border-gray-100 bg-soil-50 p-3 text-left hover:border-primary-300 transition-colors"
              onClick={() => {
                setEmail(demo.email)
                setPassword(demo.password)
              }}
            >
              <p className="text-xs font-bold text-primary-800 inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> {demo.label}</p>
              <p className="text-[11px] text-gray-500 mt-1">{demo.hint}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoginPage
