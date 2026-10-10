import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Quote, Linkedin, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About IntelliWave - Leadership Team & Company Vision',
  description: 'Meet the leadership team driving IntelliWave: CEO Nicholas Karani, COO Gefferson Mbeere, CFO Kelvin Muchui, CTO Mark Mwangi.',
}

const leadership = [
  {
    name: 'Nicholas Karani',
    title: 'CEO & Founder',
    credentials: 'AI & Software Engineer',
    image: '/leadership/ceo-nicholas-karani.jpg',
    bio: 'As Founder and CEO, Nicholas Karani leads the strategic direction and long-term development of IntelliWave. His focus spans corporate vision, product strategy, technological innovation, and the development of an integrated ecosystem connecting AI, enterprise software, automation, and digital commerce. He is committed to building a technology company capable of competing on a global stage while contributing to the advancement of Africa\'s digital and engineering capabilities. His leadership philosophy centers on ambitious thinking, hands-on innovation, continuous improvement, and building systems that create lasting value beyond individual products.',
    quote: 'We are building Africa\'s digital future. World-class technology engineered from Kenya, for the world.',
    goals: [
      'Build the intelligent infrastructure for the next multi-planetary era of human civilization',
      'Deploy AI solutions to 10,000+ enterprises',
      'Create 10,000 high-value tech jobs in Africa',
      'Establish IntelliWave as a global technology leader',
    ],
  },
  {
    name: 'Gefferson Mbeere',
    title: 'Chief Operations Officer',
    credentials: 'CPA, BCOM',
    image: '/leadership/coo-gefferson-mbeere.jpg',
    bio: 'Certified Public Accountant and operations strategist. Gefferson oversees IntelliWave\'s global operations, ensuring seamless delivery of enterprise solutions across 100+ countries. His expertise in operational efficiency and financial management drives the company\'s scalable growth strategy.',
    quote: 'Operational excellence is the foundation of global scale. Every process must be world-class.',
    goals: [
      'Scale operations to serve 195 countries',
      'Achieve 99.99% operational efficiency',
      'Build robust global delivery frameworks',
      'Establish regional offices across Africa',
    ],
  },
  {
    name: 'Kelvin Muchui',
    title: 'Chief Financial Officer',
    credentials: 'CPA, BCOM',
    image: '/leadership/cfo-kelvin-muchui.jpg',
    bio: 'Certified Public Accountant and financial strategist. Kelvin manages IntelliWave\'s financial architecture, ensuring sustainable growth and investor confidence. His financial modeling expertise supports the company\'s long-term capital strategy as it builds infrastructure for global scale.',
    quote: 'Financial discipline and strategic investment are the engines of sustainable growth.',
    goals: [
      'Achieve $1 billion revenue milestone',
      'Build investor-grade financial systems',
      'Maintain 40%+ year-over-year growth',
      'Establish global banking partnerships',
    ],
  },
  {
    name: 'Mark Mwangi',
    title: 'Chief Technology Officer',
    credentials: 'AI/Software Engineer',
    image: '/leadership/cto-mark-mwangi.jpg',
    bio: 'Senior AI and software engineer leading IntelliWave\'s technology vision. Mark architects the company\'s AI systems, cloud infrastructure, and enterprise platforms. His technical leadership ensures IntelliWave delivers cutting-edge solutions that rival the world\'s best technology companies.',
    quote: 'Technology excellence is non-negotiable. We build systems that scale to serve billions.',
    goals: [
      'Build world-class AI infrastructure',
      'Deploy 50+ enterprise AI products',
      'Achieve 99.99% platform uptime',
      'Lead AI research and innovation in Africa',
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
              IntelliWave
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
              Founded by AI & Software Engineer Nicholas Karani, IntelliWave was born from a bold vision: 
              to build Africa's first trillion-dollar AI company. What started as a small team 
              of passionate engineers in Nairobi has grown into a global force of 500+ AI 
              specialists serving clients across 100+ countries.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Today, we partner with Fortune 500 companies, governments, and startups to 
              deliver enterprise-grade AI solutions, cloud infrastructure, and custom software 
              that rivals the world's best technology companies.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our leadership team combines deep technical expertise, financial acumen, and 
              operational excellence to drive IntelliWave's mission of democratizing AI 
              across Africa and building a global technology powerhouse.
            </p>
          </div>
          <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-primary/20 shadow-2xl">
            <Image
              src="/products/intelliwavve-card.png"
              alt="IntelliWave — Engineering the Intelligence Behind Tomorrow"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
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
                description: 'Integrated business operations — finance, procurement, inventory, HR, CRM, manufacturing, and analytics in one platform.',
                image: '/products/wavecore.png',
              },
              {
                name: 'WavveMarket',
                tagline: 'Digital Commerce Platform',
                description: 'Commerce infrastructure for sellers, retailers, and marketplaces with payments, logistics, and analytics built in.',
                image: '/products/wavvemarket.png',
              },
              {
                name: 'WavveAI',
                tagline: 'Applied Intelligence',
                description: 'Enterprise AI solutions — document processing, decision support, automation, and intelligent assistants for business.',
                image: '/products/wavveai.png',
              },
              {
                name: 'Custom Platforms',
                tagline: 'Engineering Services',
                description: "Bespoke software, cloud infrastructure, and integration engineering delivered by IntelliWave's engineering teams.",
                image: '/products/custom-platforms.png',
              },
            ].map((product) => (
              <div key={product.name} className="rounded-2xl border bg-card overflow-hidden hover:shadow-2xl transition-all group">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs uppercase tracking-wider opacity-80">{product.tagline}</p>
                    <p className="font-bold text-lg">{product.name}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="font-bold text-lg mb-2">{product.name}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>


        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Our{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Leadership Team
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Visionary leaders driving IntelliWave's mission to build Africa's global AI giant
            </p>
          </div>

          <div className="space-y-16">
            {leadership.map((leader, index) => (
              <div key={leader.name} className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-dense' : ''
              }`}>
                {/* Image */}
                <div className={`relative ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-primary/20 shadow-2xl">
                    <Image
                      src={leader.image}
                      alt={`${leader.name} - ${leader.title} at IntelliWave`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-bold">{leader.name}</h3>
                      <p className="text-white/80">{leader.title}</p>
                      <p className="text-white/60 text-sm">{leader.credentials}</p>
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
                    <p className="italic text-muted-foreground">"{leader.quote}"</p>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Strategic Goals</h4>
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
