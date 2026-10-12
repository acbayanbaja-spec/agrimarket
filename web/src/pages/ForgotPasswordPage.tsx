import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { getErrorMessage } from '../lib/utils'
import Seo from '../components/Seo'
import { Lock, Mail, KeyRound, CheckCircle2 } from 'lucide-react'

const ForgotPasswordPage = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const tokenParam = params.get('token') || ''

  const [step, setStep] = useState<'request' | 'reset'>(tokenParam ? 'reset' : 'request')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState(tokenParam)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [previewToken, setPreviewToken] = useState('')

  useEffect(() => {
    if (tokenParam) {
      setToken(tokenParam)
      setStep('reset')
    }
  }, [tokenParam])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const res = await api.post<{ success: boolean; message: string; data?: { resetToken?: string } }>('/auth/forgot-password', {
        email: email.trim(),
      })
      setMessage(res.data?.message || 'Password reset instructions have been dispatched.')
      if (res.data?.data?.resetToken) {
        setPreviewToken(res.data.data.resetToken)
        setToken(res.data.data.resetToken)
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Could not request password reset. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post<{ success: boolean; message: string }>('/auth/reset-password', {
        token: token.trim(),
        password,
      })
      setMessage(res.data?.message || 'Password has been updated successfully!')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update password. Reset token may have expired.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell max-w-md">
      <Seo title="Reset Password" description="Securely recover your AgriMarket account password." path="/forgot-password" />
      <div className="card space-y-6 animate-fade-up">
        <div className="flex items-center gap-2">
          <span className="h-10 w-10 rounded-2xl bg-primary-600 text-white grid place-items-center shadow-glow">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">
              {step === 'request' ? 'Reset your password' : 'Set new password'}
            </h1>
            <p className="text-xs text-gray-500">AgriMarket Secure Account Recovery</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 text-sm flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter the email address registered with your AgriMarket buyer, seller, or driver account.
            </p>
            <div>
              <label className="label" htmlFor="email">
                Registered Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="e.g. buyer@agrimarket.com"
                  className="input-field pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail className="h-4 w-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full min-h-[44px]" disabled={loading}>
              {loading ? 'Sending instructions...' : 'Send reset link'}
            </button>

            {previewToken && (
              <div className="bg-primary-50/70 border border-primary-200 rounded-2xl p-4 text-xs space-y-2">
                <p className="font-bold text-primary-900">Security Test Preview Token Generated:</p>
                <p className="font-mono text-[11px] text-gray-700 break-all bg-white p-2 rounded-lg border border-primary-100">
                  {previewToken}
                </p>
                <button
                  type="button"
                  onClick={() => setStep('reset')}
                  className="btn-primary py-1.5 px-3 text-xs w-full"
                >
                  Proceed to enter new password →
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setStep('reset')}
                className="text-primary-700 hover:underline font-semibold"
              >
                Already have a reset token?
              </button>
              <Link to="/login" className="text-gray-500 hover:text-gray-700">
                Back to login
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="label" htmlFor="token">
                Reset Token
              </label>
              <input
                id="token"
                type="text"
                required
                placeholder="Paste the reset token"
                className="input-field font-mono text-xs"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="newPassword">
                New Password (minimum 8 characters)
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={8}
                  className="input-field pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="h-4 w-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  className="input-field pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Lock className="h-4 w-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full min-h-[44px]" disabled={loading}>
              {loading ? 'Updating password...' : 'Update password & log in'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-primary-700 hover:underline"
              >
                ← Request new token
              </button>
              <Link to="/login" className="text-gray-500 hover:text-gray-700">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
