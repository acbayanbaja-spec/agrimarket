import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../context/StoreContext'
import { formatPeso } from '../lib/utils'
import Seo from '../components/Seo'

const AnalyticsPage = () => {
  const { salesSeries, categorySales, orders } = useStore()
  const today = salesSeries.reduce((sum, row) => sum + row.daily, 0)
  const month = salesSeries[new Date().getMonth()]?.monthly || 0
  const year = salesSeries[0]?.yearly || 0

  return (
    <div className="page-shell space-y-8">
      <Seo title="Sales analytics" description="Daily, monthly, and annual sales with line and bar charts." path="/analytics" />
      <div>
        <h1 className="text-4xl font-bold">Sales analytics</h1>
        <p className="text-gray-600 mt-2">Totals generate from confirmed marketplace receipts.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: 'Today', value: formatPeso(today) },
          { label: 'This month', value: formatPeso(month) },
          { label: 'This year', value: formatPeso(year) },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="font-semibold mb-4">Monthly GMV</h2>
        <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={salesSeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip formatter={(value) => formatPeso(Number(value))} />
            <Line type="monotone" dataKey="monthly" stroke="#16a34a" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <h2 className="font-semibold mb-4">Sales by category</h2>
        <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categorySales.length ? categorySales : [{ name: 'No sales yet', value: 0 }]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => formatPeso(Number(value))} />
            <Bar dataKey="value" fill="#ca8a04" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
      <p className="text-sm text-gray-500">{orders.length} receipts in the ledger.</p>
    </div>
  )
}

export default AnalyticsPage
