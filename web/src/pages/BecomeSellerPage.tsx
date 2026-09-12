import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { fileToDataUrl } from '../lib/utils'
import { categories } from '../data/catalog'
import Seo from '../components/Seo'

const BecomeSellerPage = () => {
  const { hasRole } = useAuth()
  const { submitApplication, myApplication } = useStore()
  const [form, setForm] = useState({
    farmName: '',
    location: '',
    description: '',
    phone: '',
    categories: categories[0].name,
  })
  const [idDocument, setIdDocument] = useState('')
  const [permitDocument, setPermitDocument] = useState('')
  const [farmPhoto, setFarmPhoto] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  if (hasRole('seller') || hasRole('admin')) {
    return (
      <div className="page-shell max-w-xl text-center">
        <div className="card">
          <h1 className="text-3xl font-bold mb-3">You already have a stall</h1>
          <p className="text-gray-600 mb-6">You can still shop as a buyer. Open seller tools to list harvests.</p>
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
            Admins review ID, barangay or DTI permit, farm photo, and pickup details before you can list.
          </p>
          <Link to="/profile" className="btn-primary">Back to profile</Link>
        </div>
      </div>
    )
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!idDocument || !permitDocument || !farmPhoto) {
      setError('Upload a government ID, a barangay/business permit, and a farm photo.')
      return
    }
    if (form.description.trim().length < 40) {
      setError('Tell us at least 40 characters about what you grow.')
      return
    }
    submitApplication({
      farmName: form.farmName.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      phone: form.phone.trim(),
      categories: form.categories,
      idDocument,
      permitDocument,
      farmPhoto,
    })
    setDone(true)
  }

  const upload = (setter: (value: string) => void) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) setter(await fileToDataUrl(file))
  }

  return (
    <div className="page-shell max-w-2xl">
      <Seo title="Become a seller" description="Buyers can sell after submitting ID, permit, and farm photos for admin review." path="/become-seller" />
      <div className="card">
        <h1 className="text-3xl font-bold mb-2">Become a seller</h1>
        <p className="text-gray-600 mb-6">Sellers remain buyers. Complete the requirements so an admin can approve your stall.</p>
        <ol className="text-sm text-gray-700 space-y-1 mb-6 list-decimal pl-5">
          <li>Valid government ID</li>
          <li>Barangay clearance or DTI / business permit</li>
          <li>Farm or stall photo</li>
          <li>Pickup location and working mobile number</li>
          <li>Primary product category</li>
        </ol>
        {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
        {myApplication?.status === 'Rejected' && (
          <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
            Your previous application was declined. Update documents and submit again.
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <input required className="input-field" placeholder="Farm or stall name" value={form.farmName} onChange={(event) => setForm({ ...form, farmName: event.target.value })} />
          <input required className="input-field" placeholder="Province / city" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          <input required className="input-field" placeholder="Contact mobile" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <select className="input-field" value={form.categories} onChange={(event) => setForm({ ...form, categories: event.target.value })}>
            {categories.map((category) => <option key={category.name}>{category.name}</option>)}
          </select>
          <textarea required rows={5} className="input-field" placeholder="What you grow or sell" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <label className="label">Government ID</label>
          <input required type="file" accept="image/*" onChange={upload(setIdDocument)} />
          <label className="label">Barangay / business permit</label>
          <input required type="file" accept="image/*" onChange={upload(setPermitDocument)} />
          <label className="label">Farm photo</label>
          <input required type="file" accept="image/*" onChange={upload(setFarmPhoto)} />
          <button type="submit" className="btn-primary">Submit for review</button>
        </form>
      </div>
    </div>
  )
}

export default BecomeSellerPage
