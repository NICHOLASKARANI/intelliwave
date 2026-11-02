'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { BookOpen, AlertCircle, RefreshCw, Package, Plus, Pencil, Trash2, Download } from 'lucide-react'
import { DataTable, type Column } from '@/components/wavve-si/DataTable'
import { ConfirmDialog } from '@/components/wavve-si/ConfirmDialog'

interface Product {
  id: string
  name: string
  sku: string
  category: string | null
  sellingPrice: number
  costPrice: number
  unit: string
  isActive: boolean
  stock_level: number
  available_qty: number
}

export default function MenuPage() {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMenu = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/wavecore/store', { cache: 'no-store' })
      if (res.status === 401) {
        window.location.href = 'https://www.intelliwavve.com/wavecore-erp/auth/login?returnTo=/wavve-si/dashboard'
        return
      }
      if (!res.ok) throw new Error('Failed to load menu')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMenu()
  }, [])

  const columns: Column<Product>[] = [
    {
      key: 'name',
      label: 'Item Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-500" />
          <div>
            <p className="text-sm text-white font-medium">{row.name}</p>
            {row.sku && <p className="text-xs text-slate-500 font-mono">{row.sku}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (row) => row.category ? (
        <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">{row.category}</span>
      ) : <span className="text-xs text-slate-500">—</span>,
    },
    {
      key: 'sellingPrice',
      label: 'Price',
      sortable: true,
      render: (row) => <span className="text-sm font-bold text-green-400">KSh {row.sellingPrice.toLocaleString()}</span>,
      className: 'text-right',
    },
    {
      key: 'stock_level',
      label: 'Stock',
      sortable: true,
      render: (row) => {
        const stock = Number(row.stock_level || 0)
        const color = stock === 0 ? 'text-red-400' : stock < 10 ? 'text-amber-400' : 'text-green-400'
        return <span className={`text-sm font-bold ${color}`}>{stock}</span>
      },
      className: 'text-right',
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => row.isActive ? (
        <span className="text-xs font-bold px-2 py-1 rounded bg-green-500/10 text-green-400">ACTIVE</span>
      ) : (
        <span className="text-xs font-bold px-2 py-1 rounded bg-slate-700 text-slate-400">INACTIVE</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/wavve-si/modules/restaurant-hospitality/menu/${row.id}/edit`) }}
            className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }}
            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ]

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/wavve-si/restaurant/menu/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete')
      }
      toast.success(`"${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
      loadMenu()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Menu</h2>
            <p className="text-sm text-slate-400">{products.length} item{products.length === 1 ? '' : 's'}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href="/api/wavve-si/restaurant/menu/export" download className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </a>
          <Link href="/wavve-si/modules/restaurant-hospitality/menu/new" className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> New Item
          </Link>
          <button onClick={loadMenu} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-300 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Error loading menu</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      <DataTable<Product>
        data={products}
        columns={columns}
        searchable={true}
        searchKeys={['name', 'sku', 'category']}
        pageSize={15}
        emptyMessage="No menu items yet. Add products via WaveCoreERP Store first."
        loading={loading}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this item?"
        message={deleteTarget ? `"${deleteTarget.name}" will be marked as INACTIVE. Orders referencing it are preserved. You can reactivate it from WaveCoreERP.` : ''}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}