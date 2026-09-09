import { Link } from 'react-router-dom'
import { categories } from '../data/catalog'
import { useStore } from '../context/StoreContext'

const CategoriesPage = () => {
  const { products } = useStore()

  return (
    <div className="page-shell">
      <h1 className="text-4xl font-bold mb-2">Categories</h1>
      <p className="text-gray-600 mb-8">Browse the stall by what you need this week.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const count = products.filter((product) => product.category === category.name).length
          return (
            <Link key={category.name} to={`/marketplace?category=${encodeURIComponent(category.name)}`} className="card hover:shadow-soft transition-shadow">
              <div className="text-4xl mb-3">{category.emoji}</div>
              <h2 className="text-xl font-semibold">{category.name}</h2>
              <p className="text-gray-600 text-sm mt-1">{category.description}</p>
              <p className="text-primary-700 font-semibold mt-4">{count} listing{count === 1 ? '' : 's'}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default CategoriesPage
