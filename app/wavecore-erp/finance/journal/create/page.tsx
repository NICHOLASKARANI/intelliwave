import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Create Journal Entry - WaveCore ERP',
  description: 'Create a new journal entry in WaveCore ERP.',
}

export default function CreateJournalEntryPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/wavecore-erp/finance/journal" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Journal
        </Link>

        <h1 className="text-3xl font-bold mb-8 text-neutral-900 dark:text-white">New Journal Entry</h1>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input type="date" className="w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Reference</label>
              <input type="text" placeholder="JE/2024/001" className="w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Journal</label>
              <select className="w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>General Journal</option>
                <option>Sales Journal</option>
                <option>Purchase Journal</option>
                <option>Cash Journal</option>
              </select>
            </div>
          </div>

          {/* Journal Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-neutral-900 dark:text-white">Journal Items</h3>
              <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Add Line</Button>
            </div>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800">
                    <th className="text-left p-3 font-medium">Account</th>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-right p-3 font-medium">Debit</th>
                    <th className="text-right p-3 font-medium">Credit</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3">
                      <select className="w-full px-2 py-1.5 rounded border text-sm">
                        <option>Select account...</option>
                        <option>1000 - Cash</option>
                        <option>1100 - Bank Account</option>
                      </select>
                    </td>
                    <td className="p-3"><input type="text" placeholder="Description" className="w-full px-2 py-1.5 rounded border text-sm" /></td>
                    <td className="p-3"><input type="number" placeholder="0.00" className="w-full px-2 py-1.5 rounded border text-sm text-right" /></td>
                    <td className="p-3"><input type="number" placeholder="0.00" className="w-full px-2 py-1.5 rounded border text-sm text-right" /></td>
                    <td className="p-3"><button className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline">Save as Draft</Button>
            <Button className="gap-2"><Save className="w-4 h-4" /> Post Journal Entry</Button>
          </div>
        </div>
      </div>
    </div>
  )
}