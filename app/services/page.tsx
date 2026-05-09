import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Code2, Cloud, Shield, Smartphone, Globe, Cpu, ShoppingCart, Palette } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Services - AI Development & Enterprise Solutions',
  description: 'Comprehensive AI software engineering services including web development, mobile apps, cloud infrastructure, and enterprise solutions.',
}

const services = [
  { icon: Code2, title: 'AI Development', description: 'Custom AI agents, machine learning models, and intelligent automation solutions.' },
  { icon: Globe, title: 'Custom Websites', description: 'Premium business websites with cutting-edge design and performance.' },
  { icon: Cpu, title: 'Enterprise Applications', description: 'Scalable enterprise software solutions for large organizations.' },
  { icon: Cloud, title: 'Cloud Infrastructure', description: 'AWS, Azure, and GCP cloud architecture and deployment.' },
  { icon: Smartphone, title: 'Mobile Apps', description: 'Native and cross-platform mobile applications for iOS and Android.' },
  { icon: ShoppingCart, title: 'E-commerce Systems', description: 'Advanced e-commerce platforms with payment integration.' },
  { icon: Shield, title: 'Cybersecurity', description: 'Enterprise-grade security solutions and compliance.' },
  { icon: Palette, title: 'UI/UX Design', description: 'World-class user interface and experience design.' },
]

export default function ServicesPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Our Services</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive AI-powered software engineering services to transform your business
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <div key={service.title} className="p-6 border rounded-xl hover:border-primary/50 transition-colors">
                <Icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                <p className="text-muted-foreground">{service.description}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <Link href="/contact">
            <Button size="lg" className="bg-primary">
              Get a Free Consultation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}