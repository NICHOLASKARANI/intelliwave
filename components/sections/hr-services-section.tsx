'use client'

import { motion } from 'framer-motion'
import { Search, Users, Briefcase, FileText, CreditCard, UserPlus } from 'lucide-react'
import Link from 'next/link'

const hrServices = [
  {
    icon: Search,
    title: 'Executive Search & Headhunting',
    desc: 'Identify and recruit top C-suite and senior management talent across Africa.',
    href: '/executive-search',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: UserPlus,
    title: 'Recruitment Service',
    desc: 'End-to-end recruitment solutions from job advertising to candidate placement.',
    href: '/recruitment',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Briefcase,
    title: 'HR Consultancy',
    desc: 'Strategic HR advisory, organizational design, and workforce planning.',
    href: '/hr-consultancy',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: CreditCard,
    title: 'Payroll Service',
    desc: 'Comprehensive payroll management, tax compliance, and benefits administration.',
    href: '/payroll',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: FileText,
    title: 'Employer of Record',
    desc: 'Hire talent anywhere with our EOR service handling all legal compliance.',
    href: '/employer-of-record',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Users,
    title: 'Staff Outsourcing',
    desc: 'Scale your team with skilled professionals managed by Intelliwave.',
    href: '/staff-outsourcing',
    color: 'from-cyan-500 to-blue-500',
  },
]

export function HRServicesSection() {
  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          HR & Talent{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Solutions
          </span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Complete human resources and talent management services for modern enterprises
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hrServices.map((service, index) => {
          const Icon = service.icon
          return (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={service.href}>
                <div className="p-6 rounded-2xl border bg-background/50 hover:border-primary/50 transition-all group h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{service.desc}</p>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}