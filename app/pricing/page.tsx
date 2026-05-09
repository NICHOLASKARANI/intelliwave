import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing - Transparent Enterprise AI Solutions',
  description: 'Competitive pricing for AI development, web applications, e-commerce platforms, and enterprise solutions in Kenya.',
}

const pricingPlans = [
  {
    title: 'Premium Business Websites',
    price: 'KSh 150,000',
    range: '150,000 – 300,000+',
    features: [
      'Custom design & development',
      'Mobile responsive',
      'SEO optimization',
      'Contact forms',
      'Social media integration',
      'Google Maps integration',
      'Performance optimization',
      '3 months support',
    ],
    popular: false,
  },
  {
    title: 'Advanced E-commerce',
    price: 'KSh 100,000',
    range: '100,000 – 500,000+',
    features: [
      'Online store setup',
      'Payment integration (M-Pesa/Stripe)',
      'Product management',
      'Order tracking',
      'Inventory management',
      'Customer accounts',
      'Analytics dashboard',
      '6 months support',
    ],
    popular: true,
  },
  {
    title: 'Custom Web Applications',
    price: 'KSh 300,000',
    range: '300,000 – 3,000,000+',
    features: [
      'Custom application development',
      'Database design',
      'API integration',
      'User authentication',
      'Admin dashboard',
      'Cloud hosting setup',
      'Scalable architecture',
      '12 months support',
    ],
    popular: false,
  },
]

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Enterprise-grade solutions at competitive Kenyan prices
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan) => (
            <div
              key={plan.title}
              className={`p-8 border rounded-xl relative ${
                plan.popular ? 'border-primary ring-2 ring-primary' : ''
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm">
                  Most Popular
                </span>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.title}</h3>
              <div className="text-4xl font-bold text-primary mb-2">{plan.price}</div>
              <div className="text-sm text-muted-foreground mb-6">Range: {plan.range}</div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/contact">
                <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                  Get Started
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}