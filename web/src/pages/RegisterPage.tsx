import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const RegisterPage = () => {
  const { register, isAuthenticated, ready } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (ready && isAuthenticated) {
    return <Navigate to="/marketplace" replace />
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      })
      navigate('/marketplace')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account')
    } finally {
      setLoading(false)
    }
  }

  const field = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  return (
    <div className="page-shell max-w-2xl">
      <div className="card">
        <h1 className="text-3xl font-bold mb-2">Create your AgriMarket account</h1>
        <p className="text-gray-600 mb-6">You’ll start as a buyer. Apply to sell later from your profile.</p>
        {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="firstName">First name</label>
            <input id="firstName" required minLength={2} className="input-field" value={form.firstName} onChange={field('firstName')} />
          </div>
          <div>
            <label className="label" htmlFor="lastName">Last name</label>
            <input id="lastName" required minLength={2} className="input-field" value={form.lastName} onChange={field('lastName')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required className="input-field" value={form.email} onChange={field('email')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="phone">Mobile (optional)</label>
            <input id="phone" className="input-field" value={form.phone} onChange={field('phone')} placeholder="09xxxxxxxxx" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" required minLength={8} className="input-field" value={form.password} onChange={field('password')} />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password" required className="input-field" value={form.confirm} onChange={field('confirm')} />
          </div>
          <button type="submit" className="btn-primary sm:col-span-2" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-6">
          Already have an account? <Link to="/login" className="text-primary-700 font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
