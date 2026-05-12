import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Award, Globe, Users, Target, Eye, Quote } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Intelliwave - Africa\'s Global AI Giant',
  description: 'Learn about Intelliwave, our mission, vision, CEO PhD Eng. Nicholas Karani, and our team of 500+ AI engineers.',
}

export default function AboutPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Page Header */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            About{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Intelliwave
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Engineering the Future with AI — Building Africa's Global AI Giant
          </p>
        </div>

        {/* Company Story */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <h2 className="text-4xl font-bold mb-6">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Founded by PhD, Eng. Nicholas Karani, Intelliwave was born from a bold vision: 
              to build Africa's first trillion-dollar AI company. What started as a small team 
              of passionate engineers in Nairobi has grown into a global force of 500+ AI 
              specialists serving clients across 100+ countries.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Today, we partner with Fortune 500 companies, governments, and startups to 
              deliver enterprise-grade AI solutions, cloud infrastructure, and custom software 
              that rivals the world's best technology companies.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Users, value: '450K+', label: 'Active Users' },
                { icon: Globe, value: '100+', label: 'Countries' },
                { icon: Award, value: '10K+', label: 'Projects' },
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
          </div>
          <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <span className="text-4xl font-bold text-white">IW</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Intelliwave</h3>
              <p className="text-muted-foreground">Est. 2024</p>
              <p className="text-muted-foreground mt-2">Nairobi, Kenya</p>
            </div>
          </div>
        </div>

        {/* Mission & Vision Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Our{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Mission & Vision
              </span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                To democratize AI and software engineering excellence across Africa, 
                building transformative digital solutions that empower businesses to 
                compete globally. We strive to be the bridge between African innovation 
                and world-class technology.
              </p>
            </div>
            <div className="p-8 rounded-2xl border bg-gradient-to-br from-accent/5 to-accent/10">
              <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                To be Africa's first trillion-dollar AI company — a global technology 
                leader headquartered in Kenya, rivaling the world's most innovative 
                companies. We envision an Africa where technology knows no boundaries.
              </p>
            </div>
          </div>
        </div>

        {/* CEO & Management Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Our{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Leadership
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Meet the visionary leading Africa's AI revolution
            </p>
          </div>

          {/* CEO Profile */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
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

              <p className="text-muted-foreground leading-relaxed">
                Under his leadership, Intelliwave has grown from a startup in Nairobi to a global 
                enterprise with 500+ engineers serving clients across 100+ countries. His vision 
                of democratizing AI across Africa drives every aspect of the company's strategy.
              </p>

              <div className="border-l-4 border-primary pl-4 py-2">
                <Quote className="w-6 h-6 text-primary/50 mb-2" />
                <p className="italic text-muted-foreground">
                  "We are not just building a company; we are building Africa's digital future. 
                  Our mission is to prove that world-class technology can be created right here 
                  in Kenya, for the world."
                </p>
                <p className="text-sm text-primary mt-2">— Nicholas Karani, CEO</p>
              </div>

              <Link href="/contact">
                <Button size="lg" className="group">
                  Connect with Leadership
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Team Photos */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border shadow-xl">
              <Image
                src="/team-member-1.jpg"
                alt="Intelliwave engineering team collaborating on AI solutions"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold">Engineering Excellence</h3>
                <p className="text-white/80">500+ AI engineers building the future</p>
              </div>
            </div>

            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border shadow-xl">
              <Image
                src="/team-member-2.jpg"
                alt="Intelliwave team working on global AI infrastructure"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold">Global Collaboration</h3>
                <p className="text-white/80">Working across 100+ countries</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Link href="/contact">
            <Button size="lg" className="group text-lg px-8 py-6">
              Partner With Us
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}