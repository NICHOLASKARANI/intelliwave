import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FlaskConical, Lightbulb, Rocket, Microscope, ArrowRight, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Innovation Lab - Research & Development | IntelliWave',
  description: 'IntelliWave Innovation Lab: AI research, emerging technology, robotics, and future systems.',
}

const projects = [
  { icon: FlaskConical, title: 'AI Research', desc: 'Pushing boundaries in machine learning, NLP, and computer vision.', status: 'Active', color: 'from-purple-600 to-pink-600' },
  { icon: Lightbulb, title: 'Emerging Tech', desc: 'Exploring quantum computing, edge AI, and blockchain integration.', status: 'Research', color: 'from-blue-600 to-cyan-600' },
  { icon: Rocket, title: 'Space Systems', desc: 'AI for satellite data analysis and space technology applications.', status: 'Development', color: 'from-orange-600 to-red-600' },
  { icon: Microscope, title: 'Robotics Lab', desc: 'Autonomous systems, industrial robotics, and smart manufacturing.', status: 'Active', color: 'from-green-600 to-emerald-600' },
]

export default function InnovationLabPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 text-sm font-medium mb-6">
            <FlaskConical className="w-4 h-4" /> R&D Division
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Innovation{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Lab</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Researching and building the next generation of AI and autonomous systems.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {projects.map((p) => {
            const Icon = p.icon
            return (
              <div key={p.title} className="p-8 rounded-2xl border hover:shadow-xl transition-all">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${p.color} p-3 mb-4`}>
                  <Icon className="w-full h-full text-white" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold">{p.title}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 text-xs">{p.status}</span>
                </div>
                <p className="text-muted-foreground">{p.desc}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 text-white">
          <h2 className="text-3xl font-bold mb-4">Partner With Our Lab</h2>
          <p className="text-white/80 mb-6">Collaborate on cutting-edge AI research.</p>
          <Link href="/contact"><Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">Collaborate <ArrowRight className="ml-2" /></Button></Link>
        </div>
      </div>
    </div>
  )
}