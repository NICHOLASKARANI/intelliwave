'use client'
import { LucideIcon } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend } from 'recharts'

type ChartType = 'line' | 'bar' | 'pie' | 'area'

interface ChartCardProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  type: ChartType
  data: any[]
  dataKey: string
  xKey?: string
  color?: string
  height?: number
  loading?: boolean
  empty?: boolean
}

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

export function ChartCard({ title, subtitle, icon: Icon, type, data, dataKey, xKey = 'name', color = '#3b82f6', height = 260, loading, empty }: ChartCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && <Icon className="w-4 h-4 text-slate-500" />}
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : empty || !data?.length ? (
        <div className="flex items-center justify-center text-slate-500 text-sm" style={{ height }}>
          No data available yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          {type === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey={xKey} stroke="#64748b" style={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" style={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} />
            </LineChart>
          ) : type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey={xKey} stroke="#64748b" style={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" style={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : type === 'area' ? (
            <AreaChart data={data}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey={xKey} stroke="#64748b" style={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" style={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          ) : (
            <PieChart>
              <Pie data={data} dataKey={dataKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={80} label={{ fontSize: 11, fill: '#94a3b8' }}>
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  )
}