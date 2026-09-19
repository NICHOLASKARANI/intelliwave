'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LeaveRedirectPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/wavecore-erp/hr/leaves') }, [router])
  return null
}