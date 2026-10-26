'use client'
import Link from 'next/link'
import Image from 'next/image'

export default function WavveMarketShop() {
  const products = [
    { name: 'Premium Storefront Plan', price: 'KSh 2,500/mo', desc: 'Full access to WavveMarket seller tools, analytics, and verified badge.' },
    { name: 'Logistics & Delivery Integration', price: 'KSh 1,500/mo', desc: 'Connect your store to local boda and truck delivery networks.' },
    { name: 'Enterprise Bulk Listing', price: 'Custom', desc: 'For wholesalers managing 1,000+ SKUs. Automated inventory sync.' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-4">Shop WavveMarket</h1>
          <p className="text-xl text-slate-600">Plans and tools for buyers and sellers across Africa.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((p, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{p.name}</h3>
              <p className="text-2xl font-extrabold text-pink-600 mb-4">{p.price}</p>
              <p className="text-slate-600 mb-8">{p.desc}</p>
              <Link href="/contact" className="block text-center w-full py-3 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-500 transition-colors">
                Purchase / Inquire
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}