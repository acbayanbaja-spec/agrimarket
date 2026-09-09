import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'

const BecomeSellerPage = () => {
  const { hasRole } = useAuth()
  const { submitApplication, myApplication } = useStore()
  const [form, setForm] = useState({ farmName: '', location: '', description: '' })
  const [done, setDone] = useState(false)

  if (hasRole('seller') || hasRole('admin')) {
    return (
      <div className="page-shell max-w-xl text-center">
        <div className="card">
          <h1 className="text-3xl font-bold mb-3">You already have a stall</h1>
          <p className="text-gray-600 mb-6">Head to your seller tools to list harvests and fulfill orders.</p>
          <Link to="/seller-dashboard" className="btn-primary">Open seller dashboard</Link>
        </div>
      </div>
    )
  }

  if (myApplication?.status === 'Pending' || done) {
    return (
      <div className="page-shell max-w-xl text-center">
        <div className="card">
          <h1 className="text-3xl font-bold mb-3">Application received</h1>
          <p className="text-gray-600 mb-6">
            Admins review farm details before a stall goes live. Check your profile for status updates.
          </p>
          <Link to="/profile" className="btn-primary">Back to profile</Link>
        </div>
      </div>
    )
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    submitApplication({
      farmName: form.farmName.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
    })
    setDone(true)
  }

  return (
    <div className="page-shell max-w-2xl">
      <div className="card">
        <h1 className="text-3xl font-bold mb-2">Become a seller</h1>
        <p className="text-gray-600 mb-6">Tell us about your farm. An AgriMarket admin will review the application.</p>
        {myApplication?.status === 'Rejected' && (
          <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
            Your previous application was declined. You can submit again with more detail.
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="farmName">Farm or stall name</label>
            <input id="farmName" required className="input-field" value={form.farmName} onChange={(event) => setForm({ ...form, farmName: event.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="location">Province / city</label>
            <input id="location" required className="input-field" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="description">What you grow or sell</label>
            <textarea id="description" required rows={5} className="input-field" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <button type="submit" className="btn-primary">Submit application</button>
        </form>
      </div>
    </div>
  )
}

export default BecomeSellerPage
