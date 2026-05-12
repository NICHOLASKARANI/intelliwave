import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Search, Users, Globe, Star, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Executive Search & Headhunting Services',
  description: 'Identify and recruit top C-suite and senior management talent across Africa with Intelliwave executive search.',
}

export default function ExecutiveSearchPage() {
  return (
    <div className="py-20">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Executive Search & Headhunting</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We identify and recruit top C-suite and senior management talent across Africa.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Search, title: 'Targeted Search', description: 'Precision headhunting for executive roles' },
            { icon: Users, title: 'Vetted Network', description: 'Access to 50,000+ senior professionals' },
            { icon: Globe, title: 'Pan-African Reach', description: 'Recruitment across 54 African countries' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="p-6 border rounded-xl text-center hover:border-primary/50 transition-colors">
                <Icon className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <Link href="/contact">
            <Button size="lg" className="group">
              Request Executive Search
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}