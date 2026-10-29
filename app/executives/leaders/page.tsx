'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Crown, Users, MapPin, ArrowLeft } from 'lucide-react'

export default function PublicLeaderProfiles() {
  const [leaders, setLeaders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/executives/leaders-public')
      .then(r => r.json())
      .then(d => setLeaders(d.leaders || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/executives" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Application
        </Link>

        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-sm mb-6 border border-amber-500/30">
            <Crown className="w-4 h-4" /> Our Executive Leaders
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Meet the <span className="text-amber-400">Growth Leaders</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Real leaders. Real customers. Real impact across Kenya.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading leaders...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaders.map((l) => (
              <div key={l.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 hover:border-amber-500/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-extrabold text-2xl text-slate-900">
                    {l.full_name?.[0] || 'L'}
                  </div>
                  {l.level > 0 && (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                      L{l.level}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg mb-1">{l.full_name}</h3>
                <p className="text-sm text-slate-400 flex items-center gap-1 mb-4">
                  <MapPin className="w-3 h-3" /> {l.location}
                </p>
                <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-bold text-green-400">{l.total_active_users} paying users</span>
                </div>
              </div>
            ))}
            {leaders.length === 0 && (
              <div className="col-span-full text-center py-20 text-slate-500">
                No approved leaders yet. <Link href="/executives" className="text-amber-400 hover:underline">Be the first!</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}