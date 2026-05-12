'use client'

import { motion } from 'framer-motion'
import { Code2, Cloud, Smartphone, ShoppingCart, GraduationCap, Building2 } from 'lucide-react'

const solutions = [
  { icon: Code2, title: 'Custom Web Applications', desc: 'Tailor-made web solutions designed specifically for your business workflows and requirements.' },
  { icon: Cloud, title: 'Cloud-Native Platforms', desc: 'Scalable cloud infrastructure built to grow with your business from 100 to 100 million users.' },
  { icon: Smartphone, title: 'Mobile-First Solutions', desc: 'Native and cross-platform mobile apps optimized for African markets and offline capability.' },
  { icon: ShoppingCart, title: 'E-Commerce Ecosystems', desc: 'End-to-end online retail platforms with M-Pesa integration and logistics management.' },
  { icon: GraduationCap, title: 'Learning Management', desc: 'Corporate training and education platforms for workforce development at scale.' },
  { icon: Building2, title: 'Enterprise ERPs', desc: 'Comprehensive enterprise resource planning systems customized for African enterprises.' },
]

export function TailoredSolutionsSection() {
  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Tailored Software{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Solutions
          </span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Every business is unique. We build software that fits your exact needs — 
          not the other way around.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {solutions.map((solution, index) => {
          const Icon = solution.icon
          return (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl border bg-background/50 hover:border-primary/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{solution.title}</h3>
              <p className="text-muted-foreground text-sm">{solution.desc}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}