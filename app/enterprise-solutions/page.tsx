import { Metadata } from 'next'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Building2, Users, BarChart3, HeadphonesIcon, ArrowRight, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Enterprise Solutions - Digital Transformation & IT Consulting',
  description: 'Enterprise digital transformation, IT consulting, ERP systems, and managed services for large organizations.',
}

const solutions = [
  {
    icon: Building2,
    title: 'Digital Transformation',
    description: 'End-to-end digital transformation strategy and implementation for legacy enterprises.',
  },
  {
    icon: BarChart3,
    title: 'ERP Systems',
    description: 'Custom enterprise resource planning systems tailored to your workflows.',
  },
  {
    icon: Users,
    title: 'IT Consulting',
    description: 'Strategic technology consulting for enterprise architecture and modernization.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Managed Services',
    description: 'Ongoing support, maintenance, and optimization for your technology stack.',
  },
]

export default function EnterpriseSolutionsPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Hero */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              Enterprise Solutions
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Enterprise{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                Solutions
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Digital transformation, IT consulting, and managed services for large organizations 
              modernizing their technology infrastructure.
            </p>
            <Link href="/contact">
              <Button size="lg" className="group">
                Discuss Your Needs
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border shadow-2xl">
            <Image
              src="/images/enterprise-solutions.jpg"
              alt="Enterprise digital transformation and IT consulting teams"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-white font-semibold text-lg">Digital Transformation Teams</p>
              <p className="text-white/70 text-sm">Modernizing enterprise technology infrastructure</p>
            </div>
          </div>
        </div>

        {/* Solutions */}
        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {solutions.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="p-8 rounded-2xl border hover:border-purple-300 dark:hover:border-purple-800 transition-all">
                <Icon className="w-10 h-10 text-purple-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 text-white">
          <h2 className="text-3xl font-bold mb-4">Transform Your Enterprise</h2>
          <p className="text-white/80 mb-6">Schedule a consultation with our enterprise solutions team.</p>
          <Link href="/contact">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              Schedule Consultation
              <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}