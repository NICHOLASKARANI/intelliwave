import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Quote, Linkedin, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About IntelliWavve — Global Technology Company',
  description:
    'IntelliWavve is a global technology company engineering enterprise software, artificial intelligence, and digital commerce platforms. Founded in 2022 by Engineer Nicholas Karani.',
}

const leadership = [
  {
    name: 'Nicholas Karani',
    title: 'Founder, CEO & Chairman of the Board',
    credentials: 'Engineer · AI & Software',
    image: '/leadership/ceo-nicholas-karani.jpg',
    bio: 'Engineer Nicholas Karani is the Founder, Chief Executive Officer and Chairman of the Board of IntelliWavve. Since establishing the company in 2022, he has led its strategic direction, technology vision and long-term development, driving the ambition to build an innovative technology company with global relevance. As the founding visionary, Nicholas provides executive leadership across corporate strategy, product innovation, software engineering and business development. His focus is on building scalable technology platforms, advancing intelligent systems and establishing a sustainable ecosystem that brings together enterprise software, artificial intelligence, automation and digital commerce. As Chairman of the Board, he provides strategic oversight and direction, supporting the company\'s long-term vision, governance and institutional growth.',
    quote:
      'We are building intelligent operating systems with global ambition — engineered to solve real problems and create lasting value.',
    goals: [
      'Build scalable technology platforms for global relevance',
      'Advance intelligent systems across enterprise, AI and digital commerce',
      'Establish a sustainable technology ecosystem',
      'Provide strategic oversight for long-term institutional growth',
    ],
  },
  {
    name: 'Gefferson Mbeere',
    title: 'President & Chief Operating Officer',
    credentials: 'Operations & Execution',
    image: '/leadership/coo-gefferson-mbeere.jpg',
    bio: 'Gefferson Mbeere serves as President and Chief Operating Officer of IntelliWavve, providing executive leadership across business operations, organizational execution and operational development. Since IntelliWavve\'s founding in 2022, he has been part of the leadership journey, contributing to the company\'s development and its broader ambition to establish a sustainable and globally competitive technology ecosystem. In his role as President and COO, Gefferson focuses on translating corporate strategy into effective execution, strengthening operational structures, coordinating organizational priorities and supporting the company\'s continued growth. His responsibilities include driving operational efficiency, strengthening internal collaboration and ensuring that the company\'s strategic objectives are supported by disciplined execution.',
    quote:
      'Operational discipline turns ambition into execution. Every process must support responsible, sustainable scale.',
    goals: [
      'Translate corporate strategy into disciplined execution',
      'Strengthen operational structures for responsible scaling',
      'Coordinate organizational priorities across teams',
      'Ensure strategic objectives are supported by operational rigor',
    ],
  },
  {
    name: 'Kelvin Muchui',
    title: 'Chief Financial Officer',
    credentials: 'Finance & Strategy',
    image: '/leadership/cfo-kelvin-muchui.jpg',
    bio: 'Kelvin Muchui serves as Chief Financial Officer of IntelliWavve, providing financial leadership and supporting the company\'s long-term financial sustainability, strategic planning and responsible growth. As part of the executive leadership team, Kelvin contributes to financial strategy, budgeting, resource allocation, financial oversight and the development of structures that support sustainable business operations. His role focuses on strengthening financial discipline, supporting informed executive decision-making and aligning financial resources with the company\'s strategic priorities. Through effective financial management and forward-looking planning, he supports IntelliWavve\'s ambition to develop scalable products, expand its operations and build lasting institutional value.',
    quote:
      'Financial responsibility is the foundation of long-term innovation. Sustainable growth requires discipline at every level.',
    goals: [
      'Strengthen financial discipline across the organization',
      'Support informed executive decision-making',
      'Align resources with strategic priorities',
      'Build a foundation for responsible innovation and growth',
    ],
  },
  {
    name: 'Mark Mwangi',
    title: 'Chief Technology Officer',
    credentials: 'Engineering & Architecture',
    image: '/leadership/cto-mark-mwangi.jpg',
    bio: 'Mark Mwangi serves as Chief Technology Officer of IntelliWavve, providing technology leadership and contributing to the engineering direction, technical architecture and development of the company\'s technology ecosystem. His role focuses on advancing engineering standards, strengthening technical capabilities and supporting the development of reliable, secure and scalable software platforms. Working alongside the executive leadership team, he contributes to technology strategy, system architecture, infrastructure development and the continuous evolution of IntelliWavve\'s digital products. As IntelliWavve continues to expand its enterprise software, artificial intelligence and digital commerce capabilities, Mark\'s leadership supports the technical foundations necessary to build, maintain and scale innovative technology solutions.',
    quote:
      'Engineering excellence is not negotiable. We build secure, scalable systems designed to compete internationally.',
    goals: [
      'Advance engineering standards across the platform',
      'Strengthen technical capabilities and system reliability',
      'Evolve digital products with security and scalability',
      'Ensure engineering decisions support international ambitions',
    ],
  },
]

export default function AboutPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Page Header */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            About{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              IntelliWavve
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Engineering Intelligence. Building the Future.
          </p>
        </div>

        {/* Company Story */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <h2 className="text-4xl font-bold mb-6">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Founded in 2022 by Engineer Nicholas Karani, IntelliWavve is a technology company
              committed to advancing the way businesses, institutions and individuals interact with
              technology. Built on a vision of making intelligent technology more accessible,
              practical and transformative, IntelliWavve develops software platforms, intelligent
              operating systems, enterprise solutions and digital infrastructure designed to address
              real-world challenges and unlock new possibilities for a global market.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We believe technology should do more than digitize existing processes. It should
              simplify complexity, strengthen decision-making, connect people and systems, and
              create opportunities for sustainable growth. Our ecosystem brings together enterprise
              software, artificial intelligence, digital commerce, business automation and custom
              technology solutions — building interconnected platforms that help organizations
              operate more intelligently, efficiently and confidently across industries worldwide.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Since our establishment, IntelliWavve has been guided by a leadership team united by a
              shared commitment to engineering excellence, operational discipline, financial
              responsibility and continuous innovation. Our ambition extends beyond individual
              applications: we are building a connected technology ecosystem capable of supporting
              businesses, enterprises and institutions across different industries and markets —
              engineered from Africa, designed for the world.
            </p>
          </div>
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10 rounded-[2.5rem] blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-primary/20 shadow-2xl shadow-primary/20 ring-1 ring-white/10 transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-primary/40">
              <Image
                src="/products/intelliwavve-card.png"
                alt="IntelliWavve — Engineering the Intelligence Behind Tomorrow"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-6 mb-24">
          <div className="rounded-3xl border border-border/60 bg-card p-8 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
            <h3 className="text-2xl font-bold mb-3">Our Vision</h3>
            <p className="text-muted-foreground leading-relaxed">
              To become a globally recognized technology company, engineering intelligent systems and
              transformative digital infrastructure that empower organizations, accelerate innovation
              and shape the future of business and society.
            </p>
          </div>
          <div className="rounded-3xl border border-border/60 bg-card p-8 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
            <h3 className="text-2xl font-bold mb-3">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed">
              To democratize access to advanced technology by designing, developing and delivering
              intelligent software, AI-driven solutions and scalable digital platforms that solve
              meaningful problems and create lasting value.
            </p>
          </div>
        </div>

        {/* Product Showcase */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Our{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Products
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              An integrated ecosystem of AI, enterprise, and commerce platforms
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'WaveCore ERP',
                tagline: 'Enterprise Resource Planning',
                description:
                  'Integrated global business operations — finance, procurement, inventory, HR, CRM, manufacturing, and analytics in one intelligent platform.',
                image: '/products/wavecore.png',
                href: '/products/wavecore',
              },
              {
                name: 'WavveMarket',
                tagline: 'Digital Commerce Platform',
                description:
                  'Commerce infrastructure for sellers and marketplaces worldwide — with payments, logistics, and analytics built in.',
                image: '/products/wavvemarket.png',
                href: '/products/wavvemarket',
              },
              {
                name: 'Wavve SI',
                tagline: 'Applied Intelligence',
                description:
                  'Enterprise AI solutions — document processing, decision support, automation, and intelligent assistants for global business.',
                image: '/products/wavveai.png',
                href: '/products',
              },
              {
                name: 'Custom Platforms',
                tagline: 'Engineering Services',
                description:
                  'Bespoke software, cloud infrastructure, and integration engineering delivered by IntelliWavve engineering teams worldwide.',
                image: '/products/custom-platforms.png',
                href: '/contact',
              },
            ].map((product) => (
              <div
                key={product.name}
                className="group rounded-2xl bg-card overflow-hidden border border-border/60 hover:border-primary/40 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-[10px] uppercase tracking-widest opacity-90 font-semibold">
                      {product.tagline}
                    </p>
                    <p className="font-bold text-lg drop-shadow-lg">{product.name}</p>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="font-bold text-lg mb-2">{product.name}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {product.description}
                  </p>
                  <Link
                    href={product.href}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-accent transition-colors group/link"
                  >
                    Learn More
                    <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leadership */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Our{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Leadership Team
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Visionary leaders driving IntelliWavve&apos;s mission to build a globally recognized
              technology company
            </p>
          </div>

          <div className="space-y-16">
            {leadership.map((leader, index) => (
              <div
                key={leader.name}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-dense' : ''
                }`}
              >
                {/* Image */}
                <div className={`relative group ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 rounded-[2rem] blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-700" />
                  <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-primary/20 shadow-2xl shadow-primary/10 ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-[1.02]">
                    <Image
                      src={leader.image}
                      alt={`${leader.name} - ${leader.title} at IntelliWavve`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-bold drop-shadow-lg">{leader.name}</h3>
                      <p className="text-white/90 font-medium">{leader.title}</p>
                      <p className="text-white/70 text-sm">{leader.credentials}</p>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className={index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  <div className="mb-4">
                    <h3 className="text-3xl font-bold mb-1">{leader.name}</h3>
                    <p className="text-primary font-semibold text-lg">{leader.title}</p>
                    <p className="text-muted-foreground text-sm">{leader.credentials}</p>
                  </div>

                  <p className="text-muted-foreground leading-relaxed mb-6">{leader.bio}</p>

                  <div className="border-l-4 border-primary pl-4 py-2 mb-6">
                    <Quote className="w-5 h-5 text-primary/50 mb-2" />
                    <p className="italic text-muted-foreground">&quot;{leader.quote}&quot;</p>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Strategic Focus</h4>
                    <div className="space-y-2">
                      {leader.goals.map((goal) => (
                        <div key={goal} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span className="text-muted-foreground">{goal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Mail className="w-4 h-4" />
                      Contact
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/contact">
            <Button size="lg" className="group text-lg px-8 py-6">
              Partner With Our Leadership Team
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}