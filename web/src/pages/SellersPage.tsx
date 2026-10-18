import { Link } from 'react-router-dom'
import { sellers } from '../data/catalog'
import { useStore } from '../context/StoreContext'

const SellersPage = () => {
  const { products } = useStore()
  const liveSellers = sellers.map((seller) => ({
    ...seller,
    products: products.filter(
      (product) =>
        product.sellerId === seller.id ||
        product.seller === seller.name ||
        product.sellerUserId === seller.sellerUserId ||
        ((seller as any).category && product.category === (seller as any).category)
    ).length,
  }))

  return (
    <div className="page-shell">
      <h1 className="text-4xl font-bold mb-2">Category Sellers</h1>
      <p className="text-gray-600 mb-8">Dedicated farms, co-ops, and mills providing direct harvest approval across SOCCSKSARGEN.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {liveSellers.map((seller) => (
          <Link key={seller.id} to={`/marketplace?seller=${encodeURIComponent(seller.name)}`} className="card hover:shadow-soft hover:-translate-y-0.5 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-semibold text-gray-900">{seller.name}</h2>
                {(seller as any).category && (
                  <span className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                    {(seller as any).category}
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1 text-sm">{seller.location}</p>
              {(seller as any).contactPerson && (
                <p className="text-xs text-gray-500 mt-2">
                  Manager: <span className="text-gray-700 font-medium">{(seller as any).contactPerson}</span>
                </p>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="text-primary-700 font-semibold">{seller.products} product{seller.products === 1 ? '' : 's'} listed</span>
              <span className="flex items-center gap-1 font-medium text-amber-600">
                ★ {seller.rating} rating
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default SellersPage
