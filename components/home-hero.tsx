'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Building2, Store, Bike, ArrowRight, CheckCircle, Shield, Zap, Globe } from 'lucide-react'

export default function HomeHero() {
  const services = [
    {
      name: 'WaveCore ERP',
      desc: 'Complete business management: Finance, CRM, Inventory, HR, Manufacturing',
      href: '/wavecore-erp',
      icon: Building2,
      color: 'from-indigo-600 to-purple-700',
      features: ['14 Modules', 'KSh 500/month', 'Multi-tenant'],
    },
    {
      name: 'Marketplace',
      desc: 'Buy and sell anything: Vehicles, Property, Electronics, Fashion',
      href: '/marketplace',
      icon: Store,
      color: 'from-blue-600 to-cyan-700',
      features: ['Free to use', '30+ Categories', 'Buyer/Seller chat'],
    },
    {
      name: 'Wavve Ride',
      desc: 'Request rides: Boda, Car, Delivery. Fast and affordable',
      href: '/ride',
      icon: Bike,
      color: 'from-green-600 to-emerald-700',
      features: ['Boda Rides', 'Car Rides', 'Delivery'],
    },
  ]

  return (
    <section className="py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-6xl font-bold mb-4">
            IntelliWavve
          </h1>
          <p className="text-xl lg:text-2xl text-muted-foreground mb-6">
            World's Largest Software & Technology Company
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/wavecore-erp/auth/signup"
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/marketplace"
              className="px-6 py-3 rounded-xl border font-medium hover:bg-neutral-100 flex items-center gap-2">
              <Store className="w-4 h-4" /> Browse Marketplace
            </Link>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {services.map(service => {
            const Icon = service.icon
            return (
              <Link key={service.name} href={service.href}
                className="group rounded-3xl border bg-white dark:bg-neutral-900 overflow-hidden hover:shadow-2xl transition-all">
                <div className={`bg-gradient-to-br ${service.color} p-6`}>
                  <Icon className="w-12 h-12 text-white mb-4" />
                  <h3 className="text-xl font-bold text-white">{service.name}</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-4">{service.desc}</p>
                  <div className="space-y-2">
                    {service.features.map(feature => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-blue-600 text-sm font-medium group-hover:gap-3 transition-all">
                    Learn More <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <Globe className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">Global</p>
            <p className="text-xs text-muted-foreground">Multi-country support</p>
          </div>
          <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <Shield className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">Secure</p>
            <p className="text-xs text-muted-foreground">Data isolation</p>
          </div>
          <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <Zap className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">Fast</p>
            <p className="text-xs text-muted-foreground">Optimized performance</p>
          </div>
          <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <Building2 className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">14+</p>
            <p className="text-xs text-muted-foreground">ERP Modules</p>
          </div>
        </div>
      </div>
    </section>
  )
}