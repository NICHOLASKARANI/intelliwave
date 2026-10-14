'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

export interface ShopLocation {
  id: string
  name: string
  code: string
  warehouseId: string
  warehouseName: string
}

export interface PosShopContextValue {
  shopId: string
  shop: ShopLocation | null
  shops: ShopLocation[]
  loading: boolean
  error: string
  setShopId: (id: string) => void
  reload: () => Promise<void>
}

const COOKIE_NAME = 'wavecore_shop'

const defaultValue: PosShopContextValue = {
  shopId: '',
  shop: null,
  shops: [],
  loading: true,
  error: '',
  setShopId: () => {},
  reload: async () => {},
}

export const PosShopContext = createContext<PosShopContextValue>(defaultValue)

export const usePosShop = () => useContext(PosShopContext)

function readCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[1]) : ''
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  // 30-day expiry, path-wide
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; samesite=lax'
}

export function PosShopProvider({ children }: { children: ReactNode }) {
  const [shopId, setShopIdState] = useState('')
  const [shops, setShops] = useState<ShopLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/warehouses')
      if (!res.ok) throw new Error('Failed to load shops')
      const data = await res.json()
      const wares: any[] = data.warehouses || []
      const locs: ShopLocation[] = []
      await Promise.all(wares.map(async (w: any) => {
        try {
          const r2 = await fetch('/api/wavecore/inventory/warehouses/' + w.id + '/locations')
          const d2 = await r2.json()
          for (const l of d2.locations || []) {
            locs.push({
              id: l.id,
              name: l.name,
              code: l.code,
              warehouseId: w.id,
              warehouseName: w.name,
            })
          }
        } catch {}
      }))
      setShops(locs)

      // Determine active shop: cookie > previous state > first location
      const cookieVal = readCookie(COOKIE_NAME)
      let next = ''
      if (cookieVal && locs.some(l => l.id === cookieVal)) next = cookieVal
      else if (shopId && locs.some(l => l.id === shopId)) next = shopId
      else if (locs.length === 1) next = locs[0].id

      if (next !== shopId) {
        setShopIdState(next)
        if (next) writeCookie(COOKIE_NAME, next)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [shopId])

  useEffect(() => {
    reload()
    // eslint-disable-next-line
  }, [])

  const setShopId = useCallback((id: string) => {
    setShopIdState(id)
    if (id) writeCookie(COOKIE_NAME, id)
  }, [])

  const shop = shops.find(s => s.id === shopId) || null

  return (
    <PosShopContext.Provider value={{ shopId, shop, shops, loading, error, setShopId, reload }}>
      {children}
    </PosShopContext.Provider>
  )
}