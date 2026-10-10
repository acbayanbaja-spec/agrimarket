import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, CheckCircle2, AlertCircle, Clock, Sparkles, Store, ArrowRight, UploadCloud } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { fileToDataUrl } from '../lib/utils'
import { categories } from '../data/catalog'
import { ID_DOCUMENT_TYPES, soccsksargenPlaces } from '../data/locations'
import Seo from '../components/Seo'

const SAMPLE_KYC = {
  idDoc: '/images/farm.jpg',
  permitDoc: '/images/rice.jpg',
  farmPic: '/images/tomato.jpg',
}

const BecomeSellerPage = () => {
  const { user, hasRole } = useAuth()
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill user information if available
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        farmName: prev.farmName || (user.firstName ? `${user.firstName}'s Farm Stall` : ''),
        phone: prev.phone || user.phone || '+639189998877',
      }))
    }
  }, [user])

  // Pre-fill from existing application if needing revisions or rejected
  useEffect(() => {
    if (myApplication) {
      setForm((prev) => ({
        ...prev,
        farmName: myApplication.farmName || prev.farmName,
        location: myApplication.location || prev.location,
        description: myApplication.description || prev.description,
        phone: myApplication.phone || prev.phone,
        categories: myApplication.categories || prev.categories,
        idType: myApplication.idType || prev.idType,
        idNumber: myApplication.idNumber || prev.idNumber,
      }))
      if (myApplication.idDocument) setIdDocument(myApplication.idDocument)
      if (myApplication.permitDocument) setPermitDocument(myApplication.permitDocument)
      if (myApplication.farmPhoto) setFarmPhoto(myApplication.farmPhoto)
    }
  }, [myApplication])

  // Helper to fill sample verification documents for testing/demo
  const handleAutoFillDemo = () => {
    setError('')
    setForm({
      farmName: user?.firstName ? `${user.firstName}'s Agri Farm` : 'Highland Valley Farm',
      location: soccsksargenPlaces[0].label,
      description: 'We grow farm-fresh highland vegetables and organic root crops in SOCCSKSARGEN with weekly harvests.',
      phone: user?.phone || '+639189998877',
      categories: categories[0].name,
      idType: 'Philippine Passport',
      idNumber: 'P8920192A',
    })
    setIdDocument(SAMPLE_KYC.idDoc)
    setPermitDocument(SAMPLE_KYC.permitDoc)
    setFarmPhoto(SAMPLE_KYC.farmPic)
  }

  // If user is not logged in
  if (!user) {
    return (
      <div className="page-shell max-w-xl text-center">
        <Seo title="Become a Seller" description="Apply for farm stall verification in AgriMarket SOCCSKSARGEN." path="/become-seller" />
        <div className="card animate-fade-up space-y-4 py-8">
          <div className="w-16 h-16 mx-auto bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to become a seller</h1>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            Please log in or register a buyer account first. Your seller verification and farm listings will be linked to your account.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/login?from=/become-seller" className="btn-primary w-full sm:w-auto">
              Sign In to Continue
            </Link>
            <Link to="/register" className="btn-outline w-full sm:w-auto">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // If user is already approved as a seller
  const isApproved = hasRole('seller') || myApplication?.status === 'Approved'
  if (isApproved) {
    return (
      <div className="page-shell max-w-xl text-center">
        <Seo title="Seller Account Approved" description="Your seller account is verified in SOCCSKSARGEN." path="/become-seller" />
        <div className="card animate-fade-up space-y-4 py-8 border-2 border-primary-200">
          <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="inline-block text-xs uppercase tracking-wider font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            Verified Seller
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">You are an Approved Seller!</h1>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            {myApplication?.farmName || 'Your farm stall'} is officially verified. You can post harvests, set pricing and inventory, confirm orders, and chat directly with buyers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to="/seller-dashboard" className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2">
              <Store className="w-4 h-4" /> Open Seller Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/marketplace" className="btn-outline w-full sm:w-auto">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // If application is pending
  if (myApplication?.status === 'Pending' || done) {
    return (
      <div className="page-shell max-w-xl text-center">
        <Seo title="Application Pending" description="Your seller application is under review by AgriMarket admin." path="/become-seller" />
        <div className="card animate-fade-up space-y-4 py-8">
          <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center text-amber-700 animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <span className="inline-block text-xs uppercase tracking-wider font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
            Under Admin Review
          </span>
          <h1 className="text-2xl font-bold text-gray-900">Seller Application Submitted</h1>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            Thank you! An AgriMarket administrator is checking your <strong>{form.idType || 'valid ID'}</strong>, business permit, and farm photos.
          </p>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left text-xs space-y-2 text-gray-700 max-w-md mx-auto">
            <div><strong>Farm Name:</strong> {myApplication?.farmName || form.farmName}</div>
            <div><strong>Location:</strong> {myApplication?.location || form.location}</div>
            <div><strong>Specialization:</strong> {myApplication?.categories || form.categories}</div>
            <div><strong>Contact:</strong> {myApplication?.phone || form.phone}</div>
          </div>
          <p className="text-xs text-gray-500 italic max-w-md mx-auto">
            As soon as the admin approves your request, your device and all connected screens will automatically upgrade to the Seller role.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link to="/profile" className="btn-primary w-full sm:w-auto">
              View My Profile
            </Link>
            <Link to="/marketplace" className="btn-outline w-full sm:w-auto">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    const effectiveIdDoc = idDocument || SAMPLE_KYC.idDoc
    const effectivePermitDoc = permitDocument || SAMPLE_KYC.permitDoc
    const effectiveFarmPhoto = farmPhoto || SAMPLE_KYC.farmPic

    if (!form.farmName.trim()) {
      setError('Please provide a stall or farm name.')
      return
    }

    if (form.idNumber.trim().length < 4) {
      setError('Enter a valid ID number matching your government-issued ID.')
      return
    }

    if (form.description.trim().length < 20) {
      setError('Please provide at least 20 characters describing what you grow or sell in SOCCSKSARGEN.')
      return
    }

    setIsSubmitting(true)
    try {
      submitApplication({
        farmName: form.farmName.trim(),
        location: form.location,
        description: form.description.trim(),
        phone: form.phone.trim(),
        categories: form.categories,
        idType: form.idType,
        idNumber: form.idNumber.trim(),
        idDocument: effectiveIdDoc,
        permitDocument: effectivePermitDoc,
        farmPhoto: effectiveFarmPhoto,
      })
      setDone(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const upload = (setter: (value: string) => void) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const dataUrl = await fileToDataUrl(file)
      setter(dataUrl)
    }
  }

  return (
    <div className="page-shell max-w-2xl">
      <Seo
        title="Become a Seller"
        description="Apply with your Philippine valid ID to sell farm produce across SOCCSKSARGEN."
        path="/become-seller"
      />

      <div className="card animate-fade-up space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-primary-800 bg-primary-50 rounded-full px-3 py-1">
            <ShieldCheck className="h-4 w-4" /> SOCCSKSARGEN KYC Vetting
          </p>

          <button
            type="button"
            onClick={handleAutoFillDemo}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full transition-colors"
            title="Auto-fill sample documents and form data for instant demonstration"
          >
            <Sparkles className="w-3.5 h-3.5" /> Auto-fill Demo Verification
          </button>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Become a Seller</h1>
          <p className="text-gray-600 text-sm mt-1">
            Upgrade your buyer account into a verified regional seller. Once approved by an AgriMarket admin, you can list farm crops, receive direct buyer orders, and arrange pickups.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 text-red-700 p-3.5 text-sm flex items-start gap-2.5 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {myApplication?.status === 'Needs Revision' && (
          <div className="rounded-xl bg-amber-50 text-amber-900 p-4 text-sm flex items-start gap-3 border border-amber-300 shadow-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
            <div className="space-y-1.5 flex-1">
              <div className="font-bold text-amber-800 flex items-center justify-between">
                <span>Action Required: Admin Requested Revisions</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">Needs Revision</span>
              </div>
              <p className="text-amber-700 text-xs sm:text-sm">
                The administrator reviewed your application and requested the following modifications:
              </p>
              {myApplication.reviewNotes && (
                <div className="bg-white/90 border border-amber-200 rounded-lg p-3 font-medium text-amber-950 text-xs sm:text-sm shadow-inner">
                  "{myApplication.reviewNotes}"
                </div>
              )}
              <p className="text-xs text-amber-600">
                Please update the necessary fields or attach the requested documents below and resubmit.
              </p>
            </div>
          </div>
        )}

        {myApplication?.status === 'Rejected' && (
          <div className="rounded-xl bg-rose-50 text-rose-800 p-4 text-sm flex items-start gap-2.5 border border-rose-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
            <div className="space-y-1">
              <strong>Previous Application Declined:</strong>
              {myApplication.reviewNotes && (
                <div className="text-xs text-rose-700 mt-1 italic">
                  Admin reason: "{myApplication.reviewNotes}"
                </div>
              )}
              <p className="text-xs text-rose-600">Please make sure your government ID, farm details, and SOCCSKSARGEN location are accurate before resubmitting.</p>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Farm / Stall Name</label>
            <input
              required
              className="input-field"
              placeholder="e.g. Koronadal Valley Farm"
              value={form.farmName}
              onChange={(e) => setForm({ ...form, farmName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Pickup Location (SOCCSKSARGEN)</label>
              <select
                required
                className="input-field"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              >
                {soccsksargenPlaces.map((place) => (
                  <option key={place.label} value={place.label}>
                    {place.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Contact Mobile Number</label>
              <input
                required
                className="input-field"
                placeholder="+639189998877"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Primary Category</label>
              <select
                className="input-field"
                value={form.categories}
                onChange={(e) => setForm({ ...form, categories: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Government ID Type</label>
              <select
                className="input-field"
                value={form.idType}
                onChange={(e) => setForm({ ...form, idType: e.target.value })}
              >
                {ID_DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">ID / Passport Number</label>
            <input
              required
              className="input-field"
              placeholder="ID Number matching document"
              value={form.idNumber}
              onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Farm Story & Produce Description</label>
            <textarea
              required
              rows={3}
              className="input-field"
              placeholder="Tell buyers and admin what crops, fruits, or goods you grow in SOCCSKSARGEN..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* KYC Documents Section */}
          <div className="pt-2 border-t border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-primary-700" /> Verification KYC Attachments
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* ID Document */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 space-y-2">
                <label className="block text-xs font-semibold text-gray-700">1. Valid ID Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={upload(setIdDocument)}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary-100 file:text-primary-800"
                />
                {idDocument ? (
                  <img src={idDocument} alt="ID preview" className="w-full h-24 object-cover rounded-xl border border-gray-200" />
                ) : (
                  <div className="w-full h-24 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs">
                    No image uploaded
                  </div>
                )}
              </div>

              {/* Permit Document */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 space-y-2">
                <label className="block text-xs font-semibold text-gray-700">2. Barangay / Permit</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={upload(setPermitDocument)}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary-100 file:text-primary-800"
                />
                {permitDocument ? (
                  <img src={permitDocument} alt="Permit preview" className="w-full h-24 object-cover rounded-xl border border-gray-200" />
                ) : (
                  <div className="w-full h-24 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs">
                    No image uploaded
                  </div>
                )}
              </div>

              {/* Farm Photo */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 space-y-2">
                <label className="block text-xs font-semibold text-gray-700">3. Farm / Stall Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={upload(setFarmPhoto)}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary-100 file:text-primary-800"
                />
                {farmPhoto ? (
                  <img src={farmPhoto} alt="Farm preview" className="w-full h-24 object-cover rounded-xl border border-gray-200" />
                ) : (
                  <div className="w-full h-24 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs">
                    No image uploaded
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full min-h-[48px] flex items-center justify-center gap-2"
            >
              <Store className="w-4 h-4" />
              {isSubmitting
                ? 'Submitting Application...'
                : myApplication?.status === 'Needs Revision'
                ? 'Resubmit Revised Application'
                : 'Submit Application for Admin Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BecomeSellerPage
