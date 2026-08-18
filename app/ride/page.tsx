'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  MapPin, Navigation, Bike, Car, Package, User, Home, 
  Clock, Shield, Star, Loader2, ChevronRight
} from 'lucide-react'

export default function RidePage() {
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [rideType, setRideType] = useState('Boda')
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)
  const [locationAllowed, setLocationAllowed] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)

  useEffect(() => {
    // Request location access
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationAllowed(true)
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          setLocationAllowed(false)
        }
      )
    }
  }, [])

  const rideTypes = [
    { name: 'Boda', desc: '2-wheel rides', icon: Bike, price: 'KSh 50', time: '2 min' },
    { name: 'Car', desc: 'Comfortable rides', icon: Car, price: 'KSh 200', time: '5 min' },
    { name: 'Delivery', desc: 'Quick delivery', icon: Package, price: 'KSh 100', time: '3 min' },
  ]

  const handleRequest = async () => {
    if (!pickup || !dropoff) return
    setRequesting(true)

    try {
      const res = await fetch('/api/ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddress: pickup,
          dropoffAddress: dropoff,
          rideType,
          pickupLat: userLocation?.lat,
          pickupLng: userLocation?.lng,
          price: rideType === 'Boda' ? 50 : rideType === 'Car' ? 200 : 100,
        }),
      })

      if (res.ok) {
        setRequested(true)
        setTimeout(() => {
          window.location.href = '/marketplace'
        }, 3000)
      }
    } catch {} finally { setRequesting(false) }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="Wavve Ride" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold text-lg">Wavve Ride</span>
          </Link>
          <Link href="/ride/account" className="p-2 rounded-xl hover:bg-neutral-100">
            <User className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {/* Location Access */}
        {!locationAllowed && (
          <div className="bg-amber-50 dark:bg-amber-950 rounded-2xl border border-amber-200 p-4 mb-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Allow location access for better ride experience
            </p>
            <button 
              onClick={() => {
                navigator.geolocation?.getCurrentPosition(
                  (position) => {
                    setLocationAllowed(true)
                    setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
                  }
                )
              }}
              className="mt-2 text-sm text-amber-600 font-medium"
            >
              Enable Location
            </button>
          </div>
        )}

        {/* Where to? */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <input
              type="text"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800"
              placeholder="Where to? Pickup location"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <input
              type="text"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800"
              placeholder="Dropoff location"
            />
          </div>
        </div>

        {/* Ride Types */}
        <h2 className="text-lg font-bold mb-4">Rides - Let's get moving</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {rideTypes.map(type => {
            const Icon = type.icon
            return (
              <button key={type.name} onClick={() => setRideType(type.name)}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  rideType === type.name 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                    : 'bg-white dark:bg-neutral-900'
                }`}>
                <Icon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-bold text-sm">{type.name}</p>
                <p className="text-xs text-muted-foreground">{type.desc}</p>
                <p className="text-xs font-bold text-green-600 mt-1">{type.price}</p>
                <p className="text-xs text-muted-foreground">{type.time}</p>
              </button>
            )
          })}
        </div>

        {/* Request Button */}
        <button onClick={handleRequest} disabled={requesting || !pickup || !dropoff}
          className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {requesting ? 'Finding driver...' : 'Request Ride'}
        </button>

        {/* Success */}
        {requested && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 text-center max-w-sm mx-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <Bike className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ride Requested!</h3>
              <p className="text-muted-foreground mb-4">Finding nearby {rideType} driver...</p>
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          <Link href="/ride/schedule" className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-xs font-medium">Schedule</p>
            <p className="text-xs text-muted-foreground">Book ahead</p>
          </Link>
          <Link href="/ride/food" className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <Package className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <p className="text-xs font-medium">Food</p>
            <p className="text-xs text-muted-foreground">Quick delivery</p>
          </Link>
          <Link href="/ride/send" className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <Navigation className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-xs font-medium">Send</p>
            <p className="text-xs text-muted-foreground">Send or receive</p>
          </Link>
        </div>
      </main>
    </div>
  )
}