'use client'

import { Shield, Database, Lock, Eye, Server } from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: Shield,
    title: 'SOC 2 Type II Certified',
    description:
      'Continuous network monitoring, DDoS protection, and Web Application Firewall (WAF) active on all deployments.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  {
    icon: Database,
    title: 'AES-256 Encryption',
    description:
      'All data encrypted in transit (TLS 1.3) and at rest. Full compliance with Kenya DPA and GDPR regulations.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    icon: Lock,
    title: '99.99% Uptime SLA',
    description:
      '30-minute recovery objective with disaster recovery across multiple geographic regions.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  {
    icon: Eye,
    title: '24/7 Threat Monitoring',
    description:
      'AI-powered threat detection with real-time alerts and automated incident response protocols.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
]

export function SecurityPavilion() {
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-background via-background to-green-500/5 p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold">Enterprise-Grade Security</h3>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Your data is protected by the same security infrastructure trusted by Fortune 500 companies
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start gap-4 p-5 rounded-xl border ${feature.border} ${feature.bg} hover:scale-[1.02] transition-transform`}
            >
              <div className={`p-2 rounded-lg ${feature.bg}`}>
                <Icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <div>
                <h4 className="font-bold mb-1">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}