'use client'

import { MapPin, Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import { usePosShop } from '@/lib/wavecore/context/pos-shop-context'

/**
 * Shop selector for the POS module.
 * Reads/writes the current shop via PosShopProvider (cookie-backed).
 * Renders an honest empty state when the org has no locations.
 */
export default function ShopSelector({ compact = false }: { compact?: boolean }) {
  const { shopId, shop, shops, loading, error, setShopId, reload } = usePosShop()

  if (loading) {
    return (
      <div className={'flex items-center gap-2 px-3 py-2 rounded-xl border bg-white dark:bg-neutral-900 text-sm ' + (compact ? '' : 'w-full')}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Loading shops...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-amber-50 border-amber-200 text-amber-700 text-sm">
        <AlertTriangle className="w-4 h-4" />
        <span>{error}</span>
        <button onClick={reload} className="ml-auto p-1 rounded hover:bg-amber-100" title="Retry">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  if (shops.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-amber-50 border-amber-200 text-amber-700 text-sm">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>No shops yet — create one under Inventory → Warehouses</span>
      </div>
    )
  }

  return (
    <div className={'flex items-center gap-2 ' + (compact ? '' : 'w-full')}>
      <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
      <select
        value={shopId}
        onChange={(e) => setShopId(e.target.value)}
        className={'px-3 py-2 rounded-xl border bg-white dark:bg-neutral-900 text-sm font-medium ' + (compact ? '' : 'w-full max-w-md')}
      >
        <option value="">All shops (no filter)</option>
        {shops.map(s => (
          <option key={s.id} value={s.id}>
            {s.warehouseName} · {s.name}
          </option>
        ))}
      </select>
      {shop && (
        <span className="text-xs text-muted-foreground hidden md:inline">
          Selling from {shop.name}
        </span>
      )}
    </div>
  )
}