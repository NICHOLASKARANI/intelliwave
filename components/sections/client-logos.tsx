'use client'

import { motion } from 'framer-motion'

const clients = [
  { name: 'Safaricom', industry: 'Telecom', employees: '6,500+', country: 'Kenya' },
  { name: 'KCB Group', industry: 'Banking', employees: '12,000+', country: 'East Africa' },
  { name: 'Equity Bank', industry: 'Financial Services', employees: '10,000+', country: 'Africa' },
  { name: 'Kenya Airways', industry: 'Aviation', employees: '4,000+', country: 'Global' },
  { name: 'Nation Media Group', industry: 'Media', employees: '1,500+', country: 'East Africa' },
  { name: 'Britam Holdings', industry: 'Insurance', employees: '3,000+', country: 'Africa' },
  { name: 'Aga Khan University', industry: 'Education', employees: '14,000+', country: 'Global' },
  { name: 'Copia Global', industry: 'E-commerce', employees: '2,000+', country: 'Kenya' },
]

export function ClientLogos() {
  return (
    <section className="py-16 border-y bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h3 className="text-sm font-semibold tracking-widest uppercase text-neutral-500 mb-2">
            Trusted by Industry Leaders
          </h3>
          <p className="text-xs text-neutral-400">
            Join 450,000+ businesses already building with IntelliWave
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {clients.map((client, index) => (
            <motion.div
              key={client.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2 }}
              className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border dark:border-neutral-800 text-center hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
            >
              <p className="font-bold text-lg mb-1">{client.name}</p>
              <p className="text-xs text-neutral-500">{client.industry}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-[10px] text-neutral-400">{client.employees}</span>
                <span className="text-[10px] text-neutral-400">•</span>
                <span className="text-[10px] text-neutral-400">{client.country}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}