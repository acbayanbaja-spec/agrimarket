import { Link } from 'react-router-dom'
import { categories } from '../data/catalog'
import { useStore } from '../context/StoreContext'
import { scrollToTopNow } from '../components/ScrollToTop'

const CategoriesPage = () => {
  const { products } = useStore()

  return (
    <div className="page-shell">
      <h1 className="text-4xl font-bold mb-2">Categories</h1>
      <p className="text-gray-600 mb-8">Browse the stall by what you need this week.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const count = products.filter((product) => {
            if (product.category === category.name) return true
            if (category.name === 'Rice' && (product.category === 'Rice & Grains' || product.category === 'Rice')) return true
            if (category.name === 'Grains' && (product.category === 'Grains')) return true
            if (category.name === 'Fish' && (product.category === 'Fisheries & Aquaculture' || product.category === 'Fish')) return true
            if (category.name === 'Farm Supplies' && (product.category === 'Agricultural Supplies' || product.category === 'Farm Supplies' || product.category === 'Seeds')) return true
            return false
          }).length

          const sellerInfo = (category as any).seller

          return (
            <Link key={category.name} to={`/marketplace?category=${encodeURIComponent(category.name)}`} onClick={scrollToTopNow} className="card hover:shadow-soft hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div>
                <img src={category.image} alt="" className="h-24 w-full rounded-xl object-cover mb-3" />
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{category.name}</h2>
                  <span className="text-xl">{category.emoji}</span>
                </div>
                <p className="text-gray-600 text-sm mt-1">{category.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-primary-700 font-semibold">{count} listing{count === 1 ? '' : 's'}</span>
                {sellerInfo && (
                  <span className="bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
                    {sellerInfo}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default CategoriesPage
