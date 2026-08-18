import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Check, ArrowRight, HeadphonesIcon, Shield, Zap, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing - Transparent Enterprise AI Solutions Kenya',
  description: 'Competitive pricing for AI development, web applications, e-commerce platforms, and enterprise solutions in Kenya. Starting from KSh 100,000.',
}

const pricingPlans = [
  {
    title: 'Premium Business Websites',
    price: 'KSh 150,000',
    range: '150,000 – 300,000+',
    description: 'Professional websites that establish your brand online',
    features: [
      'Custom design & development',
      'Mobile responsive design',
      'SEO optimization',
      'Contact forms integration',
      'Social media integration',
      'Google Maps integration',
      'Performance optimization',
      '3 months free support',
      'SSL certificate included',
      'Basic analytics setup',
    ],
    popular: false,
    delivery: '2-4 weeks',
  },
  {
    title: 'Advanced E-commerce',
    price: 'KSh 100,000',
    range: '100,000 – 500,000+',
    description: 'Complete online stores with payment processing',
    features: [
      'Online store setup',
      'M-Pesa & Stripe integration',
      'Product management system',
      'Order tracking dashboard',
      'Inventory management',
      'Customer accounts & profiles',
      'Analytics dashboard',
      '6 months free support',
      'Mobile app integration',
      'Multi-vendor capability',
    ],
    popular: true,
    delivery: '4-8 weeks',
  },
  {
    title: 'Custom Web Applications',
    price: 'KSh 300,000',
    range: '300,000 – 3,000,000+',
    description: 'Enterprise-grade web applications tailored to your needs',
    features: [
      'Custom application development',
      'Database design & optimization',
      'API development & integration',
      'User authentication system',
      'Admin dashboard',
      'Cloud hosting setup',
      'Scalable architecture',
      '12 months free support',
      'Security audit included',
      'Performance monitoring',
    ],
    popular: false,
    delivery: '8-16 weeks',
  },
]

const addOns = [
  { name: 'AI Chatbot Integration', price: 'From KSh 50,000' },
  { name: 'Mobile App Development', price: 'From KSh 200,000' },
  { name: 'Cloud Migration', price: 'From KSh 100,000' },
  { name: 'Cybersecurity Audit', price: 'From KSh 75,000' },
  { name: 'Ongoing Maintenance', price: 'From KSh 15,000/month' },
  { name: 'Corporate Training', price: 'From KSh 50,000/session' },
]

const faqs = [
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept M-Pesa, bank transfers, Stripe (credit/debit cards), and cryptocurrency for international clients.',
  },
  {
    question: 'How long does a typical project take?',
    answer: 'Business websites take 2-4 weeks, e-commerce 4-8 weeks, and custom web applications 8-16 weeks depending on complexity.',
  },
  {
    question: 'Do you offer maintenance after launch?',
    answer: 'Yes! All projects include free support (3-12 months depending on package). We also offer ongoing maintenance plans.',
  },
  {
    question: 'Can you work with our existing systems?',
    answer: 'Absolutely. We specialize in integrating with existing systems, APIs, and legacy infrastructure.',
  },
  {
    question: 'What technologies do you use?',
    answer: 'We use modern tech stacks including Next.js, React, TypeScript, Python, Node.js, AWS, PostgreSQL, and more.',
  },
]

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Transparent{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Pricing
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Enterprise-grade solutions at competitive Kenyan prices. No hidden fees, 
            transparent deliverables.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan) => (
            <div
              key={plan.title}
              className={`relative p-8 rounded-2xl border transition-all hover:shadow-xl ${
                plan.popular
                  ? 'border-primary ring-2 ring-primary/20 bg-gradient-to-b from-primary/5 to-background'
                  : 'hover:border-primary/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Star className="w-4 h-4 fill-white" />
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{plan.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              
              <div className="mb-4">
                <div className="text-4xl font-bold text-primary">{plan.price}</div>
                <div className="text-sm text-muted-foreground">Range: {plan.range}</div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Delivery: {plan.delivery}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/contact">
                <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Add-on Services */}
        <div className="mb-16 p-8 rounded-2xl border bg-gradient-to-br from-background to-primary/5">
          <h2 className="text-3xl font-bold mb-6 text-center">Add-on Services</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {addOns.map((addon) => (
              <div key={addon.name} className="flex items-center justify-between p-4 rounded-xl border bg-background/50">
                <span className="font-medium text-sm">{addon.name}</span>
                <span className="text-primary font-bold text-sm">{addon.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: Shield, title: 'Enterprise Security', desc: 'SOC2 compliant, AES-256 encryption' },
            { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Round-the-clock technical assistance' },
            { icon: Zap, title: 'Fast Delivery', desc: 'Agile methodology, rapid deployment' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="text-center p-6 rounded-xl border">
                <Icon className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            )
          })}
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq) => (
              <details key={faq.question} className="group border rounded-xl">
                <summary className="flex items-center justify-between p-4 cursor-pointer font-medium">
                  {faq.question}
                  <ArrowRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="px-4 pb-4 text-muted-foreground text-sm">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border">
          <h2 className="text-3xl font-bold mb-4">Need a Custom Quote?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Every business is unique. Contact us for a personalized quote tailored to your specific requirements.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="group">
                Request Custom Quote
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/estimator">
              <Button size="lg" variant="outline">
                Use AI Estimator
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}