'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Crown, LogIn } from 'lucide-react'

export default function ExecutivesLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/executives/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (res.ok) {
      router.push('/executives/dashboard')
    } else {
      setError(data.error || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
        <div className="text-center mb-8">
          <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Executive Leader Login</h1>
          <p className="text-slate-400 text-sm mt-2">Access your growth dashboard</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-900/30 text-red-400 border border-red-800 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white" />
          <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white" />
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Logging in...' : <><LogIn className="w-4 h-4" /> Log In</>}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Not yet a leader? <Link href="/executives" className="text-amber-400 hover:underline">Apply now</Link>
        </p>
      </div>
    </div>
  )
}