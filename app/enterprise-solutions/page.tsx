import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Building2, Users, BarChart3, HeadphonesIcon, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Enterprise Solutions - Digital Transformation & IT Consulting',
  description: 'Enterprise digital transformation, IT consulting, ERP systems, managed services.',
}

const solutions = [
  { icon: Building2, title: 'Digital Transformation', desc: 'End-to-end transformation strategy and implementation.' },
  { icon: BarChart3, title: 'ERP Systems', desc: 'Custom ERP tailored to your workflows.' },
  { icon: Users, title: 'IT Consulting', desc: 'Strategic technology consulting for modernization.' },
  { icon: HeadphonesIcon, title: 'Managed Services', desc: 'Ongoing support, maintenance, and optimization.' },
]

export default function EnterpriseSolutionsPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" /> Enterprise Solutions
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Enterprise <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Solutions</span></h1>
            <p className="text-xl text-muted-foreground mb-8">Digital transformation, IT consulting, and managed services for large organizations.</p>
            <Link href="/contact"><Button size="lg" className="group">Discuss Your Needs <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border shadow-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Building2 className="w-32 h-32 text-white/30" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="font-semibold text-lg">Digital Transformation Teams</p>
              <p className="text-white/70 text-sm">Modernizing enterprise technology</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {solutions.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="p-8 rounded-2xl border hover:border-purple-300 transition-all">
                <Icon className="w-10 h-10 text-purple-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 text-white">
          <h2 className="text-3xl font-bold mb-4">Transform Your Enterprise</h2>
          <p className="text-white/80 mb-6">Schedule a consultation with our enterprise team.</p>
          <Link href="/contact"><Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">Schedule Consultation <ArrowRight className="ml-2" /></Button></Link>
        </div>
      </div>
    </div>
  )
}