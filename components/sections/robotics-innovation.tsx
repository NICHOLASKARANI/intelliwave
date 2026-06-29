'use client'

import { motion } from 'framer-motion'
import { Bot, Cpu, Zap, Globe, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function RoboticsInnovation() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-500/30 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container relative">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6"
          >
            <Bot className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">AI & Robotics Innovation</span>
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Engineering the{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
              Future of Automation
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Building intelligent systems that solve real-world problems. From AI-powered robotics 
            to autonomous enterprise systems, we engineer solutions for a trillion-dollar future.
          </p>
        </div>

        {/* Innovation Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            {
              icon: Bot,
              title: 'AI Robotics',
              description: 'Intelligent robotic systems for manufacturing, logistics, and healthcare automation.',
              color: 'from-blue-500 to-cyan-500',
            },
            {
              icon: Cpu,
              title: 'Autonomous Systems',
              description: 'Self-operating enterprise platforms that adapt and optimize in real-time.',
              color: 'from-purple-500 to-pink-500',
            },
            {
              icon: Globe,
              title: 'Global AI Network',
              description: 'Distributed AI infrastructure serving 100+ countries with sub-100ms latency.',
              color: 'from-green-500 to-emerald-500',
            },
            {
              icon: Zap,
              title: 'Intelligent Automation',
              description: 'End-to-end process automation reducing operational costs by 40-70%.',
              color: 'from-orange-500 to-red-500',
            },
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-blue-500/30 transition-all group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { value: '99.99%', label: 'System Uptime' },
            { value: '<10ms', label: 'Response Time' },
            { value: '1M+', label: 'AI Predictions/Day' },
            { value: '50+', label: 'AI Models Deployed' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/contact">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Explore AI Solutions
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </div>
      </div>
    </section>
  )
}