import { useState } from 'react'
import { Ticket, CheckCircle2, Clock, Sparkles, X, ShieldAlert, Copy } from 'lucide-react'
import { shippingCoupons, type Coupon } from '../data/catalog'
import { useStore } from '../context/StoreContext'

type Props = {
  isOpen: boolean
  onClose: () => void
  onApplyDirect?: (code: string) => void
}

export const VoucherCenterModal = ({ isOpen, onClose, onApplyDirect }: Props) => {
  const { claimedVouchers, claimVoucher } = useStore()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleClaim = (coupon: Coupon) => {
    claimVoucher(coupon.code)
    if (onApplyDirect) {
      onApplyDirect(coupon.code)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-gradient-to-b from-orange-50 via-white to-gray-50 rounded-3xl shadow-2xl border border-orange-100 overflow-hidden animate-sheet-up max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-rose-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Ticket className="h-6 w-6 text-yellow-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-xl">Voucher Wallet</h3>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-yellow-400 text-orange-950">
                  Shopee / Lazada Style
                </span>
              </div>
              <p className="text-xs text-orange-100 mt-0.5">
                Collect vouchers for direct discounts on your SOCCSKSARGEN harvests.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Voucher List Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {shippingCoupons.map((coupon) => {
            const isClaimed = claimedVouchers.includes(coupon.code)

            return (
              <div
                key={coupon.code}
                className="relative bg-white rounded-2xl border border-orange-100/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row items-stretch"
              >
                {/* Left Ticket Stub */}
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-4 sm:w-36 flex flex-col items-center justify-center text-center relative">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-200">
                    {coupon.badge || 'VOUCHER'}
                  </span>
                  <p className="font-display font-extrabold text-2xl my-0.5">
                    {coupon.type === 'percent' ? `${coupon.value}%` : `₱${coupon.value}`}
                  </p>
                  <span className="text-[10px] font-semibold text-orange-100">
                    {coupon.code === 'FREESHIP' ? 'Shipping' : 'Discount'}
                  </span>

                  {/* Ticket Notch decorations */}
                  <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-50 border-l border-orange-100" />
                </div>

                {/* Right Voucher Details */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                        {coupon.code}
                        <button
                          type="button"
                          onClick={() => handleCopy(coupon.code)}
                          title="Copy Code"
                          className="hover:text-orange-950"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                      {copiedCode === coupon.code && (
                        <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                      )}
                    </div>
                    <p className="font-bold text-gray-900 text-sm mt-1.5">{coupon.description}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-orange-500" />
                      <span>Min. Spend: ₱{coupon.minOrder} · Region XII</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-[11px] text-orange-600 font-semibold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> 1-Click apply at checkout
                    </span>

                    {isClaimed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Claimed
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleClaim(coupon)}
                        className="btn-primary bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs py-1.5 px-3 rounded-xl font-bold shadow-sm"
                      >
                        Collect Voucher
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>All vouchers automatically sync with your account & phone app.</span>
          <button
            type="button"
            onClick={onClose}
            className="btn-outline text-xs py-1.5 px-3"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default VoucherCenterModal
