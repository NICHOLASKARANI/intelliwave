'use client'

import { useEffect, useState } from 'react'
import { X, Plus, Heart, Bell, Loader2, CheckCircle2 } from 'lucide-react'

interface Collection {
  id: string
  name: string
  itemCount: number
}

interface SaveModalProps {
  listingId: number
  currentPrice: number
  onClose: () => void
  onSaved: () => void
}

export default function SaveModal({ listingId, currentPrice, onClose, onSaved }: SaveModalProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [priceAlert, setPriceAlert] = useState(false)
  const [targetPrice, setTargetPrice] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchCollections = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketplace/wishlists')
      if (res.ok) {
        const d = await res.json()
        setCollections(d.collections || [])
        if (d.collections?.length > 0) setSelectedId(d.collections[0].id)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchCollections() }, [])

  const createCollection = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/marketplace/wishlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (res.ok) {
        const d = await res.json()
        await fetchCollections()
        setSelectedId(d.collection.id)
        setNewName('')
      } else {
        const d = await res.json()
        setError(d.error || 'Failed to create collection')
      }
    } finally { setCreating(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      // Save to collection
      const saveRes = await fetch('/api/marketplace/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          collectionId: selectedId || null,
          note: note.trim() || null,
        }),
      })
      if (!saveRes.ok) {
        const d = await saveRes.json()
        setError(d.error || 'Failed to save')
        return
      }

      // Optional: price alert
      if (priceAlert && targetPrice) {
        const tp = parseFloat(targetPrice)
        if (tp > 0 && tp < currentPrice) {
          await fetch('/api/marketplace/wishlists/price-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listingId, targetPrice: tp }),
          }).catch(() => {})
        }
      }

      onSaved()
      onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" /> Save Item
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Collections */}
          <div>
            <label className="text-xs uppercase tracking-wide font-bold text-neutral-500 mb-2 block">
              Add to collection
            </label>
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {collections.map(c => (
                  <label key={c.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                    <input
                      type="radio"
                      name="collection"
                      checked={selectedId === c.id}
                      onChange={() => setSelectedId(c.id)}
                      className="text-blue-600"
                    />
                    <span className="text-sm font-medium flex-1">{c.name}</span>
                    <span className="text-xs text-neutral-500">{c.itemCount} item{c.itemCount !== 1 ? 's' : ''}</span>
                  </label>
                ))}
                {collections.length === 0 && (
                  <p className="text-sm text-neutral-500 text-center py-2">No collections yet — create one below</p>
                )}
              </div>
            )}
          </div>

          {/* Create collection */}
          <div>
            <label className="text-xs uppercase tracking-wide font-bold text-neutral-500 mb-2 block">
              Create new collection
            </label>
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g., Birthday gifts"
                maxLength={80}
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                onKeyDown={e => e.key === 'Enter' && createCollection()}
              />
              <button
                onClick={createCollection}
                disabled={creating || !newName.trim()}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-1"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs uppercase tracking-wide font-bold text-neutral-500 mb-2 block">
              Personal note (optional)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="e.g., Blue variant preferred"
              className="w-full px-3 py-2 rounded-lg border text-sm"
            />
          </div>

          {/* Price alert */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={priceAlert}
                onChange={e => setPriceAlert(e.target.checked)}
                className="text-amber-600"
              />
              <Bell className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold">Notify me on price drop</span>
            </label>
            {priceAlert && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Notify when price drops below</span>
                <span className="text-sm font-bold">KES</span>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={e => setTargetPrice(e.target.value)}
                  placeholder={Math.floor(currentPrice * 0.9).toString()}
                  className="flex-1 px-2 py-1 rounded-lg border text-sm"
                  min="1"
                  max={currentPrice - 1}
                />
              </div>
            )}
            <p className="text-xs text-neutral-500 mt-1">Current price: KES {currentPrice.toLocaleString()}</p>
          </div>

          {error && (
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onClose} className="px-5 py-3 rounded-xl bg-neutral-200 dark:bg-neutral-800 font-bold">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}