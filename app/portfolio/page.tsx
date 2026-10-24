'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Globe, Shield, Zap, ShoppingBag, Store, Users } from 'lucide-react'

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      
      {/* ================= HERO ================= */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('/images/portfolio/wavvemarket-marketplace.jpeg')] bg-cover bg-center opacity-20 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/90 to-slate-900" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-sm mb-6 border border-blue-500/30">
              <Globe className="w-4 h-4" /> Global Enterprise Technology
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              The company behind <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                WaveCore ERP & WavveMarket
              </span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-slate-300 mb-10">
              We engineer the digital infrastructure powering African enterprise. From multi-tenant ERP platforms to hyper-local marketplaces, IntelliWavve builds the future of business.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/marketplace" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Explore WavveMarket
              </Link>
              <Link href="/wavecore-erp" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all backdrop-blur-sm border border-white/10 flex items-center justify-center gap-2">
                Discover WaveCore ERP <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= FLAGSHIP: WAVECORE ERP ================= */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm mb-4">
                Flagship Product
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">WaveCore ERP Platform</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                The AI-native, multi-tenant operating system for modern enterprise. Finance, HR, Inventory, Manufacturing, Procurement, and CRM — unified in one secure platform.
              </p>
              <ul className="space-y-4 mb-8">
                {['14 Enterprise Modules', 'Bank-grade security & Multi-tenancy', 'Real-time AI Analytics & Copilot'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/wavecore-erp" className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                Learn more about WaveCore ERP <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-100">
              <video 
                src="/images/portfolio/intelliwavve_animatic.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= PRIMARY CAMPAIGN: WAVVEMARKET ================= */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">WavveMarket: The Engine of African Commerce</h2>
            <p className="text-lg text-slate-400">
              Whether you're running a 5-star restaurant, a wholesale distribution network, or a fast-growing tech company, WavveMarket connects you directly with buyers and sellers across the continent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Image 1: Restaurants */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group relative rounded-2xl overflow-hidden aspect-[4/3] lg:col-span-2">
              <Image src="/images/portfolio/wavvemarket-restaurants.jpeg" alt="WavveMarket for 5-Star Restaurants" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-bold mb-2">5-Star Restaurants</h3>
                <p className="text-sm text-slate-300">Supply chain integration and direct-to-consumer ordering.</p>
              </div>
            </motion.div>

            {/* Image 2: Wholesalers */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="group relative rounded-2xl overflow-hidden aspect-[4/3]">
              <Image src="/images/portfolio/wavvemarket-wholesalers.jpeg" alt="WavveMarket for Wholesalers" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-bold mb-2">Wholesalers</h3>
                <p className="text-sm text-slate-300">Bulk inventory movement and B2B fulfillment.</p>
              </div>
            </motion.div>

            {/* Image 3: Tech Companies */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="group relative rounded-2xl overflow-hidden aspect-[4/3]">
              <Image src="/images/portfolio/wavvemarket-tech.jpeg" alt="WavveMarket for Tech Companies" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-bold mb-2">Tech Companies</h3>
                <p className="text-sm text-slate-300">Procurement of hardware, software, and enterprise assets.</p>
              </div>
            </motion.div>

            {/* Image 4: Marketplace */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="group relative rounded-2xl overflow-hidden aspect-[4/3] lg:col-span-2">
              <Image src="/images/portfolio/wavvemarket-marketplace.jpeg" alt="WavveMarket Marketplace" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-bold mb-2">The Core Marketplace</h3>
                <p className="text-sm text-slate-300">Real-time chat, verified sellers, and secure transactions.</p>
              </div>
            </motion.div>

            {/* Image 5: Buyers & Sellers */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="group relative rounded-2xl overflow-hidden aspect-[4/3] lg:col-span-3">
              <Image src="/images/portfolio/wavvemarket-buyers-sellers.jpeg" alt="WavveMarket Buyers and Sellers" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 max-w-2xl">
                <h3 className="text-2xl font-bold mb-2">Buyers & Sellers Connected</h3>
                <p className="text-sm text-slate-300">A trusted, secure ecosystem where commerce happens without friction.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Ready to scale your business?</h2>
          <p className="text-lg text-slate-600 mb-10">Join the businesses across Kenya moving their operations to IntelliWavve.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/marketplace" className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg">
              <Store className="w-5 h-5" /> Start Selling on WavveMarket
            </Link>
            <Link href="/contact" className="px-8 py-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-blue-200">
              <Users className="w-5 h-5" /> Contact Sales
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}