'use client'

import { useEffect, useRef, useState } from 'react'

interface VideoBackgroundProps {
  src?: string
  fallbackColor?: string
  overlayOpacity?: number
  children?: React.ReactNode
}

export function VideoBackground({ 
  src = '/videos/ai-background.mp4',
  fallbackColor = 'from-gray-900 via-blue-950 to-black',
  overlayOpacity = 0.7,
  children 
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoaded = () => setIsLoaded(true)
    const handleError = () => setHasError(true)

    video.addEventListener('loadeddata', handleLoaded)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadeddata', handleLoaded)
      video.removeEventListener('error', handleError)
    }
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Video or Fallback */}
      {!hasError && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}

      {/* Gradient Fallback */}
      <div className={`absolute inset-0 bg-gradient-to-br ${fallbackColor}`} />

      {/* Animated Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 150, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 150, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          animation: 'gridMove 20s linear infinite',
        }}
      />

      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }
      `}</style>
    </div>
  )
}