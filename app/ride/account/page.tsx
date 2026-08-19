'use client'

import Link from 'next/link'
import { User } from 'lucide-react'

export default function RideAccountPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="text-center">
        <User className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Account Coming Soon</h1>
        <p className="text-neutral-400 mb-6">Wavve Ride launches Q4 2026</p>
        <Link href="/ride" className="text-emerald-400">← Back</Link>
      </div>
    </div>
  )
}