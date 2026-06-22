import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Globe, MapPin, Users, Building2, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Global Presence - 100+ Countries | IntelliWave',
  description: 'IntelliWave operates in 100+ countries with offices in Nairobi, Johannesburg, Lagos, Cairo, and Dubai.',
}

const regions = [
  { name: 'East Africa', countries: 'Kenya, Tanzania, Uganda, Rwanda, Ethiopia', office: 'Nairobi (HQ)', clients: '15,000+', color: 'from-green-600 to-emerald-600' },
  { name: 'West Africa', countries: 'Nigeria, Ghana, Senegal, Ivory Coast', office: 'Lagos', clients: '8,000+', color: 'from-blue-600 to-cyan-600' },
  { name: 'Southern Africa', countries: 'South Africa, Botswana, Zambia, Zimbabwe', office: 'Johannesburg', clients: '6,000+', color: 'from-purple-600 to-pink-600' },
  { name: 'North Africa', countries: 'Egypt, Morocco, Tunisia, Algeria', office: 'Cairo', clients: '4,000+', color: 'from-orange-600 to-red-600' },
  { name: 'Middle East', countries: 'UAE, Saudi Arabia, Qatar, Oman', office: 'Dubai', clients: '3,000+', color: 'from-yellow-600 to-orange-600' },
  { name: 'Global', countries: 'Europe, Asia, Americas', office: 'Remote', clients: '14,000+', color: 'from-indigo-600 to-blue-600' },
]

export default function GlobalPresencePage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Global{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Presence</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Operating in 100+ countries with regional offices and 500+ engineers worldwide.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {regions.map((region) => (
            <div key={region.name} className="p-6 rounded-2xl border hover:shadow-lg transition-all">
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${region.color} mb-4`} />
              <h3 className="text-xl font-bold mb-2">{region.name}</h3>
              <p className="text-sm text-muted-foreground mb-1">{region.countries}</p>
              <div className="flex items-center gap-2 text-sm mt-3">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{region.office}</span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-1">
                <Users className="w-4 h-4 text-primary" />
                <span>{region.clients} clients</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border">
          <h2 className="text-3xl font-bold mb-4">Expand Globally With Us</h2>
          <Link href="/contact"><Button size="lg" className="group">Get Started <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
        </div>
      </div>
    </div>
  )
}