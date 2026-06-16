import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Code2, Cloud, Shield, Smartphone, Globe, Cpu, ShoppingCart, Palette,
  Database, Bot, LineChart, HeadphonesIcon, Server, Lock, Zap, ArrowRight,
  CheckCircle, Factory
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Services - AI Development & Enterprise Solutions',
  description: 'Comprehensive AI software engineering services solving real business problems.',
}

const problems = [
  {
    problem: 'Manual processes slowing your business?',
    solution: 'AI Automation',
    icon: Bot,
    description: 'Automate repetitive tasks, reduce errors by 90%, and free your team for strategic work.',
    features: ['Workflow automation', 'Document processing', 'Email automation', 'Data entry elimination'],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    problem: 'Can\'t scale your technology?',
    solution: 'Cloud Infrastructure',
    icon: Cloud,
    description: 'Auto-scaling cloud architecture that grows with your business from 100 to 100M users.',
    features: ['Auto scaling', 'Load balancing', 'Disaster recovery', '99.99% uptime'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    problem: 'Losing customers to competitors?',
    solution: 'Custom Web & Mobile Apps',
    icon: Smartphone,
    description: 'Beautiful, fast applications that delight users and keep them coming back.',
    features: ['iOS & Android', 'Web apps', 'Offline support', 'Push notifications'],
    color: 'from-green-500 to-emerald-500',
  },
  {
    problem: 'Security breaches keeping you up at night?',
    solution: 'Enterprise Security',
    icon: Shield,
    description: 'Bank-grade security with 24/7 monitoring and instant threat response.',
    features: ['SOC2 compliant', 'Penetration testing', '24/7 monitoring', 'Incident response'],
    color: 'from-red-500 to-orange-500',
  },
  {
    problem: 'Factory downtime costing millions?',
    solution: 'IIoT Automation',
    icon: Factory,
    description: 'Predictive maintenance and real-time monitoring that reduces downtime by 70%.',
    features: ['Predictive maintenance', 'Real-time monitoring', 'Edge computing', 'Digital twins'],
    color: 'from-yellow-500 to-orange-500',
  },
  {
    problem: 'Can\'t find the right talent?',
    solution: 'HR & Recruitment',
    icon: HeadphonesIcon,
    description: 'End-to-end recruitment, payroll, and staff outsourcing for your growing team.',
    features: ['Executive search', 'Payroll management', 'Staff outsourcing', 'Corporate training'],
    color: 'from-cyan-500 to-blue-500',
  },
]

export default function ServicesPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Solutions That Solve Real Problems</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            We Solve Your{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Toughest Challenges
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Every service we offer is designed to solve a specific business problem. 
            Tell us your challenge, and we'll engineer the solution.
          </p>
        </div>

        {/* Problem-Solution Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {problems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.solution} className="group p-6 rounded-2xl border hover:border-primary/50 hover:shadow-xl transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} p-3 flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-full h-full text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-red-400 font-medium mb-1">❌ {item.problem}</p>
                    <p className="text-sm text-green-400 font-medium">✅ {item.solution}</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                <div className="space-y-2">
                  {item.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Process Section */}
        <div className="mb-16 p-8 rounded-2xl border bg-gradient-to-br from-background to-primary/5">
          <h2 className="text-3xl font-bold mb-8 text-center">How We Work</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Discovery', desc: 'We listen and understand your challenge' },
              { step: '02', title: 'Design', desc: 'Engineer the perfect solution architecture' },
              { step: '03', title: 'Build', desc: '500+ engineers bring it to life' },
              { step: '04', title: 'Scale', desc: 'Launch, monitor, and grow globally' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border">
          <h2 className="text-3xl font-bold mb-4">What Problem Can We Solve For You?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Describe your challenge and we'll engineer a custom solution within 24 hours.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="group">
                Tell Us Your Challenge
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/estimator">
              <Button size="lg" variant="outline">
                AI Project Estimator
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}