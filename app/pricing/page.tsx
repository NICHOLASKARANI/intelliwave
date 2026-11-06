import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Check, ArrowRight, Shield, Zap, Star, Clock, 
  HeadphonesIcon, CreditCard, Building2, Phone,
  BadgeCheck, Globe, Server, Users
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing - Enterprise AI Solutions | Transparent Pricing Kenya',
  description: 'Competitive pricing for AI development, web applications, e-commerce, and enterprise solutions. Pay via Co-operative Bank Lipa Na M-Pesa Business Number 400200.',
}

const pricingPlans = [
  {
    name: 'Starter',
    description: 'Perfect for small businesses starting their digital journey',
    price: '150,000',
    range: '150K – 300K',
    timeline: '2-4 weeks',
    popular: false,
    features: [
      'Custom website design',
      'Mobile responsive',
      'SEO optimization',
      'Contact forms',
      'Social media integration',
      'Google Maps',
      'SSL certificate',
      '3 months support',
    ],
    color: 'from-blue-500 to-cyan-500',
    icon: Globe,
  },
  {
    name: 'Growth',
    description: 'For growing businesses needing e-commerce capabilities',
    price: '100,000',
    range: '100K – 500K',
    timeline: '4-8 weeks',
    popular: true,
    features: [
      'Online store setup',
      'M-Pesa integration',
      'Bank payments',
      'Product management',
      'Order tracking',
      'Inventory system',
      'Customer accounts',
      'Analytics dashboard',
      '6 months support',
    ],
    color: 'from-purple-500 to-pink-500',
    icon: Zap,
  },
  {
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    price: '300,000',
    range: '300K – 3M+',
    timeline: '8-16 weeks',
    popular: false,
    features: [
      'Custom application development',
      'Database design',
      'API integration',
      'User authentication',
      'Admin dashboard',
      'Cloud hosting',
      'Scalable architecture',
      'Security audit',
      '12 months support',
    ],
    color: 'from-orange-500 to-red-500',
    icon: Building2,
  },
]

const addOns = [
  { name: 'AI Chatbot Integration', price: 'From KSh 50,000', icon: HeadphonesIcon },
  { name: 'Mobile App Development', price: 'From KSh 200,000', icon: Phone },
  { name: 'Cloud Migration', price: 'From KSh 100,000', icon: Server },
  { name: 'Cybersecurity Audit', price: 'From KSh 75,000', icon: Shield },
  { name: 'Ongoing Maintenance', price: 'From KSh 15,000/month', icon: Clock },
  { name: 'Corporate Training', price: 'From KSh 50,000/session', icon: Users },
]

const faqs = [
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept Lipa Na M-Pesa via Co-operative Bank (Business Number: 400200, Account Number: 01103362733001), and direct bank transfers to Co-operative Bank Kenya. Contact us for other arrangements.',
  },
  {
    question: 'How do I pay via M-Pesa?',
    answer: 'Go to M-Pesa → Lipa Na M-Pesa → Buy Goods and Services → Enter Business Number: 400200 → Enter Amount → Enter PIN → Send. Then WhatsApp confirmation to +254 714 694 493.',
  },
  {
    question: 'How long does a typical project take?',
    answer: 'Business websites: 2-4 weeks. E-commerce: 4-8 weeks. Custom web applications: 8-16 weeks.',
  },
  {
    question: 'Do you offer maintenance after launch?',
    answer: 'Yes! All projects include free support (3-12 months). We also offer ongoing maintenance from KSh 15,000/month.',
  },
  {
    question: 'Can I upgrade my plan later?',
    answer: 'Absolutely. You can upgrade at any time with seamless data migration.',
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No hidden fees. The price includes everything - design, development, testing, deployment, and support.',
  },
]

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <BadgeCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Transparent Pricing • No Hidden Fees</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Simple,{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Transparent Pricing
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Enterprise-grade solutions at competitive Kenyan prices.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.name}
                className={`relative group rounded-3xl border-2 transition-all duration-300 hover:shadow-2xl ${
                  plan.popular
                    ? 'border-primary bg-gradient-to-b from-primary/5 to-background shadow-xl scale-105 md:scale-110'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-primary/50 bg-background'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                    <Star className="w-4 h-4 fill-white" />
                    Most Popular
                  </div>
                )}
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} p-2.5`}>
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-muted-foreground">KSh</span>
                      <span className="text-5xl font-bold">{plan.price}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Range: {plan.range}</div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" /> Delivery: {plan.timeline}
                    </div>
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
                    <Button className={`w-full py-6 text-lg rounded-xl group ${plan.popular ? 'bg-primary hover:bg-primary/90' : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90'}`}>
                      Get Started <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add-on Services */}
        <div className="mb-16 p-8 md:p-12 rounded-3xl border bg-gradient-to-br from-background to-primary/5">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Add-on Services</h2>
            <p className="text-muted-foreground">Enhance your project with additional capabilities</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {addOns.map((addon) => {
              const Icon = addon.icon
              return (
                <div key={addon.name} className="flex items-center justify-between p-4 rounded-xl border bg-background/50 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-sm">{addon.name}</span>
                  </div>
                  <span className="text-primary font-bold text-sm whitespace-nowrap">{addon.price}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* WORLD-CLASS PAYMENT SECTION */}
        <div className="mb-16 rounded-3xl border-2 border-green-500/30 overflow-hidden bg-gradient-to-br from-background to-green-500/5">
          <div className="p-6 md:p-8 border-b border-green-500/20 bg-gradient-to-r from-green-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Pay Securely</h2>
                <p className="text-sm text-muted-foreground">Via Co-operative Bank Lipa Na M-Pesa</p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-white dark:bg-neutral-900">
            <div className="relative w-full max-w-3xl mx-auto aspect-[3/2]">
              <Image
                src="/payments/INTELLIWAVE PAYMENT.jpeg"
                alt="IntelliWave Payment - Co-operative Bank Lipa Na M-Pesa Business Number 400200"
                fill
                className="object-contain rounded-2xl shadow-lg"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            </div>
          </div>

          <div className="p-6 md:p-8 grid md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-green-300 dark:border-green-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">MPESA</span>
                <h3 className="font-bold text-lg">Lipa Na M-Pesa</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">via Co-operative Bank Kenya</p>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Business Number</p>
                    
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 tracking-wider font-mono">400200</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Account Number</p>
                    
                  </div>
                  <p className="text-sm font-bold text-green-600 dark:text-green-400 tracking-wider font-mono break-all">01103362733001</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Account Name</p>
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">NIC NOVARANN LAUNCHPAD ENTERPRISES</p>
                </div>
              </div>
              <details className="mt-3 text-xs text-muted-foreground">
                <summary className="cursor-pointer font-bold hover:text-foreground">How to pay</summary>
                <ol className="mt-2 space-y-1 list-decimal list-inside pl-1">
                  <li>Go to M-Pesa menu</li>
                  <li>Select Lipa Na M-Pesa, then Pay Bill</li>
                  <li>Enter Business No: 400200</li>
                  <li>Enter Account: 01103362733001</li>
                  <li>Enter Amount, then PIN, then Send</li>
                </ol>
              </details>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-blue-300 dark:border-blue-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">CHAT</span>
                <h3 className="font-bold text-lg">Confirm Payment</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Send proof of payment via WhatsApp for instant verification</p>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 mb-3">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">WhatsApp</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">+254 714 694 493</p>
              </div>
              <a
                href="https://wa.me/254714694493"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors text-sm"
              >
                <Phone className="w-4 h-4" />
                Open WhatsApp
              </a>
              <p className="text-xs text-muted-foreground mt-3 text-center">Include your name, amount, and M-Pesa receipt code</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-purple-300 dark:border-purple-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">BANK</span>
                <h3 className="font-bold text-lg">Bank Transfer</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">For larger projects, direct transfer to Co-operative Bank</p>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Bank</p>
                  <p className="text-sm font-bold text-purple-600 dark:text-purple-400">Co-operative Bank Kenya</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Account Name</p>
                  <p className="text-xs font-bold text-purple-600 dark:text-purple-400">NIC NOVARANN LAUNCHPAD ENTERPRISES</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Account Number</p>
                  <p className="text-sm font-bold text-purple-600 dark:text-purple-400 font-mono break-all">01103362733001</p>
                </div>
              </div>
              <a
                href="mailto:sales@intelliwavve.com?subject=Bank Transfer Details Request"
                className="flex items-center justify-center gap-2 w-full py-3 mt-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-colors text-sm"
              >
                Request Full Bank Details
              </a>
            </div>
          </div>

          <div className="px-6 md:px-8 py-4 border-t border-green-500/20 bg-green-500/5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span>Powered by Co-operative Bank Kenya - Secure M-Pesa Integration</span>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid md:grid-cols-4 gap-4 mb-16">
          {[
            { icon: Shield, title: 'SOC 2 Certified', desc: 'Enterprise security' },
            { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Always available' },
            { icon: Zap, title: 'Fast Delivery', desc: 'Agile methodology' },
            { icon: BadgeCheck, title: 'Satisfaction Guaranteed', desc: 'Money back' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="text-center p-6 rounded-2xl border bg-background/50">
                <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            )
          })}
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-3 max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <details key={index} className="group border rounded-xl">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-medium hover:bg-muted/50 transition-colors rounded-xl">
                  {faq.question}
                  <ArrowRight className="w-4 h-4 group-open:rotate-90 transition-transform text-muted-foreground" />
                </summary>
                <p className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-primary to-accent text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Pay via Co-operative Bank Lipa Na M-Pesa <strong className="text-white">Business No: 400200</strong> or book a consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100 px-8 py-6 text-lg rounded-2xl font-bold">
                Get Free Consultation <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="https://wa.me/254714694493" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-2xl border-white/30 text-white hover:bg-white/10">
                <Phone className="w-5 h-5 mr-2" /> WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
