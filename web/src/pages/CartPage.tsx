import { Link } from 'react-router-dom'
import { Coins, Truck, Leaf, Lock } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPeso } from '../lib/utils'
import { pointsFromSpend } from '../lib/commerce'
import ProductImage from '../components/ProductImage'
import QuantityStepper from '../components/QuantityStepper'

const CartPage = () => {
  const {
    items,
    selectedCount,
    selectedSubtotal,
    updateQuantity,
    removeItem,
    removeSelectedItems,
    toggleSelect,
    selectAll,
  } = useCart()
  const { hasRole, isAuthenticated } = useAuth()

  const allSelected = items.length > 0 && items.every((item) => item.selected !== false)
  const shipping = selectedSubtotal >= 500 || selectedCount === 0 ? 0 : 50
  const points = pointsFromSpend(selectedSubtotal)
  const total = selectedSubtotal + shipping

  if (hasRole('delivery')) {
    return (
      <div className="page-shell max-w-2xl text-center">
        <div className="card p-8 animate-fade-up">
          <Truck className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-3">Delivery Rider Desk</h1>
          <p className="text-gray-600 mb-6">
            Delivery riders do not place orders or maintain carts. Manage your assigned harvest parcels and regional drop-offs in the Delivery Command Desk.
          </p>
          <Link to="/delivery" className="btn-primary">Open Delivery Command Desk</Link>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="page-shell max-w-2xl text-center">
        <div className="card p-8 sm:p-12 animate-fade-up bg-white border border-gray-200/90 rounded-3xl shadow-soft">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold font-display text-gray-900 mb-3">Please Log In First</h1>
          <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
            Basket contents are protected and reserved for registered members. Please sign in to your buyer or seller account to view produce inside your basket and proceed to checkout.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" state={{ from: '/cart' }} className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold">
              Sign In to Your Account
            </Link>
            <Link to="/register" className="btn-outline inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold">
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="page-shell max-w-2xl text-center">
        <h1 className="text-3xl font-bold mb-3">Your basket is empty</h1>
        <p className="text-gray-600 mb-6">Add produce from the marketplace and it will wait here.</p>
        <Link to="/marketplace" className="btn-primary">Browse marketplace</Link>
      </div>
    )
  }

  return (
    <div className="page-shell grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Cart</h1>
          <span className="text-sm font-medium text-gray-500">
            {items.length} {items.length === 1 ? 'item' : 'items'} in basket
          </span>
        </div>

        {/* Master Select All Check Bar */}
        <div className="card flex items-center justify-between p-3.5 sm:p-4 bg-white border border-gray-200/90 rounded-2xl shadow-sm">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => selectAll(e.target.checked)}
              className="h-5 w-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300 cursor-pointer accent-primary-600"
            />
            <span className="font-semibold text-gray-800 text-sm sm:text-base">
              Select All ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </label>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={removeSelectedItems}
              className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-semibold hover:underline"
            >
              Delete selected ({selectedCount})
            </button>
          )}
        </div>

        {/* Individual Item Check Bars */}
        {items.map((item) => {
          const isSelected = item.selected !== false
          return (
            <div
              key={item.product.id}
              className={`card flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 transition-all duration-200 animate-fade-up ${
                isSelected
                  ? 'border-primary-200 bg-white ring-1 ring-primary-100'
                  : 'border-gray-200 bg-gray-50/60 opacity-80'
              }`}
            >
              {/* Check bar for this product */}
              <div className="flex items-center shrink-0 pr-1">
                <input
                  type="checkbox"
                  id={`check-${item.product.id}`}
                  checked={isSelected}
                  onChange={() => toggleSelect(item.product.id)}
                  className="h-5 w-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300 cursor-pointer accent-primary-600"
                  aria-label={`Select ${item.product.name} to checkout`}
                />
              </div>

              <ProductImage src={item.product.image} alt="" className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product.id}`} className="font-semibold text-gray-900 hover:text-primary-700 line-clamp-1">
                  {item.product.name}
                </Link>
                <p className="text-xs sm:text-sm text-gray-500 line-clamp-1">{item.product.seller} · {item.product.location}</p>
                <p className="mt-1 font-bold text-primary-800 text-sm sm:text-base">
                  {formatPeso(item.product.price)} <span className="text-xs font-normal text-gray-500">/ {item.product.unit}</span>
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <QuantityStepper
                  value={item.quantity}
                  max={item.product.stock}
                  onChange={(value) => updateQuantity(item.product.id, value)}
                />
                <button
                  type="button"
                  className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium"
                  onClick={() => removeItem(item.product.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <aside className="card h-fit">
        <h2 className="text-xl font-semibold mb-4">Summary</h2>
        <div className="flex justify-between text-gray-600 mb-2 text-sm">
          <span>Selected produce ({selectedCount} items)</span>
          <span className="font-semibold text-gray-900">{formatPeso(selectedSubtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600 mb-2 text-sm">
          <span>Delivery</span>
          <span>{shipping === 0 ? 'Free' : formatPeso(shipping)}</span>
        </div>
        <div className="flex justify-between text-amber-800 mb-4 text-sm">
          <span className="inline-flex items-center gap-1"><Coins className="h-4 w-4" /> Harvest points you will earn</span>
          <span className="font-semibold">+{points}</span>
        </div>
        <div className="flex justify-between font-bold text-lg mb-6 pt-2 border-t border-gray-100">
          <span>Total</span>
          <span className="text-primary-800">{formatPeso(total)}</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">Use harvest points at checkout to cut shipping (1 point = ₱1 off delivery).</p>
        
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 mb-4">
          <Leaf className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Eco-Impact:</strong> Direct regional farm shipping avoids ~12.4 kg of long-haul transport CO₂ emissions.
          </span>
        </div>
        {selectedCount === 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center font-medium">
              Please check the box on at least one produce item to proceed.
            </p>
            <button
              type="button"
              disabled
              className="btn-primary w-full text-center opacity-50 cursor-not-allowed"
            >
              Select items to checkout
            </button>
          </div>
        ) : (
          <Link
            to={isAuthenticated ? "/checkout" : "/login"}
            state={isAuthenticated ? undefined : { from: '/checkout' }}
            className="btn-primary w-full text-center py-3 font-semibold shadow-md block"
          >
            {isAuthenticated ? `Proceed to Checkout (${selectedCount})` : 'Log in or Sign up to Order'}
          </Link>
        )}
      </aside>
    </div>
  )
}

export default CartPage
