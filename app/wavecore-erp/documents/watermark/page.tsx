'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Stamp, Upload } from 'lucide-react'

export default function WatermarkPage() {
  const [fileName, setFileName] = useState('')
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL')

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFileName(e.target.files[0].name)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Watermark</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 p-6 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Stamp className="w-7 h-7" /> Watermark</h1>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer mb-4">
            <Upload className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
            <input type="file" onChange={handleUpload} className="hidden" />
            <p className="font-medium">{fileName || 'Click to upload PDF'}</p>
          </label>
          <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border mb-4" placeholder="Watermark text" />
          <button className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold">Apply Watermark</button>
        </div>
      </main>
    </div>
  )
}