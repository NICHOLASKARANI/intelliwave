'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, Users, CreditCard, Activity,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Calendar,
  Download, Filter, Zap, Globe, Server, Shield
} from 'lucide-react'

export function EnterpriseDashboard() {
  const [timeRange, setTimeRange] = useState('30d')
  const [isLive, setIsLive] = useState(true)

  const stats = [
    { label: 'Total Revenue', value: '$2.4M', change: '+12.5%', trend: 'up', icon: CreditCard },
    { label: 'Active Users', value: '45.2K', change: '+8.2%', trend: 'up', icon: Users },
    { label: 'API Calls', value: '3.2M', change: '+24.8%', trend: 'up', icon: Activity },
    { label: 'Uptime', value: '99.99%', change: 'Stable', trend: 'stable', icon: Shield },
  ]

  const chartData = [65, 45, 78, 56, 89, 72, 95, 68, 82, 55, 88, 92]

  return (
    <div className="rounded-3xl border bg-white dark:bg-neutral-950 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Analytics Dashboard</h3>
            <p className="text-sm text-neutral-500">Real-time business intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border dark:border-neutral-800 overflow-hidden">
            {['24h', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="p-2 rounded-lg border dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg border dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2 }}
              className="p-4 rounded-2xl border dark:border-neutral-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                ) : stat.trend === 'down' ? (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                ) : null}
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-xs font-medium ${
                  stat.trend === 'up' ? 'text-green-500' : 'text-neutral-500'
                }`}>
                  {stat.change}
                </span>
                <span className="text-xs text-neutral-500">{stat.label}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Chart Area */}
      <div className="px-6 pb-6">
        <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border dark:border-neutral-800">
          <div className="flex items-end gap-2 h-48">
            {chartData.map((value, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${value}%` }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                className="flex-1 bg-gradient-to-t from-indigo-600 to-purple-600 rounded-t-lg relative group"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {value}%
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs text-neutral-500">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="px-6 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-neutral-400'}`} />
          <span className="text-sm text-neutral-500">{isLive ? 'Live data streaming' : 'Data paused'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Calendar className="w-4 h-4" />
          <span>Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}