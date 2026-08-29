'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'

export default function SocialMediaComingSoon() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center p-8">
        <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h1 className="text-2xl font-bold mb-2">Social Media AI</h1>
        <p className="text-muted-foreground mb-4">Coming Soon</p>
        <Link href="/wavecore-erp" className="text-blue-600 hover:text-blue-700">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}