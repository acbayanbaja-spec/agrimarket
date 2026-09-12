import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import Seo from '../components/Seo'

const ProfilePage = () => {
  const { user, updateProfile, hasRole, logout } = useAuth()
  const { myOrders, myApplication } = useStore()
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  })
  const [saved, setSaved] = useState(false)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    updateProfile({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim() || undefined,
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  const dashboard = hasRole('admin')
    ? '/admin-dashboard'
    : hasRole('seller')
      ? '/seller-dashboard'
      : hasRole('delivery')
        ? '/delivery'
        : '/orders'

  return (
    <div className="page-shell grid lg:grid-cols-3 gap-8">
      <Seo title="Profile" description="Manage your AgriMarket buyer, seller, or rider profile." path="/profile" />
      <div className="lg:col-span-2 card">
        <h1 className="text-3xl font-bold mb-2">Your profile</h1>
        <p className="text-gray-600 mb-6">{user?.email}</p>
        {saved && <div className="mb-4 rounded-xl bg-primary-50 text-primary-800 px-4 py-3 text-sm">Profile saved.</div>}
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="firstName">First name</label>
            <input id="firstName" required className="input-field" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="lastName">Last name</label>
            <input id="lastName" required className="input-field" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="phone">Mobile (used for rider SMS)</label>
            <input id="phone" className="input-field" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-3">
            <button type="submit" className="btn-primary">Save changes</button>
            <button type="button" className="btn-outline" onClick={logout}>Log out</button>
          </div>
        </form>
      </div>
      <aside className="space-y-4">
        <div className="card">
          <h2 className="font-semibold mb-3">Workspace</h2>
          <p className="text-sm text-gray-600 mb-4">Roles: {user?.roles.join(', ') || 'buyer'}</p>
          <div className="flex flex-col gap-2">
            <Link to={dashboard} className="btn-primary">Open dashboard</Link>
            <Link to="/orders" className="btn-outline">Purchase history ({myOrders.length})</Link>
            <Link to="/messages" className="btn-ghost">SMS inbox</Link>
            {!hasRole('seller') && !hasRole('admin') && !hasRole('delivery') && (
              <Link to="/become-seller" className="btn-ghost">
                {myApplication ? `Seller application: ${myApplication.status}` : 'Become a seller'}
              </Link>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}

export default ProfilePage
