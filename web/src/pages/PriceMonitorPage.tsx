import React, { useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Bell, TrendingDown, ArrowDownRight, Sparkles } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { formatPeso } from '../lib/utils'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'
import PriceAlertModal from '../components/PriceAlertModal'
import type { Product } from '../data/catalog'

const PriceMonitorPage = () => {
  const { products } = useStore()
  const [selectedProductForAlert, setSelectedProductForAlert] = useState<Product | null>(null)

  return (
    <div className="page-shell">
      <Seo title="Price monitor" description="Track weekly farm-gate prices across AgriMarket listings." path="/prices" />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">SOCCSKSARGEN Price Monitor</h1>
          <p className="text-gray-600 mt-2">
            Weekly farmgate & market price movements across Region 12 so buyers and farmers can time orders.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {products.map((product) => (
          <article key={product.id} className="card p-5 bg-white border border-gray-200/90 rounded-3xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <ProductImage src={product.image} alt={product.name} className="h-12 w-12 rounded-xl object-cover border border-gray-100" />
                <div>
                  <p className="font-extrabold text-sm text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{formatPeso(product.price)} / {product.unit} · {product.seller}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForAlert(product)}
                className="btn-outline py-1.5 px-3 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs hover:bg-amber-50 hover:border-amber-300 text-amber-800"
                title="Activate Price Drop Alert"
              >
                <Bell className="h-3.5 w-3.5 text-amber-600" />
                <span>Alert Me</span>
              </button>
            </div>

            <div className="h-40 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={product.priceHistory}>
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip
                    formatter={(value) => [formatPeso(Number(value)), 'Price']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line type="monotone" dataKey="price" stroke="#059669" strokeWidth={2.5} dot={{ r: 3, fill: '#059669' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        ))}
      </div>

      {selectedProductForAlert && (
        <PriceAlertModal
          isOpen={Boolean(selectedProductForAlert)}
          onClose={() => setSelectedProductForAlert(null)}
          product={{
            id: selectedProductForAlert.id,
            name: selectedProductForAlert.name,
            price: selectedProductForAlert.price,
            unit: selectedProductForAlert.unit,
          }}
        />
      )}
    </div>
  )
}

export default PriceMonitorPage
