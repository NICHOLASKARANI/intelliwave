import { Metadata } from 'next'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Cloud, Server, Container, GitBranch, ArrowRight, CheckCircle, Shield, Zap, Globe, Database } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cloud & DevOps Services - Infrastructure Automation & Deployment | IntelliWave',
  description: 'Cloud infrastructure, DevOps automation, CI/CD pipelines, managed hosting. AWS, Azure, GCP certified. 99.99% uptime.',
}

const services = [
  { icon: Cloud, title: 'Cloud Infrastructure', desc: 'Multi-cloud architecture on AWS, Azure, and GCP with auto-scaling, load balancing, and disaster recovery.', features: ['AWS', 'Azure', 'GCP', 'Auto-scaling', 'Load Balancing', 'Disaster Recovery'] },
  { icon: Container, title: 'Containerization & K8s', desc: 'Docker and Kubernetes orchestration for scalable, portable deployments across any environment.', features: ['Docker', 'Kubernetes', 'Helm Charts', 'Service Mesh', 'Auto-scaling', 'Rolling Updates'] },
  { icon: GitBranch, title: 'CI/CD Pipelines', desc: 'Automated testing, building, and deployment with GitHub Actions, Jenkins, and GitLab CI.', features: ['GitHub Actions', 'Jenkins', 'GitLab CI', 'Automated Testing', 'Blue-Green Deploy', 'Canary Releases'] },
  { icon: Server, title: 'Managed Hosting', desc: 'Fully managed cloud hosting with 99.99% uptime SLA, 24/7 monitoring, and instant scaling.', features: ['99.99% Uptime', '24/7 Monitoring', 'Auto-backups', 'SSL Management', 'CDN Integration', 'DDoS Protection'] },
]

const platforms = ['AWS', 'Microsoft Azure', 'Google Cloud', 'Vercel', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions', 'Prometheus', 'Grafana']

const stats = [
  { icon: Shield, value: '99.99%', label: 'Uptime SLA' },
  { icon: Zap, value: '<10ms', label: 'Latency' },
  { icon: Globe, value: '200+', label: 'Edge Locations' },
  { icon: Database, value: '100%', label: 'Automated Backups' },
]

export default function CloudDevOpsPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Hero */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 text-sm font-medium mb-6">
              <Cloud className="w-4 h-4" /> Cloud & DevOps Excellence
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Cloud &{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600">
                DevOps
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Automated infrastructure, continuous deployment, and managed cloud services 
              with enterprise-grade reliability and 99.99% uptime SLA.
            </p>
            <div className="flex gap-4">
              <Link href="/contact">
                <Button size="lg" className="group">
                  Discuss Infrastructure
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/estimator">
                <Button size="lg" variant="outline">Get Cloud Estimate</Button>
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-cyan-200 dark:border-cyan-800 shadow-2xl">
            <Image
              src="/images/cloud-devops.jpg"
              alt="Cloud infrastructure and automation with DevOps engineering teams"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="font-semibold text-lg">Cloud Infrastructure & Automation</p>
              <p className="text-white/70 text-sm">Scalable deployments with enterprise reliability</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="text-center p-6 rounded-2xl border bg-background/50 hover:shadow-md transition-shadow">
                <Icon className="w-6 h-6 text-cyan-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            )
          })}
        </div>

        {/* Services */}
        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {services.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="group p-8 rounded-2xl border hover:border-cyan-300 dark:hover:border-cyan-800 hover:shadow-xl transition-all">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 p-3 mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground mb-6">{item.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {item.features.map((f) => (
                    <span key={f} className="px-2 py-1 rounded-md bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-xs font-medium">{f}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Platforms */}
        <div className="mb-24 p-8 rounded-3xl border bg-gradient-to-br from-background to-cyan-500/5">
          <h2 className="text-3xl font-bold mb-6 text-center">Platforms & Tools</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {platforms.map((p) => (
              <span key={p} className="px-4 py-2 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 text-sm font-medium hover:bg-cyan-100 dark:hover:bg-cyan-900 transition-colors cursor-default">{p}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Scale Your Infrastructure?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">Get a free cloud assessment from our certified architects.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-cyan-600 hover:bg-gray-100">Get Cloud Assessment <ArrowRight className="ml-2" /></Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}