import { useState } from 'react'
import { Link } from 'react-router-dom'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setSent(true)
  }

  return (
    <div className="page-shell max-w-md">
      <div className="card">
        <h1 className="text-3xl font-bold mb-2">Reset your password</h1>
        {sent ? (
          <>
            <p className="text-gray-600 mb-6">
              If an account exists for {email}, we sent reset instructions. Check spam if you do not see it within a few minutes.
            </p>
            <Link to="/login" className="btn-primary">Back to login</Link>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-gray-600">Enter the email on your AgriMarket account.</p>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required className="input-field" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <button type="submit" className="btn-primary w-full">Send reset link</button>
            <Link to="/login" className="block text-center text-sm text-primary-700 font-semibold">Back to login</Link>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
