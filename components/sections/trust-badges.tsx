'use client'

import { motion } from 'framer-motion'
import { 
  Shield, Lock, Server, FileCheck, Cloud, Key, 
  Users, Globe
} from 'lucide-react'
import { logos, technologyPartners } from '@/components/ui/company-logos'

const compliance = [
  { icon: Shield, label: 'SOC 2 Type II', description: 'Annual audit completed', color: 'text-green-500' },
  { icon: Lock, label: 'GDPR Compliant', description: 'EU data protection', color: 'text-blue-500' },
  { icon: Server, label: 'ISO 27001', description: 'Information security', color: 'text-purple-500' },
  { icon: FileCheck, label: 'Kenya DPA', description: 'Data Protection Act 2019', color: 'text-orange-500' },
]

const security = [
  { icon: Key, label: 'AES-256 Encryption', description: 'Data at rest & in transit' },
  { icon: Cloud, label: '99.99% Uptime SLA', description: 'Enterprise guarantee' },
  { icon: Users, label: 'RBAC', description: 'Role-based access control' },
  { icon: Globe, label: 'Global Edge Network', description: '200+ points of presence' },
]

export function TrustBadges() {
  return (
    <section className="py-16 border-y bg-neutral-50/50 dark:bg-neutral-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Compliance */}
          <div>
            <h3 className="text-sm font-semibold tracking-widest uppercase text-neutral-500 mb-6">
              Compliance & Certifications
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {compliance.map((item) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={item.label}
                    whileHover={{ y: -2 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-neutral-900 border dark:border-neutral-800"
                  >
                    <div className={`p-2 rounded-lg`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-neutral-500">{item.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Security Features */}
          <div>
            <h3 className="text-sm font-semibold tracking-widest uppercase text-neutral-500 mb-6">
              Enterprise Security
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {security.map((item) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={item.label}
                    whileHover={{ y: -2 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-neutral-900 border dark:border-neutral-800"
                  >
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950">
                      <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-neutral-500">{item.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Technology Partners with REAL LOGOS */}
        <div className="mt-12 pt-12 border-t dark:border-neutral-800">
          <div className="text-center mb-8">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-neutral-500 mb-2">
              Technology Partners
            </h3>
            <p className="text-xs text-neutral-400">Trusted by industry-leading platforms</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {technologyPartners.map((partner) => {
              const LogoComponent = logos[partner.logo as keyof typeof logos]
              return (
                <motion.div
                  key={partner.name}
                  whileHover={{ scale: 1.1 }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-default"
                  title={partner.name}
                >
                  {LogoComponent && <LogoComponent />}
                  <span className="text-xs text-neutral-500">{partner.name}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}