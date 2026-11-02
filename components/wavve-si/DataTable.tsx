'use client'
import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'

export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchKeys?: (keyof T)[]
  pageSize?: number
  emptyMessage?: string
  loading?: boolean
  onRowClick?: (row: T) => void
}

export function DataTable<T extends Record<string, any>>({
  data, columns, searchable = true, searchKeys = [], pageSize = 10, emptyMessage = 'No records found', loading, onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    if (!search || !searchKeys.length) return data
    const q = search.toLowerCase()
    return data.filter(row => searchKeys.some(k => String(row[k] ?? '').toLowerCase().includes(q)))
  }, [data, search, searchKeys])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (av === bv) return 0
      const cmp = av < bv ? -1 : 1
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {searchable && (
        <div className="p-4 border-b border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text" placeholder="Search..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50 border-b border-slate-800">
            <tr>
              {columns.map(c => (
                <th key={String(c.key)} className={`text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase ${c.sortable ? 'cursor-pointer hover:text-white select-none' : ''} ${c.className ?? ''}`}
                  onClick={() => c.sortable && toggleSort(String(c.key))}>
                  <div className="flex items-center gap-1">
                    {c.label}
                    {c.sortable && sortKey === String(c.key) && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="text-center py-12 text-slate-500">Loading...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-12 text-slate-500">{emptyMessage}</td></tr>
            ) : paged.map((row, i) => (
              <tr key={i} onClick={() => onRowClick?.(row)} className={`border-b border-slate-800/50 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-800/50' : 'hover:bg-slate-800/30'}`}>
                {columns.map(c => (
                  <td key={String(c.key)} className={`px-4 py-3 text-slate-300 ${c.className ?? ''}`}>
                    {c.render ? c.render(row) : String(row[c.key as keyof T] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
          <span>Page {page + 1} of {totalPages} · {sorted.length} records</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded">Prev</button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}