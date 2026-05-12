import { Metadata } from 'next'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Award, Users, Globe, Quote } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Leadership & Management - Intelliwave Team',
  description: 'Meet PhD, Eng. Nicholas Karani and the leadership team driving Intelliwave to become Africa\'s global AI giant.',
}

export default function ManagementPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Page Header */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Our{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Leadership
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Visionary leaders engineering Africa's global AI future
          </p>
        </div>

        {/* CEO Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div className="relative">
            <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-primary/20 shadow-2xl">
              <Image
                src="/ceo.jpg"
                alt="PhD, Eng. Nicholas Karani - CEO & Founder of Intelliwave"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-3xl font-bold mb-1">Nicholas Karani</h2>
                <p className="text-white/80">PhD, Software Engineering</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-background border rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-bold">CEO & Founder</span>
              </div>
            </div>
            <div className="absolute -top-4 -left-4 bg-background border rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold">Global Vision</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-bold mb-2">PhD, Eng. Nicholas Karani</h2>
              <p className="text-primary font-semibold text-lg">Chief Executive Officer & Founder</p>
            </div>

            <p className="text-muted-foreground leading-relaxed text-lg">
              A pioneering software engineer with a doctorate in Software Engineering, Nicholas 
              combines deep technical expertise with visionary leadership to build Intelliwave 
              into Africa's first trillion-dollar AI company.
            </p>

            <div className="border-l-4 border-primary pl-4 py-2">
              <Quote className="w-6 h-6 text-primary/50 mb-2" />
              <p className="italic text-muted-foreground">
                "We are not just building a company; we are building Africa's digital future."
              </p>
              <p className="text-sm text-primary mt-2">— Nicholas Karani, CEO</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Users, label: 'Team Built', value: '500+' },
                { icon: Globe, label: 'Global Reach', value: '100+' },
                { icon: Award, label: 'Projects', value: '10K+' },
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="text-center p-4 rounded-xl border bg-background/50">
                    <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                )
              })}
            </div>

            <Link href="/contact">
              <Button size="lg" className="group">
                Connect with CEO
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Team Section */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              The{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Intelliwave Team
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              500+ AI engineers building the future across 100+ countries
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border shadow-xl group cursor-pointer">
              <Image
                src="/team-member-1.jpg"
                alt="Intelliwave engineering team collaborating on AI solutions"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold">Engineering Excellence</h3>
                <p className="text-white/80">Our team of expert AI engineers</p>
              </div>
            </div>

            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border shadow-xl group cursor-pointer">
              <Image
                src="/team-member-2.jpg"
                alt="Intelliwave team working on global AI infrastructure"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold">Global Collaboration</h3>
                <p className="text-white/80">Working across continents and time zones</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link href="/careers">
            <Button size="lg" variant="outline" className="group">
              Join Our Team
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}