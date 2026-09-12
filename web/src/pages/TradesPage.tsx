import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'

const TradesPage = () => {
  const { products, trades, offerTrade, respondTrade, myListings } = useStore()
  const { isAuthenticated, hasRole } = useAuth()
  const [params] = useSearchParams()
  const want = params.get('want') || products.find((product) => product.tradeable)?.id || ''
  const [wantId, setWantId] = useState(want)
  const [offerId, setOfferId] = useState(myListings[0]?.id || products.find((product) => product.tradeable)?.id || '')
  const [note, setNote] = useState('Even swap plus ₱50 on my side if weights differ.')
  const tradable = useMemo(() => products.filter((product) => product.tradeable), [products])
  const offerable = myListings.length ? myListings : tradable

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const from = products.find((product) => product.id === offerId)
    const to = products.find((product) => product.id === wantId)
    if (!from || !to) return
    offerTrade({
      fromProductId: from.id,
      fromProductName: from.name,
      toSellerId: to.sellerId,
      toProductId: to.id,
      toProductName: to.name,
      note,
    })
  }

  return (
    <div className="page-shell grid lg:grid-cols-2 gap-8">
      <Seo title="Trade board" description="Swap harvests with other farms. Tradable listings only." path="/trades" />
      <div>
        <h1 className="text-4xl font-bold mb-2">Trade board</h1>
        <p className="text-gray-600 mb-6">Swap crates instead of cash when both listings are marked tradable.</p>
        <form onSubmit={submit} className="card space-y-4">
          <label className="label">You offer</label>
          <select className="input-field" value={offerId} onChange={(event) => setOfferId(event.target.value)}>
            {offerable.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.seller}</option>)}
          </select>
          <label className="label">You want</label>
          <select className="input-field" value={wantId} onChange={(event) => setWantId(event.target.value)}>
            {tradable.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.seller}</option>)}
          </select>
          <textarea className="input-field" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
          <button type="submit" className="btn-primary" disabled={!isAuthenticated}>Send trade offer</button>
        </form>
      </div>
      <div className="space-y-4">
        {trades.length === 0 ? <div className="card">No trade offers yet.</div> : trades.map((trade) => (
          <article key={trade.id} className="card">
            <div className="flex gap-3 items-center">
              <ProductImage src={products.find((product) => product.id === trade.fromProductId)?.image} alt="" className="h-12 w-12 rounded object-cover" />
              <p className="font-semibold">{trade.fromName} offers {trade.fromProductName} for {trade.toProductName}</p>
            </div>
            <p className="text-sm text-gray-600 mt-2">{trade.note}</p>
            <p className="text-xs mt-2 font-semibold">{trade.status}</p>
            {trade.status === 'Open' && (hasRole('seller') || hasRole('admin')) && (
              <div className="flex gap-2 mt-3">
                <button type="button" className="btn-primary py-2" onClick={() => respondTrade(trade.id, 'Accepted')}>Accept</button>
                <button type="button" className="btn-outline py-2" onClick={() => respondTrade(trade.id, 'Declined')}>Decline</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

export default TradesPage
