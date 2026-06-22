import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Cloud, Server, Container, GitBranch, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cloud & DevOps Services - Infrastructure Automation',
  description: 'Cloud infrastructure, DevOps automation, CI/CD pipelines, managed hosting. AWS, Azure, GCP certified.',
}

const services = [
  { icon: Cloud, title: 'Cloud Infrastructure', desc: 'AWS, Azure, GCP with auto-scaling, load balancing, disaster recovery.' },
  { icon: Container, title: 'Containerization', desc: 'Docker and Kubernetes for scalable, portable deployments.' },
  { icon: GitBranch, title: 'CI/CD Pipelines', desc: 'Automated testing, building, deployment with GitHub Actions.' },
  { icon: Server, title: 'Managed Hosting', desc: 'Fully managed cloud with 99.99% uptime SLA and 24/7 monitoring.' },
]

export default function CloudDevOpsPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 text-sm font-medium mb-6">
              <Cloud className="w-4 h-4" /> Cloud & DevOps
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Cloud & <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600">DevOps</span></h1>
            <p className="text-xl text-muted-foreground mb-8">Automated infrastructure, continuous deployment, and managed cloud with enterprise reliability.</p>
            <Link href="/contact"><Button size="lg" className="group">Discuss Infrastructure <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border shadow-2xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
            <Cloud className="w-32 h-32 text-white/30" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="font-semibold text-lg">Cloud Infrastructure & Automation</p>
              <p className="text-white/70 text-sm">Scalable deployments with 99.99% uptime</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {services.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="p-8 rounded-2xl border hover:border-cyan-300 transition-all">
                <Icon className="w-10 h-10 text-cyan-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Scale?</h2>
          <p className="text-white/80 mb-6">Get a free infrastructure assessment from our cloud architects.</p>
          <Link href="/contact"><Button size="lg" className="bg-white text-cyan-600 hover:bg-gray-100">Get Cloud Assessment <ArrowRight className="ml-2" /></Button></Link>
        </div>
      </div>
    </div>
  )
}