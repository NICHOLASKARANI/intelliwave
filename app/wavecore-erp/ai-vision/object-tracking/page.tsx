'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Camera, Loader2, Crosshair, Navigation, History, Target, Route, Truck, Package } from 'lucide-react'

interface TrackedObject {
  id: string
  objectType: string
  coordinates: { x: number; y: number }
  speed: number
  direction: string
  confidence: number
  timestamp: string
}

interface RoutePoint {
  x: number
  y: number
  timestamp: string
}

export default function ObjectTrackingPage() {
  const [cameraActive, setCameraActive] = useState(false)
  const [tracking, setTracking] = useState(false)
  const [objects, setObjects] = useState<TrackedObject[]>([])
  const [route, setRoute] = useState<RoutePoint[]>([])
  const [selectedObject, setSelectedObject] = useState<TrackedObject | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 640, height: 480 } 
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraActive(true)
    } catch {}
  }

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
    setCameraActive(false)
    setTracking(false)
  }

  const startTracking = async () => {
    setTracking(true)
    // Simulate real-time tracking
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/wavecore/ai-vision/object-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frame: 'tracking-frame' })
        })
        const data = await res.json()
        if (data.success) {
          setObjects(prev => [data.object, ...prev].slice(0, 10))
          setRoute(prev => [...prev, { 
            x: data.object.coordinates.x, 
            y: data.object.coordinates.y,
            timestamp: new Date().toISOString() 
          }].slice(0, 100))
        }
      } catch {}
    }, 2000)

    // Store interval to stop later
    if (streamRef.current) {
      (streamRef.current as any).trackingInterval = interval
    }
  }

  const stopTracking = () => {
    setTracking(false)
    if (streamRef.current) {
      const interval = (streamRef.current as any).trackingInterval
      if (interval) clearInterval(interval)
    }
  }

  const objectIcon = (type: string) => {
    if (type.includes('Vehicle') || type.includes('Car')) return Truck
    if (type.includes('Person') || type.includes('Human')) return Navigation
    return Package
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Object Tracking</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Crosshair className="w-6 h-6 text-blue-500" /> Object Tracking & Route Mapping
        </h1>

        {/* Camera */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <video ref={videoRef} autoPlay playsInline className="hidden" />
          <canvas ref={canvasRef} className="hidden" />
          
          {!cameraActive ? (
            <div className="text-center py-12">
              <Crosshair className="w-16 h-16 mx-auto mb-4 text-blue-500 opacity-30" />
              <button onClick={startCamera}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2 mx-auto">
                <Camera className="w-5 h-5" /> Start Camera
              </button>
            </div>
          ) : (
            <div className="flex gap-3 justify-center flex-wrap">
              {!tracking ? (
                <button onClick={startTracking}
                  className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2">
                  <Target className="w-5 h-5" /> Start Tracking
                </button>
              ) : (
                <button onClick={stopTracking}
                  className="px-6 py-3 rounded-xl bg-yellow-600 text-white font-bold flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Stop Tracking
                </button>
              )}
              <button onClick={stopCamera} className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold">Stop Camera</button>
            </div>
          )}
        </div>

        {/* Route Map Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Route Map */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Route className="w-5 h-5 text-purple-500" /> Route Map
            </h2>
            <div className="relative h-64 bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden">
              {route.map((point, i) => (
                <div key={i} 
                  className="absolute w-2 h-2 rounded-full bg-blue-500"
                  style={{ 
                    left: `${point.x * 100}%`, 
                    top: `${point.y * 100}%`,
                    opacity: i / route.length
                  }} />
              ))}
              {route.length === 0 && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <MapPin className="w-8 h-8 opacity-30" />
                </div>
              )}
              {/* Current position */}
              {route.length > 0 && (
                <div 
                  className="absolute w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-ping"
                  style={{ 
                    left: `${route[0].x * 100}%`, 
                    top: `${route[0].y * 100}%` 
                  }} />
              )}
            </div>
          </div>

          {/* Tracked Objects */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" /> Tracked Objects ({objects.length})
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {objects.map((obj, i) => {
                const Icon = objectIcon(obj.objectType)
                return (
                  <div key={i} 
                    onClick={() => setSelectedObject(obj)}
                    className={`p-3 rounded-xl cursor-pointer transition-colors ${selectedObject?.id === obj.id ? 'bg-blue-50 border border-blue-200' : 'bg-neutral-50 dark:bg-neutral-800'}`}>
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-bold text-sm">{obj.objectType}</p>
                        <p className="text-xs text-muted-foreground">
                          Speed: {obj.speed.toFixed(1)} m/s | {obj.direction}
                        </p>
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {(obj.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )
              })}
              {objects.length === 0 && (
                <p className="text-muted-foreground">No objects tracked yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Selected Object Details */}
        {selectedObject && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <h2 className="font-bold text-lg mb-4">Object Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-bold">{selectedObject.objectType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Speed</p>
                <p className="font-bold">{selectedObject.speed.toFixed(1)} m/s</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Direction</p>
                <p className="font-bold">{selectedObject.direction}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="font-bold">{(selectedObject.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}