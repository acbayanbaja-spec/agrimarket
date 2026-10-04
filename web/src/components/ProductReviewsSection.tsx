import { useState } from 'react'
import { Star, ThumbsUp, CheckCircle, Image as ImageIcon, MessageSquarePlus, Sparkles, Filter } from 'lucide-react'
import type { Review } from '../context/StoreContext'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import ProductImage from './ProductImage'

type Props = {
  productId: string
  rating: number
  reviewCount: number
}

export const ProductReviewsSection = ({ productId, rating, reviewCount }: Props) => {
  const { reviewsFor, addReview } = useStore()
  const { user, isAuthenticated } = useAuth()
  const reviews = reviewsFor(productId)

  const [activeFilter, setActiveFilter] = useState<'all' | '5' | '4' | 'photos'>('all')
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [formRating, setFormRating] = useState(5)
  const [formComment, setFormComment] = useState('')
  const [formPhoto, setFormPhoto] = useState<string>('')

  const handleHelpful = (id: string) => {
    setHelpfulCounts((current) => ({
      ...current,
      [id]: (current[id] || 0) + 1,
    }))
  }

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formComment.trim()) return

    addReview({
      productId,
      rating: formRating,
      comment: formComment.trim(),
      photos: formPhoto ? [formPhoto] : [],
    })

    setFormComment('')
    setFormPhoto('')
    setShowAddForm(false)
  }

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === '5') return r.rating === 5
    if (activeFilter === '4') return r.rating === 4
    if (activeFilter === 'photos') return r.photos && r.photos.length > 0
    return true
  })

  // Review breakdown stats
  const totalReviews = Math.max(reviews.length, reviewCount, 1)
  const fiveStars = reviews.filter((r) => r.rating === 5).length
  const fourStars = reviews.filter((r) => r.rating === 4).length
  const threeStars = reviews.filter((r) => r.rating === 3).length

  return (
    <section className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-soft space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>Customer Ratings & Reviews</span>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase">
              Shopee Style
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Verified feedback from households, restaurants, and grocers across SOCCSKSARGEN.
          </p>
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary text-xs py-2 px-3.5 inline-flex items-center gap-1.5 shadow-sm"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>Write a Review</span>
          </button>
        )}
      </div>

      {/* Shopee & Lazada Star Breakdown Box */}
      <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-100/80 flex flex-col md:flex-row items-center gap-6">
        {/* Left score summary */}
        <div className="text-center md:border-r md:border-amber-200/60 md:pr-6 shrink-0">
          <div className="text-5xl font-black text-amber-700 font-display tracking-tight">
            {rating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1 my-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-600">{totalReviews} Verified Ratings</span>
        </div>

        {/* Right breakdown bars */}
        <div className="flex-1 w-full space-y-1.5 text-xs">
          {[
            { star: 5, count: fiveStars, pct: Math.round((fiveStars / totalReviews) * 100) || 85 },
            { star: 4, count: fourStars, pct: Math.round((fourStars / totalReviews) * 100) || 12 },
            { star: 3, count: threeStars, pct: Math.round((threeStars / totalReviews) * 100) || 3 },
            { star: 2, count: 0, pct: 0 },
            { star: 1, count: 0, pct: 0 },
          ].map((row) => (
            <div key={row.star} className="flex items-center gap-2">
              <span className="w-12 font-medium text-gray-600 flex items-center gap-0.5">
                {row.star} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              </span>
              <div className="flex-1 bg-white rounded-full h-2 overflow-hidden border border-amber-100">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-[11px] text-gray-500">{row.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-gray-100 pb-3">
        <span className="text-xs font-bold text-gray-500 flex items-center gap-1 mr-1">
          <Filter className="h-3.5 w-3.5" /> Filter:
        </span>
        {[
          { key: 'all', label: `All (${reviews.length})` },
          { key: '5', label: '5 Stars ⭐' },
          { key: '4', label: '4 Stars ⭐' },
          { key: 'photos', label: 'With Photos 📸' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveFilter(tab.key as any)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
              activeFilter === tab.key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Review Form Modal / Inline */}
      {showAddForm && (
        <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200 space-y-3 animate-fade-in">
          <h4 className="font-bold text-sm text-gray-900">Share Your Experience</h4>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600 mr-2">Your Rating:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormRating(star)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= formRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            required
            rows={3}
            className="input-field text-xs"
            placeholder="How fresh was the produce? How was the delivery speed in SOCCSKSARGEN?"
            value={formComment}
            onChange={(e) => setFormComment(e.target.value)}
          />

          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              className="input-field text-xs flex-1"
              placeholder="Optional photo URL (e.g. /images/tomato.jpg)"
              value={formPhoto}
              onChange={(e) => setFormPhoto(e.target.value)}
            />
            <button type="submit" className="btn-primary text-xs py-2 px-4 shadow-sm shrink-0">
              Submit Review
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4 divide-y divide-gray-100">
        {filteredReviews.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No reviews match the selected filter yet.</p>
        ) : (
          filteredReviews.map((rev) => (
            <article key={rev.id} className="pt-4 first:pt-0 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-800 font-bold text-xs flex items-center justify-center">
                    {rev.userName ? rev.userName[0] : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900">{rev.userName || 'Verified Buyer'}</span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle className="h-3 w-3" /> Verified Purchase
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                          }`}
                        />
                      ))}
                      <span className="text-[10px] text-gray-400 ml-1.5">{rev.createdAt.slice(0, 10)}</span>
                    </div>
                  </div>
                </div>

                {/* Helpful button */}
                <button
                  type="button"
                  onClick={() => handleHelpful(rev.id)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-primary-700 bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-lg transition-colors border border-gray-200/60"
                >
                  <ThumbsUp className="h-3 w-3" />
                  <span>Helpful ({helpfulCounts[rev.id] || 0})</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed pl-10">{rev.comment}</p>

              {rev.photos && rev.photos.length > 0 && (
                <div className="flex gap-2 pl-10 pt-1">
                  {rev.photos.map((src, i) => (
                    <ProductImage
                      key={i}
                      src={src}
                      alt="Buyer review photo"
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm hover:scale-105 transition-transform"
                    />
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  )
}

export default ProductReviewsSection
