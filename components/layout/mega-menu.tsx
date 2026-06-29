'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  Building2, Cpu, Cloud, Shield, Factory, GraduationCap, 
  Heart, Truck, Store, Landmark, Briefcase, ArrowRight 
} from 'lucide-react'

const megaMenuSections = {
  products: {
    title: 'Products',
    icon: Cpu,
    items: [
      { name: 'WaveCore ERP', desc: 'Enterprise resource planning', href: '/enterprise-solutions' },
      { name: 'AI Analytics', desc: 'Business intelligence platform', href: '/ai-engineering' },
      { name: 'Document Intelligence', desc: 'AI-powered document processing', href: '/ai-engineering' },
      { name: 'API Platform', desc: 'Enterprise integration hub', href: '/api-docs' },
      { name: 'AI Agents', desc: 'Autonomous AI assistants', href: '/ai-engineering' },
    ]
  },
  industries: {
    title: 'Industries',
    icon: Building2,
    items: [
      { name: 'Government', desc: 'Digital transformation', href: '/industry-solutions' },
      { name: 'Banking & Finance', desc: 'AI-powered banking', href: '/industry-solutions' },
      { name: 'Healthcare', desc: 'Hospital management', href: '/industry-solutions' },
      { name: 'Manufacturing', desc: 'IIoT & automation', href: '/iiot-automation' },
      { name: 'Education', desc: 'Learning platforms', href: '/industry-solutions' },
    ]
  },
  solutions: {
    title: 'Solutions',
    icon: Cloud,
    items: [
      { name: 'Cybersecurity', desc: 'Enterprise security', href: '/cybersecurity' },
      { name: 'Cloud & DevOps', desc: 'Infrastructure', href: '/cloud-devops' },
      { name: 'AI Engineering', desc: 'Custom AI models', href: '/ai-engineering' },
      { name: 'Software Development', desc: 'Custom applications', href: '/software-development' },
      { name: 'HR Solutions', desc: 'Talent management', href: '/hr-consultancy' },
    ]
  }
}

export function MegaMenu() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  return (
    <div className="hidden lg:block">
      <div className="flex gap-6">
        {Object.entries(megaMenuSections).map(([key, section]) => {
          const Icon = section.icon
          return (
            <div
              key={key}
              onMouseEnter={() => setActiveSection(key)}
              onMouseLeave={() => setActiveSection(null)}
              className="relative"
            >
              <button className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors py-6">
                <Icon className="w-4 h-4" />
                {section.title}
              </button>

              <AnimatePresence>
                {activeSection === key && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-72 rounded-2xl border bg-background shadow-2xl p-4 z-50"
                  >
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors group"
                        >
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <Link href="/services" className="text-sm text-primary font-medium hover:underline">
                        View all {section.title.toLowerCase()} →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}