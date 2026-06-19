'use client'

import { motion } from 'framer-motion'
import { Zap, Shield, Cloud, Code2, Cpu, Globe, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const products = [
  {
    icon: Cpu,
    title: 'IntelliAI',
    description: 'Enterprise AI platform for building, training, and deploying machine learning models at scale.',
    features: ['AutoML', 'Model Monitoring', 'API Integration', 'Custom Training'],
    color: 'from-indigo-600 to-blue-600',
    tag: 'Most Popular',
  },
  {
    icon: Cloud,
    title: 'IntelliCloud',
    description: 'Cloud infrastructure optimized for AI workloads with auto-scaling and global edge deployment.',
    features: ['Auto Scaling', 'Edge Deploy', 'GPU Clusters', '99.99% SLA'],
    color: 'from-purple-600 to-pink-600',
    tag: 'New',
  },
  {
    icon: Shield,
    title: 'IntelliSecure',
    description: 'AI-powered security platform with real-time threat detection and automated incident response.',
    features: ['Threat Detection', 'Auto Response', 'Compliance', '24/7 Monitoring'],
    color: 'from-green-600 to-emerald-600',
    tag: 'Enterprise',
  },
]

export function ProductShowcase() {
  return (
    <section className="py-24 md:py-32 bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Our Products
          </span>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Purpose-Built for{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Enterprise AI
            </span>
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Production-ready AI infrastructure trusted by Fortune 500 companies.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product, index) => {
            const Icon = product.icon
            return (
              <motion.div
                key={product.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white dark:bg-neutral-900 rounded-3xl border dark:border-neutral-800 overflow-hidden hover:shadow-2xl transition-all"
              >
                {product.tag && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-medium">
                    {product.tag}
                  </div>
                )}
                <div className="p-8">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${product.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{product.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-6">{product.description}</p>
                  <div className="space-y-2 mb-6">
                    {product.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:gap-3 transition-all"
                  >
                    Learn more <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}