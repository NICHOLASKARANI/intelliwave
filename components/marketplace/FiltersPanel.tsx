'use client'

import { Sliders, X, Check } from 'lucide-react'

interface FiltersPanelProps {
  filters: {
    minPrice?: string
    maxPrice?: string
    condition?: string
    location?: string
    minRating?: string
    inStock?: boolean
  }
  onApply: (newFilters: any) => void
  onClose: () => void
}

const CONDITIONS = ['New', 'Used', 'Refurbished']
const RATINGS = [4, 3, 2]

export default function FiltersPanel({ filters, onApply, onClose }: FiltersPanelProps) {
  const [local, setLocal] = React.useState(filters)
  return (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose}>
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-neutral-950 border-l border-neutral-800 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-neutral-950 border-b border-neutral-800 p-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4" /> Filters
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-800">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Price range */}
          <div>
            <label className="text-xs uppercase font-bold text-neutral-400 mb-2 block">Price range (KES)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={local.minPrice || ''}
                onChange={e => setLocal({ ...local, minPrice: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-sm"
              />
              <span className="text-neutral-500">–</span>
              <input
                type="number"
                placeholder="Max"
                value={local.maxPrice || ''}
                onChange={e => setLocal({ ...local, maxPrice: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-sm"
              />
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="text-xs uppercase font-bold text-neutral-400 mb-2 block">Condition</label>
            <div className="space-y-1">
              {CONDITIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setLocal({ ...local, condition: local.condition === c ? '' : c })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                    local.condition === c ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300' : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  {local.condition === c && <Check className="w-3 h-3" />}
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs uppercase font-bold text-neutral-400 mb-2 block">Location</label>
            <input
              type="text"
              placeholder="e.g., Nairobi"
              value={local.location || ''}
              onChange={e => setLocal({ ...local, location: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-sm"
            />
          </div>

          {/* Min rating */}
          <div>
            <label className="text-xs uppercase font-bold text-neutral-400 mb-2 block">Minimum seller rating</label>
            <div className="flex gap-1">
              {RATINGS.map(r => (
                <button
                  key={r}
                  onClick={() => setLocal({ ...local, minRating: local.minRating === String(r) ? '' : String(r) })}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                    local.minRating === String(r) ? 'bg-amber-500 text-white' : 'bg-neutral-900 border border-neutral-800 text-neutral-300'
                  }`}
                >
                  {r}★+
                </button>
              ))}
            </div>
          </div>

          {/* In stock */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={local.inStock || false}
                onChange={e => setLocal({ ...local, inStock: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900"
              />
              <span className="text-sm text-neutral-300">In stock only</span>
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 bg-neutral-950 border-t border-neutral-800 p-4 flex gap-2">
          <button
            onClick={() => { setLocal({}); onApply({}) }}
            className="px-4 py-3 rounded-xl bg-neutral-800 text-white text-sm font-bold"
          >
            Clear
          </button>
          <button
            onClick={() => onApply(local)}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  )
}

import * as React from 'react'