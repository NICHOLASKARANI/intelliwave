'use client'

import { motion } from 'framer-motion'
import { logos, clientPartners, globalPartners } from '@/components/ui/company-logos'

export function ClientLogos() {
  return (
    <section className="py-16 border-y bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enterprise Clients */}
        <div className="text-center mb-10">
          <h3 className="text-sm font-semibold tracking-widest uppercase text-neutral-500 mb-2">
            Trusted by Industry Leaders
          </h3>
          <p className="text-xs text-neutral-400">
            Join 450,000+ businesses already building with IntelliWave
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {clientPartners.map((client, index) => {
            const LogoComponent = logos[client.logo as keyof typeof logos]
            return (
              <motion.div
                key={client.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-900 border dark:border-neutral-800 text-center hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col items-center justify-center gap-3 min-h-[100px]"
              >
                {LogoComponent && <LogoComponent />}
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{client.name}</span>
              </motion.div>
            )
          })}
        </div>

        {/* Global Technology Leaders */}
        <div className="text-center mb-8">
          <h3 className="text-sm font-semibold tracking-widest uppercase text-neutral-500 mb-2">
            Global Technology Partners
          </h3>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {globalPartners.map((partner, index) => {
            const LogoComponent = logos[partner.logo as keyof typeof logos]
            return (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
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
    </section>
  )
}