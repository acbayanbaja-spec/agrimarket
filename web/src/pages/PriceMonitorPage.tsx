import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../context/StoreContext'
import { formatPeso } from '../lib/utils'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'

const PriceMonitorPage = () => {
  const { products } = useStore()

  return (
    <div className="page-shell">
      <Seo title="Price monitor" description="Track weekly farm-gate prices across AgriMarket listings." path="/prices" />
      <h1 className="text-4xl font-bold mb-2">Price monitor</h1>
      <p className="text-gray-600 mb-8">Weekly farm-gate movement so buyers and sellers can time harvests.</p>
      <div className="grid md:grid-cols-2 gap-6">
        {products.map((product) => (
          <article key={product.id} className="card">
            <div className="flex items-center gap-3 mb-3">
              <ProductImage src={product.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-gray-500">{formatPeso(product.price)} / {product.unit}</p>
              </div>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={product.priceHistory}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip formatter={(value) => formatPeso(Number(value))} />
                  <Line type="monotone" dataKey="price" stroke="#15803d" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default PriceMonitorPage
