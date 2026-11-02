'use client'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; direction: 'up' | 'down' }
  accent?: 'blue' | 'green' | 'amber' | 'pink' | 'cyan' | 'purple'
  subtitle?: string
}

const ACCENT_MAP = {
  blue:   'text-blue-400 bg-blue-500/10',
  green:  'text-green-400 bg-green-500/10',
  amber:  'text-amber-400 bg-amber-500/10',
  pink:   'text-pink-400 bg-pink-500/10',
  cyan:   'text-cyan-400 bg-cyan-500/10',
  purple: 'text-purple-400 bg-purple-500/10',
}

export function KpiCard({ label, value, icon: Icon, trend, accent = 'blue', subtitle }: KpiCardProps) {
  const accentClass = ACCENT_MAP[accent]
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${accentClass} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  )
}