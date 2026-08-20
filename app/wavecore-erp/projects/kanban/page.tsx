'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Download, Loader2, GanttChartSquare } from 'lucide-react'

interface KanbanCard {
  id: string
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
}

export default function KanbanPage() {
  const [cards, setCards] = useState<KanbanCard[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from localStorage for persistence
    const saved = localStorage.getItem('kanban-cards')
    if (saved) {
      setCards(JSON.parse(saved))
    } else {
      setCards([
        { id: '1', title: 'Plan project', status: 'TODO' },
        { id: '2', title: 'Design UI', status: 'IN_PROGRESS' },
        { id: '3', title: 'Setup database', status: 'DONE' },
      ])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('kanban-cards', JSON.stringify(cards))
    }
  }, [cards, loading])

  const addCard = (status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    if (!newTitle.trim()) return
    const card: KanbanCard = {
      id: Date.now().toString(),
      title: newTitle,
      status,
    }
    setCards(prev => [...prev, card])
    setNewTitle('')
  }

  const moveCard = (id: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    setCards(prev => prev.map(card => card.id === id ? { ...card, status: newStatus } : card))
  }

  const deleteCard = (id: string) => {
    setCards(prev => prev.filter(card => card.id !== id))
  }

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Kanban Board', '='.repeat(50), `Total Cards: ${cards.length}`, '', 'TODO:', ...cards.filter(c => c.status === 'TODO').map(c => '  - ' + c.title), '', 'IN PROGRESS:', ...cards.filter(c => c.status === 'IN_PROGRESS').map(c => '  - ' + c.title), '', 'DONE:', ...cards.filter(c => c.status === 'DONE').map(c => '  - ' + c.title), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'kanban.pdf'; a.click()
  }

  const columns = [
    { status: 'TODO' as const, title: 'To Do', color: 'bg-neutral-200 dark:bg-neutral-800' },
    { status: 'IN_PROGRESS' as const, title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-950' },
    { status: 'DONE' as const, title: 'Done', color: 'bg-green-100 dark:bg-green-950' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Kanban</span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><GanttChartSquare className="w-6 h-6 text-blue-500" /> Kanban Board</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>

        {/* Add Card */}
        <div className="flex gap-2 mb-6">
          <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCard('TODO')}
            className="flex-1 px-4 py-2.5 rounded-xl border" placeholder="Enter task title..." />
          <button onClick={() => addCard('TODO')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {/* Columns */}
        <div className="grid md:grid-cols-3 gap-4">
          {columns.map(col => (
            <div key={col.status} className={`rounded-2xl ${col.color} p-4 min-h-[400px]`}>
              <h2 className="font-bold mb-4">{col.title} ({cards.filter(c => c.status === col.status).length})</h2>
              <div className="space-y-2">
                {cards.filter(c => c.status === col.status).map(card => (
                  <div key={card.id} className="bg-white dark:bg-neutral-900 rounded-xl p-3 shadow-sm">
                    <p className="font-medium">{card.title}</p>
                    <div className="flex gap-2 mt-2">
                      {columns.filter(c => c.status !== col.status).map(c => (
                        <button key={c.status} onClick={() => moveCard(card.id, c.status)}
                          className="text-xs px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200">
                          → {c.title}
                        </button>
                      ))}
                      <button onClick={() => deleteCard(card.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-500">✕</button>
                    </div>
                  </div>
                ))}
                {cards.filter(c => c.status === col.status).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">No cards</p>
                )}
              </div>
              <button onClick={() => addCard(col.status)} className="w-full mt-3 py-2 rounded-xl border-2 border-dashed text-sm opacity-50 hover:opacity-100">
                + Add Card
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}