'use client'

import { motion } from 'framer-motion'
import { GraduationCap, Users, BarChart3, Shield, Scale, FileText } from 'lucide-react'

const programs = [
  { icon: GraduationCap, title: 'Leadership Development', desc: 'Executive leadership programs for C-suite and senior management.' },
  { icon: BarChart3, title: 'Sales Management', desc: 'Advanced sales strategies, pipeline management, and client acquisition.' },
  { icon: Users, title: 'Customer Service Skills', desc: 'World-class customer experience and service excellence training.' },
  { icon: Shield, title: 'Performance Management', desc: 'OKR frameworks, KPI setting, and performance review systems.' },
  { icon: Scale, title: 'Labour Laws', desc: 'Kenyan employment law, compliance, and industrial relations.' },
  { icon: FileText, title: 'HR Policies', desc: 'Policy development, handbook creation, and HR best practices.' },
]

export function CorporateTrainingSection() {
  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Corporate{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Training
          </span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Empower your workforce with industry-leading professional development programs
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program, index) => {
          const Icon = program.icon
          return (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl border bg-background/50 hover:border-primary/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{program.title}</h3>
              <p className="text-sm text-muted-foreground">{program.desc}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}