import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../context/StoreContext'
import { formatPeso } from '../lib/utils'
import Seo from '../components/Seo'
import api from '../services/api'

type RoleMetrics = {
  role: string
  range?: string
  metrics: Record<string, number>
  series?: { label: string; daily: number; monthly: number; yearly: number }[]
  categories?: { name: string; value: number }[]
}

const AnalyticsPage = () => {
  const { salesSeries, categorySales, orders } = useStore()
  const [range, setRange] = useState<'7d' | '30d' | 'year' | 'all'>('all')
  const [serverStats, setServerStats] = useState<RoleMetrics | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(false)
  const chartSeries = serverStats?.series?.length ? serverStats.series : salesSeries
  const chartCategories = serverStats?.categories?.length
    ? serverStats.categories
    : categorySales.length
      ? categorySales
      : [{ name: 'No sales yet', value: 0 }]
  const today = chartSeries.reduce((sum, row) => sum + row.daily, 0)
  const month = chartSeries[new Date().getMonth()]?.monthly || 0
  const year = chartSeries[0]?.yearly || 0

  useEffect(() => {
    setLoading(true)
    api
      .get<{ data?: RoleMetrics }>(`/analytics/me?range=${range}`)
      .then((res) => {
        if (res.data?.data?.metrics) {
          setServerStats(res.data.data)
          setLoadError('')
        }
      })
      .catch((error: { message?: string }) => {
        setLoadError(error.message || 'Could not load server analytics. Showing local receipts instead.')
      })
      .finally(() => setLoading(false))
  }, [range])

  const metricEntries: Array<[string, number]> = serverStats
    ? (Object.entries(serverStats.metrics).slice(0, 6) as Array<[string, number]>)
    : [
        ['Today', today],
        ['This month', month],
        ['This year', year],
      ]

  const roleTitle =
    serverStats?.role === 'buyer'
      ? 'Spending analytics'
      : serverStats?.role === 'delivery'
        ? 'Delivery analytics'
        : 'Sales analytics'

  const formatMetric = (key: string, value: number) => {
    if (['gmv', 'sales', 'spent', 'Today', 'This month', 'This year'].includes(key)) {
      return formatPeso(value)
    }
    return String(value)
  }

  const exportMetrics = () => {
    const header = 'range,metric,value,exported_at\n'
    const now = new Date().toISOString()
    const body = metricEntries
      .map(([label, value]) => `"${range}","${label}",${value},"${now}"`)
      .join('\n')
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `agrimarket-${serverStats?.role || 'sales'}-${range}-metrics.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-shell space-y-8">
      <Seo title={roleTitle} description="Role-based marketplace metrics with charts and CSV export." path="/analytics" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">{roleTitle}</h1>
          <p className="text-gray-600 mt-2">
            {serverStats
              ? `Server-backed ${serverStats.role} metrics (${range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : range === 'year' ? 'Current Year' : 'All Time'}). Cancelled orders excluded from sales.`
              : loadError || 'Totals generate from confirmed marketplace receipts.'}
          </p>
        </div>

        {/* Date Filter & Export Row */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                range === item.id
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button type="button" className="btn-outline py-1.5 px-3 text-xs ml-2" onClick={exportMetrics}>
            Export CSV
          </button>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {metricEntries.map(([label, value]) => (
          <div key={label} className="card">
            <p className="text-sm text-gray-500 capitalize">{label.replace(/([A-Z])/g, ' $1')}</p>
            <p className="text-3xl font-bold mt-1">{formatMetric(label, Number(value))}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="font-semibold mb-4">{serverStats?.role === 'buyer' ? 'Monthly spending' : 'Monthly GMV'}</h2>
        <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartSeries}>
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
        <h2 className="font-semibold mb-4">{serverStats?.role === 'buyer' ? 'Spending by category' : 'Sales by category'}</h2>
        <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartCategories}>
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
