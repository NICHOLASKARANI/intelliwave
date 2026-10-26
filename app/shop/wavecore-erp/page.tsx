'use client'
import Link from 'next/link'

export default function WaveCoreShop() {
  const products = [
    { name: 'WaveCore Starter', price: 'KSh 5,000/mo', desc: 'Core ERP: Finance, CRM, Inventory. Perfect for growing SMEs.' },
    { name: 'WaveCore Pro', price: 'KSh 15,000/mo', desc: 'Includes HR, Payroll, Procurement, and advanced multi-tenant controls.' },
    { name: 'WaveCore Enterprise', price: 'Custom', desc: 'Unlimited users, dedicated infrastructure, and custom AI modules.' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-4">Shop WaveCore ERP</h1>
          <p className="text-xl text-slate-600">Enterprise-grade software for global operations.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((p, i) => (
            <div key={i} className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-xl text-white">
              <h3 className="text-xl font-bold mb-2">{p.name}</h3>
              <p className="text-2xl font-extrabold text-blue-400 mb-4">{p.price}</p>
              <p className="text-slate-400 mb-8">{p.desc}</p>
              <Link href="/wavecore-erp/subscription/pay" className="block text-center w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors">
                Subscribe Now
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}