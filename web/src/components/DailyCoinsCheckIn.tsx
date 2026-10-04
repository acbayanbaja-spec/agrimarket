import { useState } from 'react'
import { Coins, Sparkles, CheckCircle2, Flame, Gift, ArrowRight, X } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const DailyCoinsCheckIn = ({ isOpen, onClose }: Props) => {
  const { loyaltyPoints, checkInDaily, streakDays, lastCheckInDate } = useStore()
  const { isAuthenticated } = useAuth()
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null)

  if (!isOpen) return null

  const today = new Date().toISOString().slice(0, 10)
  const isAlreadyCheckedIn = lastCheckInDate === today

  const streakRewards = [
    { day: 1, points: 5 },
    { day: 2, points: 10 },
    { day: 3, points: 15 },
    { day: 4, points: 20 },
    { day: 5, points: 25 },
    { day: 6, points: 30 },
    { day: 7, points: 50 },
  ]

  const handleClaim = () => {
    if (!isAuthenticated) {
      setClaimedNotice('Please log in first to claim and save your daily AgriCoins!')
      return
    }
    const result = checkInDaily()
    if (result.success) {
      setClaimedNotice(`🎉 Woohoo! +${result.pointsAdded} AgriCoins added to your wallet!`)
    } else {
      setClaimedNotice("You've already claimed today's reward! Come back tomorrow.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-100 overflow-hidden animate-sheet-up flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-xl" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Coins className="h-9 w-9 text-yellow-100 drop-shadow animate-bounce" />
          </div>

          <h3 className="font-display font-extrabold text-2xl">Daily Farm Coins</h3>
          <p className="text-amber-100 text-xs mt-1">
            Check in every day to claim free coins. 1 AgriCoin = ₱1 cash discount!
          </p>

          <div className="mt-4 inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-yellow-200">
            <Flame className="h-4 w-4 text-orange-400 fill-orange-400 animate-pulse" />
            <span>Current Streak: {streakDays} Day{streakDays === 1 ? '' : 's'}</span>
            <span className="text-white">·</span>
            <span>Balance: {loyaltyPoints} Coins</span>
          </div>
        </div>

        {/* 7-Day Streak Calendar */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {streakRewards.map((reward) => {
              const isPast = reward.day < streakDays || (reward.day === streakDays && isAlreadyCheckedIn)
              const isToday = reward.day === (isAlreadyCheckedIn ? streakDays : (streakDays % 7) + 1)
              const isDay7 = reward.day === 7

              return (
                <div
                  key={reward.day}
                  className={`rounded-2xl p-2.5 text-center flex flex-col items-center justify-between transition-all ${
                    isPast
                      ? 'bg-amber-100/70 border border-amber-300 text-amber-900'
                      : isToday
                      ? 'bg-gradient-to-b from-amber-500 to-yellow-500 text-white shadow-md ring-2 ring-amber-400/50 scale-105'
                      : 'bg-gray-50 border border-gray-100 text-gray-600'
                  }`}
                >
                  <span className="text-[10px] font-bold">D{reward.day}</span>
                  <div className="my-1.5">
                    {isPast ? (
                      <CheckCircle2 className="h-5 w-5 text-amber-700" />
                    ) : isDay7 ? (
                      <Gift className={`h-5 w-5 ${isToday ? 'text-white' : 'text-amber-500'}`} />
                    ) : (
                      <Coins className={`h-5 w-5 ${isToday ? 'text-white' : 'text-amber-500'}`} />
                    )}
                  </div>
                  <span className="text-xs font-black">+{reward.points}</span>
                </div>
              )
            })}
          </div>

          {claimedNotice && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium text-center animate-fade-in">
              {claimedNotice}
            </div>
          )}

          {/* Claim Action Button */}
          <button
            type="button"
            onClick={handleClaim}
            disabled={isAlreadyCheckedIn}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
              isAlreadyCheckedIn
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                : 'btn-primary bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-amber-500/25'
            }`}
          >
            {isAlreadyCheckedIn ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Checked In Today (+{streakRewards[streakDays - 1]?.points || 10} Coins Claimed)</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Check In Now & Claim AgriCoins</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            AgriCoins automatically sync with your account across mobile phone and desktop. Redeem at checkout for discounts on vegetables, fruits, and meats!
          </p>
        </div>
      </div>
    </div>
  )
}

export default DailyCoinsCheckIn
