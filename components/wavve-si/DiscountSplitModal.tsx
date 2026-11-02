'use client'
import { useState } from 'react'
import { X, Percent, DollarSign, Users, AlertCircle } from 'lucide-react'

interface DiscountSplitModalProps {
  open: boolean
  mode: 'discount' | 'split'
  subtotal: number
  currentDiscountType?: string | null
  currentDiscountValue?: number
  onClose: () => void
  onApplyDiscount?: (type: string | null, value: number) => Promise<void>
  onSplit?: (parts: { amount: number; label: string }[]) => Promise<void>
}

export function DiscountSplitModal({
  open, mode, subtotal, currentDiscountType, currentDiscountValue,
  onClose, onApplyDiscount, onSplit,
}: DiscountSplitModalProps) {
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>(
    (currentDiscountType as 'PERCENT' | 'FIXED') || 'PERCENT'
  )
  const [discountValue, setDiscountValue] = useState(String(currentDiscountValue || ''))
  const [splitCount, setSplitCount] = useState('2')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const discountAmount = (() => {
    const val = Number(discountValue) || 0
    if (discountType === 'PERCENT') return (subtotal * val) / 100
    return Math.min(val, subtotal)
  })()
  const newTotal = Math.max(0, subtotal - discountAmount)

  async function handleDiscount(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const val = Number(discountValue) || 0
      if (val < 0) throw new Error('Discount cannot be negative')
      if (discountType === 'PERCENT' && val > 100) throw new Error('Percentage cannot exceed 100')
      if (discountType === 'FIXED' && val > subtotal) throw new Error('Fixed discount cannot exceed subtotal')
      await onApplyDiscount?.(discountType, val)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSplit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const n = Number(splitCount)
      if (n < 2 || n > 20) throw new Error('Split count must be 2-20')
      const perPerson = subtotal / n
      const parts = Array.from({ length: n }, (_, i) => ({
        amount: Math.round(perPerson * 100) / 100,
        label: `Person ${i + 1}`,
      }))
      // Adjust last part for rounding
      const diff = subtotal - parts.reduce((s, p) => s + p.amount, 0)
      if (parts.length > 0) parts[parts.length - 1].amount = Math.round((parts[parts.length - 1].amount + diff) * 100) / 100
      await onSplit?.(parts)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            {mode === 'discount' ? 'Apply Discount' : 'Split Bill'}
          </h3>
          <button onClick={onClose} disabled={loading} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {mode === 'discount' ? (
          <form onSubmit={handleDiscount} className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-3 text-sm">
              <p className="text-slate-400">Subtotal</p>
              <p className="text-xl font-bold text-white">KSh {subtotal.toLocaleString()}</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2">Discount Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDiscountType('PERCENT')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${discountType === 'PERCENT' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  <Percent className="w-4 h-4" /> Percentage
                </button>
                <button type="button" onClick={() => setDiscountType('FIXED')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${discountType === 'FIXED' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  <DollarSign className="w-4 h-4" /> Fixed (KSh)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2">
                {discountType === 'PERCENT' ? 'Percentage (%)' : 'Amount (KSh)'}
              </label>
              <input type="number" min="0" step="0.01" value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
                placeholder={discountType === 'PERCENT' ? '10' : '100'}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
            </div>

            {discountValue && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm">
                <div className="flex justify-between text-green-300 mb-1">
                  <span>Discount</span>
                  <span className="font-bold">− KSh {discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-green-500/30 pt-1 mt-1 text-green-300">
                  <span className="font-bold">New Total</span>
                  <span className="font-bold">KSh {newTotal.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {currentDiscountType && (
                <button type="button" onClick={() => onApplyDiscount?.(null, 0)} disabled={loading}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-sm transition-colors">
                  Remove
                </button>
              )}
              <button type="submit" disabled={loading || !discountValue}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white font-bold rounded-lg text-sm transition-colors">
                {loading ? 'Applying...' : 'Apply Discount'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSplit} className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-3 text-sm">
              <p className="text-slate-400">Total to split</p>
              <p className="text-xl font-bold text-white">KSh {subtotal.toLocaleString()}</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2">Number of People</label>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-400" />
                <input type="number" min="2" max="20" value={splitCount}
                  onChange={e => setSplitCount(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            {splitCount && Number(splitCount) >= 2 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
                <p className="text-sm font-bold text-blue-300">Split Breakdown</p>
                {Array.from({ length: Number(splitCount) }).map((_, i) => {
                  const perPerson = subtotal / Number(splitCount)
                  return (
                    <div key={i} className="flex justify-between text-sm text-blue-200">
                      <span>Person {i + 1}</span>
                      <span className="font-bold">KSh {perPerson.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-lg text-sm transition-colors">
              {loading ? 'Splitting...' : 'Confirm Split'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}