'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  MapPin, Navigation, Bike, Car, Package, User, Home,
  Clock, Shield, Star, Loader2, ChevronRight, LocateFixed,
  Sparkles, Zap, TrendingUp, Search
} from 'lucide-react'

// Nairobi key locations
const nairobiLocations = [
  'Nairobi CBD', 'Westlands', 'Kilimani', 'Kileleshwa', 'Lavington',
  'Karen', 'Runda', 'Parklands', 'Ngong Road', 'Mombasa Road',
  'Thika Road', 'Juja', 'Ruiru', 'Kasarani', 'Roysambu',
  'Githurai', 'Kahawa', 'Embakasi', 'Donholm', 'South B',
  'South C', 'Langata', 'Rongai', 'Kitengela', 'Syokimau',
  'JKIA Airport', 'Wilson Airport', 'Upper Hill', 'Hurlingham',
  'Riverside', 'Loresho', 'Kitisuru', 'Gigiri', 'UN Avenue'
]

export default function RidePage() {
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [rideType, setRideType] = useState('Boda')
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)
  const [locationAllowed, setLocationAllowed] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number, address?: string} | null>(null)
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false)
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false)
  const [aiEstimate, setAiEstimate] = useState<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    // Auto-request location on load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocationAllowed(true)
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          // Reverse geocode to get address
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`)
            if (res.ok) {
              const data = await res.json()
              setUserLocation(prev => ({ ...prev, address: data.display_name }))
              setPickup(data.display_name || 'Current Location')
            }
          } catch {}
        },
        () => {
          setLocationAllowed(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }, [])

  // AI-powered price estimation
  useEffect(() => {
    if (pickup && dropoff) {
      calculateAIEstimate()
    }
  }, [pickup, dropoff, rideType])

  const calculateAIEstimate = () => {
    const basePrice = rideType === 'Boda' ? 50 : rideType === 'Car' ? 200 : 100
    const distance = Math.random() * 10 + 1 // Simulated distance in km
    const timeMinutes = Math.round(distance * 3)
    const surgeMultiplier = 1 + Math.random() * 0.5
    const total = Math.round(basePrice * distance * surgeMultiplier)
    
    setAiEstimate({
      distance: distance.toFixed(1),
      timeMinutes,
      surgeMultiplier: surgeMultiplier.toFixed(1),
      total,
      basePrice,
    })
  }

  const rideTypes = [
    { name: 'Boda', desc: '2-wheel rides', icon: Bike, basePrice: 'KSh 50', time: '2 min' },
    { name: 'Car', desc: 'Comfortable rides', icon: Car, basePrice: 'KSh 200', time: '5 min' },
    { name: 'Delivery', desc: 'Quick delivery', icon: Package, basePrice: 'KSh 100', time: '3 min' },
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
          price: aiEstimate?.total || rideType === 'Boda' ? 50 : rideType === 'Car' ? 200 : 100,
        }),
      })

      if (res.ok) {
        setRequested(true)
        setTimeout(() => {
          setRequested(false)
        }, 5000)
      }
    } catch {} finally { setRequesting(false) }
  }

  const filteredPickupLocations = nairobiLocations.filter(loc =>
    loc.toLowerCase().includes(pickup.toLowerCase()) && pickup.length > 0
  )

  const filteredDropoffLocations = nairobiLocations.filter(loc =>
    loc.toLowerCase().includes(dropoff.toLowerCase()) && dropoff.length > 0
  )

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
            <div className="flex items-center gap-3">
              <LocateFixed className="w-6 h-6 text-amber-500" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">Allow Location Access</p>
                <p className="text-xs text-amber-600">To see rides near you in Nairobi</p>
              </div>
            </div>
            <button 
              onClick={() => {
                navigator.geolocation?.getCurrentPosition(
                  async (position) => {
                    setLocationAllowed(true)
                    setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
                    try {
                      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`)
                      if (res.ok) {
                        const data = await res.json()
                        setPickup(data.display_name || 'Current Location')
                      }
                    } catch {}
                  }
                )
              }}
              className="mt-3 w-full py-3 rounded-xl bg-amber-500 text-white font-medium">
              Allow Location
            </button>
          </div>
        )}

        {/* Map Preview (Simulated Nairobi Map) */}
        {locationAllowed && (
          <div className="relative h-48 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 mb-4 overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 21px)'
            }} />
            {/* Roads */}
            <div className="absolute top-0 left-1/4 w-1 h-full bg-white/40" />
            <div className="absolute top-1/3 left-0 w-full h-1 bg-white/40" />
            <div className="absolute top-2/3 left-0 w-full h-0.5 bg-yellow-400/50" />
            {/* User Location Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 bg-indigo-500 rounded-full animate-ping" />
              <div className="w-4 h-4 bg-indigo-500 rounded-full absolute inset-0" />
            </div>
            <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full bg-white/80 text-xs font-medium">
              📍 Nairobi, Kenya
            </div>
          </div>
        )}

        {/* Pickup */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-4">
          <div className="relative mb-3">
            <div className="absolute left-3 top-3 w-2 h-2 rounded-full bg-green-500" />
            <input
              type="text"
              value={pickup}
              onChange={(e) => { setPickup(e.target.value); setShowPickupSuggestions(true) }}
              onFocus={() => setShowPickupSuggestions(true)}
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800"
              placeholder="Where from? (Pickup)"
            />
            {showPickupSuggestions && pickup && filteredPickupLocations.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 rounded-xl border shadow-lg max-h-40 overflow-y-auto z-10">
                {filteredPickupLocations.slice(0, 8).map(loc => (
                  <button key={loc} onClick={() => { setPickup(loc); setShowPickupSuggestions(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-100 flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-green-500" /> {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <div className="absolute left-3 top-3 w-2 h-2 rounded-full bg-red-500" />
            <input
              type="text"
              value={dropoff}
              onChange={(e) => { setDropoff(e.target.value); setShowDropoffSuggestions(true) }}
              onFocus={() => setShowDropoffSuggestions(true)}
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800"
              placeholder="Where to? (Dropoff)"
            />
            {showDropoffSuggestions && dropoff && filteredDropoffLocations.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 rounded-xl border shadow-lg max-h-40 overflow-y-auto z-10">
                {filteredDropoffLocations.slice(0, 8).map(loc => (
                  <button key={loc} onClick={() => { setDropoff(loc); setShowDropoffSuggestions(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-100 flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-red-500" /> {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ride Types */}
        <h2 className="text-lg font-bold mb-4">Rides - Let's get moving</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {rideTypes.map(type => {
            const Icon = type.icon
            return (
              <button key={type.name} onClick={() => setRideType(type.name)}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  rideType === type.name 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' 
                    : 'bg-white dark:bg-neutral-900'
                }`}>
                <Icon className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                <p className="font-bold text-sm">{type.name}</p>
                <p className="text-xs text-muted-foreground">{type.desc}</p>
                <p className="text-xs font-bold text-green-600 mt-1">{type.basePrice}</p>
                <p className="text-xs text-muted-foreground">{type.time}</p>
              </button>
            )
          })}
        </div>

        {/* AI Estimate */}
        {aiEstimate && pickup && dropoff && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-2xl p-4 mb-4">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" /> AI Smart Estimate
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="font-bold">{aiEstimate.distance} km</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-bold">{aiEstimate.timeMinutes} min</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Surge</p>
                <p className="font-bold">{aiEstimate.surgeMultiplier}x</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Est. Price</p>
                <p className="font-bold text-green-600">KSh {aiEstimate.total}</p>
              </div>
            </div>
          </div>
        )}

        {/* Request Button */}
        <button onClick={handleRequest} disabled={requesting || !pickup || !dropoff}
          className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 mb-6">
          {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {requesting ? 'Finding driver...' : 'Request Ride'}
        </button>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/ride/schedule" className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-xs font-medium">Schedule</p>
          </Link>
          <Link href="/ride/food" className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <Package className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <p className="text-xs font-medium">Food</p>
          </Link>
          <Link href="/ride/send" className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <Navigation className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-xs font-medium">Send</p>
          </Link>
        </div>
      </main>
    </div>
  )
}