import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { fileToDataUrl } from '../lib/utils'
import { categories } from '../data/catalog'
import { ID_DOCUMENT_TYPES, soccsksargenPlaces } from '../data/locations'
import Seo from '../components/Seo'

const BecomeSellerPage = () => {
  const { hasRole } = useAuth()
  const { submitApplication, myApplication } = useStore()
  const [form, setForm] = useState({
    farmName: '',
    location: soccsksargenPlaces[0].label,
    description: '',
    phone: '',
    categories: categories[0].name,
    idType: ID_DOCUMENT_TYPES[0] as string,
    idNumber: '',
  })
  const [idDocument, setIdDocument] = useState('')
  const [permitDocument, setPermitDocument] = useState('')
  const [farmPhoto, setFarmPhoto] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  if (hasRole('seller') || hasRole('admin')) {
    return (
      <div className="page-shell max-w-xl text-center">
        <div className="card animate-fade-up">
          <h1 className="text-3xl font-bold mb-3">You already have a stall</h1>
          <p className="text-gray-600 mb-6">You can still shop as a buyer. Open seller tools to list harvests and confirm orders.</p>
          <Link to="/seller-dashboard" className="btn-primary">Open seller dashboard</Link>
        </div>
      </div>
    )
  }

  if (myApplication?.status === 'Pending' || done) {
    return (
      <div className="page-shell max-w-xl text-center">
        <div className="card animate-fade-up">
          <h1 className="text-3xl font-bold mb-3">Application received</h1>
          <p className="text-gray-600 mb-6">
            Admin is checking your {form.idType || 'valid ID'}, permit, farm photo, and SOCCSKSARGEN pickup point. You cannot list until this is approved.
          </p>
          <Link to="/profile" className="btn-primary">Back to profile</Link>
        </div>
      </div>
    )
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!idDocument || !permitDocument || !farmPhoto) {
      setError('Upload a valid ID photo, a barangay/business permit, and a farm photo.')
      return
    }
    if (form.idNumber.trim().length < 6) {
      setError('Enter the ID number as printed on your passport or government ID.')
      return
    }
    if (form.description.trim().length < 40) {
      setError('Tell us at least 40 characters about what you grow in SOCCSKSARGEN.')
      return
    }
    submitApplication({
      farmName: form.farmName.trim(),
      location: form.location,
      description: form.description.trim(),
      phone: form.phone.trim(),
      categories: form.categories,
      idType: form.idType,
      idNumber: form.idNumber.trim(),
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
      <Seo title="Become a seller" description="Buyers apply with a passport or valid ID. Admin approves before you can list in SOCCSKSARGEN." path="/become-seller" />
      <div className="card animate-fade-up">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary-800 bg-primary-50 rounded-full px-3 py-1 mb-4">
          <ShieldCheck className="h-4 w-4" /> Admin review required
        </p>
        <h1 className="text-3xl font-bold mb-2">Become a seller</h1>
        <p className="text-gray-600 mb-6">
          This is the buyer-to-seller desk. Upload a passport or other valid ID. An admin approves the request only if the documents are readable and your stall is inside SOCCSKSARGEN.
        </p>
        <ol className="text-sm text-gray-700 space-y-1 mb-6 list-decimal pl-5">
          <li>Valid ID: passport, PhilID, driver’s license, UMID, postal, voter’s, or PRC ID</li>
          <li>ID number matching the document</li>
          <li>Barangay clearance or DTI / business permit</li>
          <li>Farm or stall photo</li>
          <li>Pickup city inside SOCCSKSARGEN and a working mobile number</li>
        </ol>
        {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
        {myApplication?.status === 'Rejected' && (
          <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
            Your previous application was declined. Update documents and submit again.
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <input required className="input-field" placeholder="Farm or stall name" value={form.farmName} onChange={(event) => setForm({ ...form, farmName: event.target.value })} />
          <select required className="input-field" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })}>
            {soccsksargenPlaces.map((place) => (
              <option key={place.label} value={place.label}>{place.label}</option>
            ))}
          </select>
          <input required className="input-field" placeholder="Contact mobile" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <select className="input-field" value={form.categories} onChange={(event) => setForm({ ...form, categories: event.target.value })}>
            {categories.map((category) => <option key={category.name}>{category.name}</option>)}
          </select>
          <select className="input-field" value={form.idType} onChange={(event) => setForm({ ...form, idType: event.target.value })}>
            {ID_DOCUMENT_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
          <input required className="input-field" placeholder="ID / passport number" value={form.idNumber} onChange={(event) => setForm({ ...form, idNumber: event.target.value })} />
          <textarea required rows={5} className="input-field" placeholder="What you grow or sell in SOCCSKSARGEN" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <label className="label">Valid ID photo (passport, PhilID, etc.)</label>
          <input required type="file" accept="image/*" onChange={upload(setIdDocument)} />
          {idDocument && <img src={idDocument} alt="ID preview" className="h-20 rounded-lg object-cover" />}
          <label className="label">Barangay / business permit</label>
          <input required type="file" accept="image/*" onChange={upload(setPermitDocument)} />
          <label className="label">Farm photo</label>
          <input required type="file" accept="image/*" onChange={upload(setFarmPhoto)} />
          <button type="submit" className="btn-primary w-full min-h-[48px]">Submit for admin approval</button>
        </form>
      </div>
    </div>
  )
}

export default BecomeSellerPage
