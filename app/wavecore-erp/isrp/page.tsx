'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Store, Stethoscope, Building2, GraduationCap, Truck, ShieldCheck, Landmark, Lock } from 'lucide-react'

const systems = [
  { name: "Retail & POS", icon: Store, href: "/wavecore-erp/store" },
  { name: "Hospital & Clinic", icon: Stethoscope, href: "/wavecore-erp/healthcare" },
  { name: "Schools & Library", icon: GraduationCap, href: "/wavecore-erp/education" },
  { name: "Logistics & Fleet", icon: Truck, href: "/wavecore-erp/logistics" },
  { name: "SACCO & Finance", icon: ShieldCheck, href: "/wavecore-erp/finance" },
  { name: "Government Hub", icon: Landmark, href: "/wavecore-erp/gov" },
]

export default function IsrpDashboard() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verify the user has an active subscription
    fetch('/api/wavecore/auth/session')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/wavecore-erp/auth/login')
        } else if (!data.session.subscribed) {
          // Hard Paywall: If not subscribed, go to payment
          router.push('/wavecore-erp/subscription')
        } else {
          setLoading(false)
        }
      })
      .catch(() => router.push('/wavecore-erp/auth/login'))
  }, [router])

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Verifying secure access...</div>

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">Wavve ISRP Master Dashboard</h1>
          <p className="text-slate-400">Access your subscribed management systems.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {systems.map((sys, i) => {
            const Icon = sys.icon
            return (
              <a key={i} href={sys.href} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:bg-slate-800 hover:border-blue-500 transition-all group">
                <Icon className="w-8 h-8 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold">{sys.name}</h3>
                <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">Open System <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span></p>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}