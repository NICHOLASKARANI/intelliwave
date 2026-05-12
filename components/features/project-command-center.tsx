'use client'

import { GitBranch, Figma, CreditCard, Users, Server, Rocket } from 'lucide-react'
import { motion } from 'framer-motion'

const stats = [
  {
    icon: GitBranch,
    label: 'Active Repos',
    value: '1,247',
    subtext: 'Synced across teams',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Figma,
    label: 'Design Reviews',
    value: '89',
    subtext: 'Ready for approval',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: CreditCard,
    label: 'Invoices Today',
    value: 'KSh 2.4M',
    subtext: 'Processed & cleared',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: Users,
    label: 'Active Engineers',
    value: '500+',
    subtext: 'Working globally',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Server,
    label: 'Uptime',
    value: '99.99%',
    subtext: 'Last 30 days',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: Rocket,
    label: 'Deployments',
    value: '3,842',
    subtext: 'This month',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
]

export function ProjectCommandCenter() {
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-background via-background to-primary/5 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold">Live Operations Center</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time metrics across all active projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-green-500 font-medium">All Systems Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className={`p-4 rounded-xl border ${stat.bg} hover:border-primary/50 transition-all cursor-default`}
            >
              <Icon className={`w-6 h-6 ${stat.color} mb-3`} />
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-xs font-medium mb-0.5">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground">{stat.subtext}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}