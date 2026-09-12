import { categories } from '../data/catalog'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import ProductImage from '../components/ProductImage'
import Seo from '../components/Seo'

const FeedPage = () => {
  const { posts, followedCategories, followCategory, unfollowCategory } = useStore()
  const { isAuthenticated } = useAuth()
  const visible = posts.filter((post) => followedCategories.length === 0 || followedCategories.includes(post.category))

  return (
    <div className="page-shell max-w-3xl">
      <Seo title="Harvest feed" description="Facebook-style farm posts tagged by agri category. Follow a category to get notified." path="/feed" />
      <h1 className="text-4xl font-bold mb-2">Harvest feed</h1>
      <p className="text-gray-600 mb-6">Sellers post like a timeline and tag a category. Follow Vegetables or Fruits to get notified with the rest of that aisle.</p>
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category) => {
          const on = followedCategories.includes(category.name)
          return (
            <button
              key={category.name}
              type="button"
              className={`px-4 py-2 rounded-full text-sm font-semibold ${on ? 'bg-primary-600 text-white' : 'bg-white border'}`}
              onClick={() => (on ? unfollowCategory(category.name) : followCategory(category.name))}
            >
              {category.emoji} {category.name}
            </button>
          )
        })}
      </div>
      {!isAuthenticated && <p className="text-sm text-gray-500 mb-4">Log in to keep your follows across sessions.</p>}
      <div className="space-y-4">
        {visible.map((post) => (
          <article key={post.id} className="card animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold">{post.sellerName}</p>
                <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()} · {post.category}</p>
              </div>
              <span className="chip bg-primary-50 text-primary-800">{post.category}</span>
            </div>
            <p className="text-gray-800 leading-relaxed">{post.body}</p>
            {post.photos[0] && <ProductImage src={post.photos[0]} alt="" className="mt-4 w-full h-56 object-cover rounded-2xl" />}
          </article>
        ))}
      </div>
    </div>
  )
}

export default FeedPage
