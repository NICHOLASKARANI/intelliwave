'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { LayoutGrid, Plus, RefreshCw, Users, MapPin, Trash2, AlertCircle, X, ArrowRight } from 'lucide-react'
import { ConfirmDialog } from '@/components/wavve-si/ConfirmDialog'

interface Table {
  id: string
  name: string
  capacity: number
  location: string | null
  status: string
  createdAt: string
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  FREE:     { color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',  label: 'Free' },
  OCCUPIED: { color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30',    label: 'Occupied' },
  RESERVED: { color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30',  label: 'Reserved' },
  CLEANING: { color: 'text-slate-400',  bg: 'bg-slate-700/50 border-slate-600/30',  label: 'Cleaning' },
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({ name: '', capacity: '4', location: '' })
  const [creating, setCreating] = useState(false)

  async function loadTables() {
    try {
      const res = await fetch('/api/wavve-si/restaurant/tables', { cache: 'no-store' })
      if (res.status === 401) {
        window.location.href = 'https://www.intelliwavve.com/wavecore-erp/auth/login?returnTo=/wavve-si/dashboard'
        return
      }
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setTables(data.tables || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name required'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/wavve-si/restaurant/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          capacity: Number(form.capacity) || 4,
          location: form.location.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create')
      }
      toast.success(`Table "${form.name}" created`)
      setShowCreate(false)
      setForm({ name: '', capacity: '4', location: '' })
      loadTables()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function updateStatus(tableId: string, status: string) {
    try {
      const res = await fetch(`/api/wavve-si/restaurant/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success(`Table ${status.toLowerCase()}`)
      loadTables()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/wavve-si/restaurant/tables/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success(`Table "${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
      loadTables()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => { loadTables() }, [])

  const stats = {
    total: tables.length,
    free: tables.filter(t => t.status === 'FREE').length,
    occupied: tables.filter(t => t.status === 'OCCUPIED').length,
    reserved: tables.filter(t => t.status === 'RESERVED').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Tables</h2>
            <p className="text-sm text-slate-400">
              {stats.total} tables · {stats.free} free · {stats.occupied} occupied · {stats.reserved} reserved
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadTables} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> New Table
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-300 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {tables.length === 0 && !loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl text-center py-16 px-6">
          <LayoutGrid className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No tables yet</h3>
          <p className="text-sm text-slate-400 mb-6">Add your first table to start managing your floor plan.</p>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-sm transition-colors">
            <Plus className="w-4 h-4" /> Add First Table
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {tables.map(table => {
            const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.FREE
            return (
              <div key={table.id} className={`border rounded-2xl p-4 flex flex-col transition-all ${cfg.bg}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-lg font-bold text-white">{table.name}</p>
                    <p className={`text-xs font-bold uppercase ${cfg.color}`}>{cfg.label}</p>
                  </div>
                  <button onClick={() => setDeleteTarget(table)} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 mb-3 text-xs text-slate-400">
                  <p className="flex items-center gap-1"><Users className="w-3 h-3" /> {table.capacity} seats</p>
                  {table.location && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {table.location}</p>}
                </div>

                <div className="mt-auto pt-3 border-t border-slate-700/50 space-y-1">
                  {table.status === 'FREE' && (
                    <>
                      <Link href={`/wavve-si/modules/restaurant-hospitality/orders/new?table=${table.id}`} className="flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold transition-colors">
                        Start Order <ArrowRight className="w-3 h-3" />
                      </Link>
                      <button onClick={() => updateStatus(table.id, 'RESERVED')} className="w-full px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs font-semibold transition-colors">
                        Reserve
                      </button>
                    </>
                  )}
                  {table.status === 'OCCUPIED' && (
                    <button onClick={() => updateStatus(table.id, 'FREE')} className="w-full px-2 py-1.5 bg-green-600 hover:bg-green-500 rounded text-xs font-bold transition-colors">
                      Mark Free
                    </button>
                  )}
                  {table.status === 'RESERVED' && (
                    <div className="flex gap-1">
                      <button onClick={() => updateStatus(table.id, 'OCCUPIED')} className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-semibold transition-colors">
                        Seat Now
                      </button>
                      <button onClick={() => updateStatus(table.id, 'FREE')} className="flex-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs font-semibold transition-colors">
                        Cancel
                      </button>
                    </div>
                  )}
                  {table.status === 'CLEANING' && (
                    <button onClick={() => updateStatus(table.id, 'FREE')} className="w-full px-2 py-1.5 bg-green-600 hover:bg-green-500 rounded text-xs font-bold transition-colors">
                      Ready
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add New Table</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Table Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Table 1, A1, VIP-1"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">Capacity</label>
                <input type="number" min="1" max="50" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">Location (optional)</label>
                <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Window, Patio, VIP"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold rounded-lg transition-colors">
                  {creating ? 'Creating...' : 'Create Table'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this table?"
        message={deleteTarget ? `"${deleteTarget.name}" will be permanently deleted.` : ''}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}