'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Columns, ArrowRight } from 'lucide-react'

const STORAGE_KEY = 'marketplace_compare_ids'
const MAX_COMPARE = 3

export function addToCompare(listingId: number): { ok: boolean, count: number, message?: string } {
  if (typeof window === 'undefined') return { ok: false, count: 0 }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const current: number[] = raw ? JSON.parse(raw) : []
    if (current.includes(listingId)) {
      return { ok: false, count: current.length, message: 'Already in comparison' }
    }
    if (current.length >= MAX_COMPARE) {
      return { ok: false, count: current.length, message: `Max ${MAX_COMPARE} items` }
    }
    const updated = [...current, listingId]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('compare-updated'))
    return { ok: true, count: updated.length }
  } catch {
    return { ok: false, count: 0 }
  }
}

export default function CompareBar() {
  const [ids, setIds] = useState<number[]>([])

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        setIds(raw ? JSON.parse(raw) : [])
      } catch { setIds([]) }
    }
    load()
    window.addEventListener('compare-updated', load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener('compare-updated', load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const remove = (id: number) => {
    const updated = ids.filter(x => x !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('compare-updated'))
  }

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event('compare-updated'))
  }

  if (ids.length === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-3 flex items-center gap-3 max-w-[90vw]">
      <Columns className="w-5 h-5 text-cyan-400 flex-shrink-0" />
      <div className="flex items-center gap-2 flex-1 flex-wrap">
        {ids.map(id => (
          <span key={id} className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center gap-1">
            #{id}
            <button onClick={() => remove(id)} className="hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {ids.length < MAX_COMPARE && (
          <span className="text-xs text-neutral-500">+ select {MAX_COMPARE - ids.length} more</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={clear} className="text-xs text-neutral-500 hover:text-white">
          Clear
        </button>
        <Link
          href={`/marketplace/compare?ids=${ids.join(',')}`}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 ${
            ids.length >= 2 ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
          }`}
          onClick={e => { if (ids.length < 2) e.preventDefault() }}
        >
          Compare <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}