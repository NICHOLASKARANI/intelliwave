'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Localization settings have moved to General Settings (single source of truth)
export default function LocalizationRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/wavecore-erp/settings/general')
  }, [router])
  return null
}