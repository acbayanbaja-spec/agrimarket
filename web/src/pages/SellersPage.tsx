import { Link } from 'react-router-dom'
import { sellers } from '../data/catalog'
import { useStore } from '../context/StoreContext'

const SellersPage = () => {
  const { products } = useStore()
  const liveSellers = sellers.map((seller) => ({
    ...seller,
    products: products.filter((product) => product.sellerId === seller.id || product.seller === seller.name).length,
  }))

  return (
    <div className="page-shell">
      <h1 className="text-4xl font-bold mb-2">Sellers</h1>
      <p className="text-gray-600 mb-8">Farms, co-ops, and supply houses currently listing on AgriMarket.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {liveSellers.map((seller) => (
          <Link key={seller.id} to={`/marketplace?seller=${encodeURIComponent(seller.name)}`} className="card hover:shadow-soft transition-shadow">
            <h2 className="text-xl font-semibold">{seller.name}</h2>
            <p className="text-gray-600 mt-1">{seller.location}</p>
            <p className="text-sm text-gray-500 mt-3">{seller.products} products · {seller.rating} rating</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default SellersPage
