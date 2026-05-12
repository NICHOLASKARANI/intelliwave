import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Code2, Cloud, Shield, Smartphone, Globe, Cpu, ShoppingCart, Palette,
  Database, Bot, LineChart, HeadphonesIcon, Server, Lock, Zap, ArrowRight,
  CheckCircle, Star
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Services - AI Development & Enterprise Solutions',
  description: 'Comprehensive AI software engineering services including web development, mobile apps, cloud infrastructure, enterprise solutions, and HR services.',
}

const services = [
  {
    icon: Cpu,
    title: 'AI Development',
    description: 'Custom AI agents, machine learning models, NLP solutions, and intelligent automation for enterprise.',
    features: ['Custom AI Agents', 'Machine Learning', 'Natural Language Processing', 'Computer Vision'],
    popular: true,
  },
  {
    icon: Globe,
    title: 'Custom Websites',
    description: 'Premium business websites with cutting-edge design, lightning-fast performance, and SEO optimization.',
    features: ['Responsive Design', 'SEO Optimization', 'CMS Integration', 'Performance Tuning'],
    popular: false,
  },
  {
    icon: Cloud,
    title: 'Cloud Infrastructure',
    description: 'AWS, Azure, and GCP cloud architecture with auto-scaling, monitoring, and disaster recovery.',
    features: ['Auto Scaling', 'Load Balancing', 'Disaster Recovery', '24/7 Monitoring'],
    popular: false,
  },
  {
    icon: Smartphone,
    title: 'Mobile Apps',
    description: 'Native iOS and Android apps, cross-platform solutions with offline capability and push notifications.',
    features: ['iOS & Android', 'React Native', 'Offline Support', 'Push Notifications'],
    popular: true,
  },
  {
    icon: ShoppingCart,
    title: 'E-commerce Systems',
    description: 'Advanced e-commerce platforms with M-Pesa integration, inventory management, and analytics.',
    features: ['M-Pesa Integration', 'Inventory Mgmt', 'Order Tracking', 'Analytics Dashboard'],
    popular: false,
  },
  {
    icon: Shield,
    title: 'Cybersecurity',
    description: 'Enterprise-grade security solutions, penetration testing, compliance audits, and threat monitoring.',
    features: ['Penetration Testing', 'SOC2 Compliance', 'Threat Detection', 'Security Audits'],
    popular: false,
  },
  {
    icon: Database,
    title: 'SaaS Platforms',
    description: 'End-to-end SaaS development from MVP to enterprise scale with subscription management.',
    features: ['Multi-tenant Architecture', 'Subscription Billing', 'API Development', 'Scalability'],
    popular: true,
  },
  {
    icon: Bot,
    title: 'AI Automation',
    description: 'Intelligent process automation, RPA solutions, and workflow optimization for businesses.',
    features: ['Process Automation', 'RPA Solutions', 'Workflow Design', 'Integration Hub'],
    popular: false,
  },
  {
    icon: LineChart,
    title: 'ERP Systems',
    description: 'Custom enterprise resource planning systems tailored to your business processes and workflows.',
    features: ['Financial Management', 'HR Integration', 'Supply Chain', 'Reporting'],
    popular: false,
  },
  {
    icon: HeadphonesIcon,
    title: 'HR Solutions',
    description: 'Complete HR services including recruitment, payroll, training, and employer of record.',
    features: ['Recruitment', 'Payroll Management', 'Corporate Training', 'Staff Outsourcing'],
    popular: false,
  },
  {
    icon: Server,
    title: 'API Integrations',
    description: 'RESTful and GraphQL API development, third-party integrations, and microservices architecture.',
    features: ['REST APIs', 'GraphQL', 'Microservices', 'Third-party Integration'],
    popular: false,
  },
  {
    icon: Palette,
    title: 'UI/UX Design',
    description: 'World-class user interface and experience design with prototyping and user testing.',
    features: ['Wireframing', 'Prototyping', 'User Testing', 'Design Systems'],
    popular: false,
  },
]

const technologies = [
  'React', 'Next.js', 'TypeScript', 'Python', 'Node.js', 'AWS', 'Azure', 'Docker',
  'Kubernetes', 'PostgreSQL', 'MongoDB', 'Redis', 'TensorFlow', 'PyTorch', 'GraphQL',
]

export default function ServicesPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Our{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Services
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive AI-powered software engineering services to transform your business. 
            From concept to deployment, we build enterprise-grade solutions.
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <div
                key={service.title}
                className={`group relative p-6 rounded-2xl border hover:border-primary/50 transition-all hover:shadow-xl ${
                  service.popular ? 'ring-2 ring-primary/20' : ''
                }`}
              >
                {service.popular && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-primary text-white text-xs rounded-full font-medium">
                    Popular
                  </div>
                )}
                
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                
                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{service.description}</p>
                
                <div className="space-y-2">
                  {service.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1 text-primary text-sm font-medium mt-4 hover:underline"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )
          })}
        </div>

        {/* Technology Stack */}
        <div className="mb-16 p-8 rounded-2xl border bg-gradient-to-br from-background to-primary/5">
          <h2 className="text-3xl font-bold mb-6 text-center">Our Technology Stack</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {technologies.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors cursor-default"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Project?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our team of 500+ AI engineers is ready to bring your vision to life. 
            Get a free consultation today.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="group">
                Get Free Consultation
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