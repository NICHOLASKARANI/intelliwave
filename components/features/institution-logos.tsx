'use client'

import { motion } from 'framer-motion'

const institutions = [
  { name: 'Safaricom', logo: '🏢' },
  { name: 'KCB Bank', logo: '🏦' },
  { name: 'Equity Bank', logo: '💰' },
  { name: 'Kenya Airways', logo: '✈️' },
  { name: 'Nation Media', logo: '📰' },
  { name: 'Britam', logo: '🛡️' },
  { name: 'NCBA', logo: '💳' },
  { name: 'Strathmore University', logo: '🎓' },
  { name: 'University of Nairobi', logo: '📚' },
  { name: 'Aga Khan Hospital', logo: '🏥' },
  { name: 'Copia Global', logo: '📦' },
  { name: 'Twiga Foods', logo: '🌾' },
  { name: 'Gzen Tech Hub', logo: '🌾' },
]

export function InstitutionLogos() {
  return (
    <div className="py-16">
      <div className="text-center mb-10">
        <h3 className="text-2xl font-bold mb-2">Chosen by Leading Institutions</h3>
        <p className="text-muted-foreground">
          Trusted by top organizations across Kenya and East Africa
        </p>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {institutions.map((institution, index) => (
          <motion.div
            key={institution.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.1 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-background/50 hover:border-primary/50 transition-colors cursor-default"
          >
            <span className="text-3xl">{institution.logo}</span>
            <span className="text-xs text-muted-foreground text-center font-medium">
              {institution.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}