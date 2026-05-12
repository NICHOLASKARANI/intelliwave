import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Search, Users, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Executive Search & Headhunting Services',
  description: 'Identify and recruit top C-suite and senior management talent across Africa with Intelliwave executive search.',
}

export default function ExecutiveSearchPage() {
  return (
    <div className="py-20">
      <div className="container max-w-4xl">
        <h1 className="text-5xl font-bold mb-6">Executive Search & Headhunting</h1>
        <p className="text-xl text-muted-foreground mb-12">
          We identify and recruit top C-suite and senior management talent across Africa.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Search, title: 'Targeted Search', desc: 'Precision headhunting for executive roles' },
            { icon: Users, title: 'Vetted Network', desc: 'Access to 50,000+ senior professionals' },
            { icon: Globe, title: 'Pan-African Reach', desc: 'Recruitment across 54 African countries' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="p-6 border rounded-xl text-center">
                <Icon className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <Link href="/contact">
            <Button size="lg">Request Executive Search</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}