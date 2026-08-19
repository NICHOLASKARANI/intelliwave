'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bike, Car, Package, Sparkles, Clock, MapPin, Bell } from 'lucide-react'

export default function RidePage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-950 to-neutral-950" />
      <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative w-full max-w-lg text-center">
        {/* Logo */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-xl opacity-50" />
          <Image src="/images/Wavecore.jpeg" alt="Wavve Ride" width={96} height={96} className="relative rounded-3xl object-cover mx-auto" />
        </div>

        {/* Badge */}
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4 text-emerald-400" /> Coming Soon
        </span>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">
          Wavve <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">Ride</span>
        </h1>
        
        <p className="text-xl text-neutral-300 mb-8">
          Nairobi's smartest ride-hailing platform is almost here.
        </p>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="p-4 rounded-2xl bg-white/5 text-center">
            <Bike className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs text-neutral-300">Boda Rides</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 text-center">
            <Car className="w-8 h-8 text-teal-400 mx-auto mb-2" />
            <p className="text-xs text-neutral-300">Car Rides</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 text-center">
            <Package className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-xs text-neutral-300">Delivery</p>
          </div>
        </div>

        {/* Notify Me */}
        <div className="bg-white/5 rounded-3xl border border-white/10 p-6 mb-6">
          <h3 className="font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" /> Get Notified
          </h3>
          <p className="text-sm text-neutral-400 mb-4">
            Be the first to know when we launch in Nairobi
          </p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input type="email" placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500" />
            <button className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all">
              Notify Me
            </button>
          </div>
        </div>

        {/* Launch Info */}
        <div className="flex justify-center gap-6 text-sm text-neutral-400">
          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-400" /> Nairobi</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-teal-400" /> Q4 2026</span>
        </div>

        <Link href="/" className="inline-block mt-8 text-neutral-500 hover:text-white transition-colors">
          ← Back to IntelliWavve
        </Link>
      </div>
    </div>
  )
}