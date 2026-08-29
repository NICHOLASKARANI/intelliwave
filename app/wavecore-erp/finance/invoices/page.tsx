'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, FileText, Search, Download, Trash2, Eye, Loader2, Printer, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Invoice {
  id: string
  number: string
  customerName: string
  customerEmail: string
  total: number
  subtotal: number
  taxAmount: number
  status: string
  dueDate: string
  createdAt: string
  paidAmount: number
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showPdf, setShowPdf] = useState(false)
  const [deleting, setDeleting] = useState('')

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/finance/invoices')
      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch (err) {
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const deleteInvoice = async (id: string) => {
    if (!confirm('Delete this invoice permanently?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/wavecore/finance/invoices?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchInvoices()
      }
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/wavecore/finance/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      fetchInvoices()
    } catch (err) {
      setError('Status update failed')
    }
  }

  const openPdf = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowPdf(true)
  }

  const downloadPdf = (invoice: Invoice) => {
    window.open(`/api/wavecore/finance/invoices/${invoice.id}/pdf`, '_blank')
  }

  const filtered = invoices.filter(inv => 
    (inv.number || '').toLowerCase().includes(search.toLowerCase()) ||
    (inv.customerName || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalOutstanding = invoices
    .filter(i => i.status !== 'PAID')
    .reduce((sum, i) => sum + (Number(i.total) || 0), 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/finance" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Invoices</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-500" /> Invoices ({invoices.length})
            </h1>
            <p className="text-sm text-muted-foreground">Outstanding: KSh {totalOutstanding.toLocaleString()}</p>
          </div>
          <Link href="/wavecore-erp/finance/invoices/create"
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Invoice
          </Link>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search invoices..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No invoices yet</p>
            <Link href="/wavecore-erp/finance/invoices/create" className="text-blue-600 mt-2 inline-block">Create your first invoice</Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">Invoice #</th>
                  <th className="text-left p-4 text-sm">Customer</th>
                  <th className="text-left p-4 text-sm">Amount</th>
                  <th className="text-left p-4 text-sm">Status</th>
                  <th className="text-left p-4 text-sm">Due Date</th>
                  <th className="text-left p-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(invoice => (
                  <tr key={invoice.id} className="border-t hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                    onClick={() => openPdf(invoice)}>
                    <td className="p-4 font-mono text-sm">{invoice.number}</td>
                    <td className="p-4">
                      <p className="font-medium">{invoice.customerName || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{invoice.customerEmail || ''}</p>
                    </td>
                    <td className="p-4 font-bold">KSh {Number(invoice.total || 0).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                        invoice.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button onClick={() => downloadPdf(invoice)} title="Download PDF"
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => openPdf(invoice)} title="View/Print"
                          className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100">
                          <Printer className="w-4 h-4" />
                        </button>
                        {invoice.status !== 'PAID' && (
                          <button onClick={() => updateStatus(invoice.id, 'PAID')} title="Mark Paid"
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => deleteInvoice(invoice.id)} title="Delete"
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                          {deleting === invoice.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PDF Modal */}
        {showPdf && selectedInvoice && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">{selectedInvoice.status === 'PAID' ? 'Receipt' : 'Invoice'} {selectedInvoice.number}</h2>
                  <button onClick={() => setShowPdf(false)} className="p-2 rounded-lg bg-neutral-100">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Invoice Preview */}
                <div className="border rounded-xl p-6 mb-4">
                  <div className="flex justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">IntelliWavve</p>
                      {selectedInvoice.status === 'PAID' && (
                        <p className="text-xs text-green-600 font-bold">PAID - RECEIPT</p>
                      )}
                      <p className="text-sm text-muted-foreground">World-Class ERP Solutions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{selectedInvoice.status === 'PAID' ? 'RECEIPT' : 'INVOICE'}</p>
                      <p className="text-sm">{selectedInvoice.number}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">BILL TO</p>
                      <p className="font-bold">{selectedInvoice.customerName}</p>
                      <p className="text-sm">{selectedInvoice.customerEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">DUE DATE</p>
                      <p className="font-bold">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <table className="w-full mb-4">
                    <thead>
                      <tr className="bg-neutral-100">
                        <th className="text-left p-2">Description</th>
                        <th className="text-right p-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2">Invoice services</td>
                        <td className="p-2 text-right">KSh {Number(selectedInvoice.subtotal || 0).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="text-right space-y-1">
                    <p>Subtotal: KSh {Number(selectedInvoice.subtotal || 0).toLocaleString()}</p>
                    <p>Tax: KSh {Number(selectedInvoice.taxAmount || 0).toLocaleString()}</p>
                    <p className="text-xl font-bold text-blue-600">Total: KSh {Number(selectedInvoice.total || 0).toLocaleString()}</p>
                  </div>
                </div>

                <button onClick={() => downloadPdf(selectedInvoice)}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}