'use client'

import { motion } from 'framer-motion'
import { Code2, Users, GitBranch, Terminal, Cpu, Globe } from 'lucide-react'

const teamImages = [
  {
    title: 'Software Architecture',
    description: 'Senior architects designing scalable enterprise systems',
    icon: GitBranch,
    color: 'from-blue-600 to-cyan-600',
  },
  {
    title: 'AI Engineering',
    description: 'Machine learning engineers training custom AI models',
    icon: Cpu,
    color: 'from-purple-600 to-pink-600',
  },
  {
    title: 'Product Strategy',
    description: 'Cross-functional teams planning product roadmaps',
    icon: Users,
    color: 'from-green-600 to-emerald-600',
  },
  {
    title: 'Remote Development',
    description: 'Distributed teams collaborating across 100+ countries',
    icon: Globe,
    color: 'from-orange-600 to-red-600',
  },
  {
    title: 'Code Review',
    description: 'Rigorous peer review ensuring enterprise-grade quality',
    icon: Code2,
    color: 'from-indigo-600 to-blue-600',
  },
  {
    title: 'CI/CD Pipeline',
    description: 'Automated testing and deployment for reliable releases',
    icon: Terminal,
    color: 'from-pink-600 to-rose-600',
  },
]

export function EngineeringCulture() {
  return (
    <section className="py-24 md:py-32 bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-sm font-medium mb-6">
            <Code2 className="w-4 h-4" />
            Engineering Excellence
          </span>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Built By{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              World-Class Engineers
            </span>
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
            500+ engineers across 100+ countries building enterprise AI systems with the same rigor as the world's best technology companies.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamImages.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border dark:border-neutral-800 p-8"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">{item.description}</p>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Join Our Engineering Team</h3>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            We're hiring AI engineers, software architects, and product designers who want to build enterprise systems that transform African businesses.
          </p>
          <a
            href="https://github.com/NICHOLASKARANI/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-neutral-100 transition-colors"
          >
            <Github className="w-5 h-5" />
            View Our GitHub
          </a>
        </div>
      </div>
    </section>
  )
}