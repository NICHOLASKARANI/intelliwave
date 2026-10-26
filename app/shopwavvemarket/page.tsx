'use client'
import Link from 'next/link'
import { ShoppingBag, ArrowLeft } from 'lucide-react'

export default function ShopWavveMarket() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-700 font-semibold text-sm mb-6 border border-pink-100">
            <ShoppingBag className="w-4 h-4" /> WavveMarket Store
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-4">
            Shop <span className="text-pink-600">WavveMarket</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Products, tools, and plans for buyers and sellers across Africa.
          </p>
        </div>

        {/* Empty product grid — ready for uploads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Placeholder: Products will be inserted here */}
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Products coming soon</p>
            <p className="text-sm text-slate-400 mt-1">Check back shortly</p>
          </div>
        </div>
      </div>
    </div>
  )
}