'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  User, Phone, Mail, Shield, CreditCard, Wallet, 
  Star, Clock, MapPin, ChevronRight, LogOut, Settings
} from 'lucide-react'

export default function RideAccountPage() {
  const [rides, setRides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ride')
      .then(r => r.json())
      .then(data => setRides(data.rides || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/ride" className="font-bold text-lg">← Back</Link>
          <span className="font-bold">Account</span>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {/* Profile */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Rider</h2>
              <p className="text-sm text-muted-foreground">Enjoy smoother and safer rides</p>
            </div>
          </div>
          <div className="mt-4">
            <button className="w-full py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700">
              Verify Identity
            </button>
          </div>
        </div>

        {/* Wavve Balance */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-bold">Wavve Balance</p>
                <p className="text-sm text-muted-foreground">KSh 0.00</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-4">
          <h3 className="font-bold mb-4">Payment Methods</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <span className="font-bold text-green-600">M</span>
              </div>
              <div>
                <p className="font-medium">M-Pesa</p>
                <p className="text-xs text-muted-foreground">Default payment method</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <span className="font-bold text-red-600">A</span>
              </div>
              <div>
                <p className="font-medium">Airtel Money</p>
                <p className="text-xs text-muted-foreground">Add payment method</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Debit/Credit Card</p>
                <p className="text-xs text-muted-foreground">Add card</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ride History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-4">
          <h3 className="font-bold mb-4">Recent Rides</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : rides.length > 0 ? (
            <div className="space-y-3">
              {rides.map(ride => (
                <div key={ride.id} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                  <p className="font-medium">{ride.pickupAddress} → {ride.dropoffAddress}</p>
                  <p className="text-xs text-muted-foreground">{ride.rideType} • KSh {ride.price} • {ride.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No rides yet</p>
          )}
        </div>

        {/* Settings */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-3">
          <h3 className="font-bold mb-4">Settings</h3>
          {[
            { icon: Shield, label: 'Safety', desc: 'Manage safety features' },
            { icon: MapPin, label: 'Saved Places', desc: 'Home, Work, Favorites' },
            { icon: Clock, label: 'Schedule', desc: 'Book ahead' },
            { icon: Settings, label: 'Settings', desc: 'App preferences' },
          ].map(item => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}