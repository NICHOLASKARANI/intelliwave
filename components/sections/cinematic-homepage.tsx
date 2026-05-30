'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Globe3D } from '@/components/effects/globe-3d'
import { useAnimatedCounter } from '@/hooks/use-animated-counter'
import { 
  Brain, Cloud, Shield, Code2, Zap, Globe, 
  Cpu, Database, Rocket, Users, ArrowRight 
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CinematicHomepage() {
  const missionRef = useRef(null)
  const isMissionInView = useInView(missionRef, { once: true })

  const { displayValue: users, ref: usersRef } = useAnimatedCounter(450000, 2500, 0, '', '+')
  const { displayValue: countries, ref: countriesRef } = useAnimatedCounter(100, 2000, 0, '', '+')
  const { displayValue: engineers, ref: engineersRef } = useAnimatedCounter(500, 2000, 0, '', '+')
  const { displayValue: projects, ref: projectsRef } = useAnimatedCounter(10000, 2500, 0, '', '+')

  return (
    <div className="relative">
      {/* ========== AFRICA INNOVATION MAP SECTION ========== */}
      <section className="py-24 bg-gradient-to-b from-gray-950 via-blue-950/20 to-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* 3D Globe */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="flex justify-center"
            >
              <Globe3D />
            </motion.div>

            {/* Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-green-400">Live: African Innovation Network</span>
                </div>

                <h2 className="text-5xl md:text-6xl font-bold mb-6">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                    Building Africa&apos;s
                  </span>
                  <br />
                  <span className="text-white">AI Future</span>
                </h2>

                <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                  From Nairobi to the world. We&apos;re connecting African innovation hubs 
                  with cutting-edge AI technology, creating a network of excellence 
                  across 100+ countries.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { icon: Brain, label: 'AI Research Centers', value: '12' },
                    { icon: Users, label: 'Engineers', value: '500+' },
                    { icon: Globe, label: 'African Countries', value: '54' },
                    { icon: Rocket, label: 'Innovation Hubs', value: '25' },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <Icon className="w-6 h-6 text-blue-400 mb-2" />
                        <div className="text-2xl font-bold text-white">{item.value}</div>
                        <div className="text-sm text-gray-500">{item.label}</div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== MISSION & VISION INTERACTIVE ========== */}
      <section ref={missionRef} className="py-24 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isMissionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
                Our Mission
              </span>
            </h2>
            <p className="text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
              To build Africa&apos;s first trillion-dollar AI company, 
              democratizing artificial intelligence across the continent 
              and proving that world-class technology can be engineered from Kenya.
            </p>
          </motion.div>

          {/* Animated Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              { ref: usersRef, value: users, label: 'Global Users', icon: Users },
              { ref: countriesRef, value: countries, label: 'Countries', icon: Globe },
              { ref: engineersRef, value: engineers, label: 'AI Engineers', icon: Code2 },
              { ref: projectsRef, value: projects, label: 'Projects Delivered', icon: Rocket },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  ref={stat.ref}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl"
                >
                  <Icon className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                  <div className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">{stat.label}</div>
                </motion.div>
              )
            })}
          </div>

          <div className="text-center">
            <Link href="/about">
              <Button size="lg" className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6 text-lg rounded-2xl">
                Discover Our Story
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== TECHNOLOGY STACK VISUALIZATION ========== */}
      <section className="py-24 bg-gradient-to-b from-gray-950 to-blue-950/30 relative">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                Technology Stack
              </span>
            </h2>
            <p className="text-xl text-gray-400">Powered by cutting-edge AI and cloud infrastructure</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: 'AI & ML', techs: ['TensorFlow', 'PyTorch', 'OpenAI', 'LangChain'] },
              { icon: Cloud, title: 'Cloud', techs: ['AWS', 'Azure', 'GCP', 'Vercel'] },
              { icon: Database, title: 'Data', techs: ['PostgreSQL', 'MongoDB', 'Redis', 'ClickHouse'] },
              { icon: Code2, title: 'Frontend', techs: ['Next.js', 'React', 'TypeScript', 'Tailwind'] },
              { icon: Cpu, title: 'Backend', techs: ['Node.js', 'Python', 'GraphQL', 'REST'] },
              { icon: Shield, title: 'DevOps', techs: ['Docker', 'Kubernetes', 'Terraform', 'GitHub Actions'] },
            ].map((category) => {
              const Icon = category.icon
              return (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all group"
                >
                  <Icon className="w-10 h-10 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold text-white mb-4">{category.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {category.techs.map((tech) => (
                      <span key={tech} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}