'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, Trash2, Search, Printer, CheckCircle2, AlertTriangle, Plus, X, Tag, Percent, Clock, Calendar } from 'lucide-react'

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleting, setDeleting] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [activeView, setActiveView] = useState('all')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE'
  })

  const fetchOffers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/store/offers')
      const data = await res.json()
      setOffers(data.offers || [])
      setStats(data.stats || {})
    } catch (err) {
      setError('Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOffers()
  }, [])

  const createOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!formData.title || !formData.discountValue || Number(formData.discountValue) <= 0) {
      setError('Please enter a title and valid discount value')
      return
    }

    try {
      const res = await fetch('/api/wavecore/store/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Offer created successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setFormData({
          title: '',
          description: '',
          discountType: 'PERCENTAGE',
          discountValue: '',
          startDate: '',
          endDate: '',
          status: 'ACTIVE'
        })
        setShowForm(false)
        fetchOffers()
      } else {
        setError(data.error || 'Failed to create offer')
      }
    } catch (err) {
      setError('Network error - failed to create')
    }
  }

  const deleteOffer = async (id: string, title: string) => {
    if (!confirm(`Delete offer "${title}"?`)) return
    setDeleting(id)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/wavecore/store/offers?id=${encodeURIComponent(id)}`, { 
        method: 'DELETE' 
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(`Offer "${title}" deleted successfully`)
        setTimeout(() => setSuccess(''), 3000)
        fetchOffers()
      } else {
        setError(data.error || 'Delete failed')
      }
    } catch (err) {
      setError('Network error - delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    if (!id) {
      setError('Offer ID missing')
      return
    }
    window.open(`/api/wavecore/store/offers/${id}/pdf`, '_blank')
  }

  const filtered = offers.filter(o => 
    (o.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.number || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalOffers = Number(stats.totalOffers || 0)
  const activeOffers = Number(stats.activeOffers || 0)
  const expiredOffers = Number(stats.expiredOffers || 0)
  const scheduledOffers = Number(stats.scheduledOffers || 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Offers</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="w-6 h-6 text-amber-500" /> Offers ({totalOffers})
          </h1>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 text-white font-bold flex items-center gap-2 hover:bg-amber-700 transition-colors">
            <Plus className="w-4 h-4" /> New Offer
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 border border-green-200 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {showForm && (
          <form onSubmit={createOffer} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2"><Percent className="w-5 h-5 text-amber-500" /> New Offer</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-2 block">Offer Title</label>
                <input type="text" value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Summer Sale 50% Off"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-2 block">Description</label>
                <textarea value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Offer description" rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Discount Type</label>
                <select value={formData.discountType}
                  onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (KSh)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Discount Value</label>
                <input type="number" value={formData.discountValue}
                  onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                  placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 500'}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <input type="date" value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <input type="date" value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="ACTIVE">Active</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors">
              Create Offer
            </button>
          </form>
        )}

        {/* CLICKABLE KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveView('all')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'all' ? 'ring-4 ring-amber-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Tag className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalOffers}</p>
            <p className="text-xs opacity-80">Total Offers</p>
          </button>
          <button onClick={() => setActiveView('active')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'active' ? 'ring-4 ring-green-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #16a34a, #059669)' }}>
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{activeOffers}</p>
            <p className="text-xs opacity-80">Active</p>
          </button>
          <button onClick={() => setActiveView('scheduled')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'scheduled' ? 'ring-4 ring-blue-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            <Clock className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{scheduledOffers}</p>
            <p className="text-xs opacity-80">Scheduled</p>
          </button>
          <button onClick={() => setActiveView('expired')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'expired' ? 'ring-4 ring-red-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{expiredOffers}</p>
            <p className="text-xs opacity-80">Expired</p>
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Search offers..." />
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No offers found</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold">
              Create First Offer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered
              .filter(o => {
                if (activeView === 'active') return o.status === 'ACTIVE'
                if (activeView === 'scheduled') return o.status === 'SCHEDULED'
                if (activeView === 'expired') return o.status === 'EXPIRED'
                return true
              })
              .map((offer) => (
                <div key={offer.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-mono text-sm">{offer.number}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          offer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          offer.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {offer.status}
                        </span>
                      </div>
                      <p className="font-bold text-lg">{offer.title}</p>
                      {offer.description && <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>}
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-2xl font-bold text-amber-600">
                          {offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}%` : `KSh ${Number(offer.discountValue).toLocaleString()}`}
                        </span>
                        {offer.startDate && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(offer.startDate).toLocaleDateString('en-KE')}
                            {offer.endDate && ` - ${new Date(offer.endDate).toLocaleDateString('en-KE')}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => downloadPdf(offer.id)} 
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Download PDF">
                        <Printer className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteOffer(offer.id, offer.title)}
                        disabled={deleting === offer.id}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        title="Delete offer">
                        {deleting === offer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  )
}