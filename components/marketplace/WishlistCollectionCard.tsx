'use client'

import Link from 'next/link'
import { Lock, Globe, Heart } from 'lucide-react'

interface WishlistCollectionCardProps {
  collection: {
    id: string
    name: string
    description?: string | null
    slug: string
    isPublic: boolean
    coverImage?: string | null
    itemCount: number
  }
  onClick?: () => void
}

export default function WishlistCollectionCard({ collection, onClick }: WishlistCollectionCardProps) {
  const inner = (
    <div className="rounded-2xl border bg-white dark:bg-neutral-900 overflow-hidden hover:shadow-lg transition-all group cursor-pointer">
      <div className="h-32 bg-gradient-to-br from-pink-500/20 to-purple-500/20 relative">
        {collection.coverImage ? (
          <img src={collection.coverImage} alt={collection.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Heart className="w-10 h-10 text-pink-500 opacity-50" />
          </div>
        )}
        {collection.isPublic && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center gap-1">
            <Globe className="w-2.5 h-2.5" /> Public
          </span>
        )}
        {!collection.isPublic && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-neutral-800 text-white text-[10px] font-bold flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" /> Private
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-bold text-sm">{collection.name}</p>
        {collection.description && <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{collection.description}</p>}
        <p className="text-xs text-neutral-500 mt-2">{collection.itemCount} item{collection.itemCount !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )

  if (onClick) {
    return <div onClick={onClick}>{inner}</div>
  }
  return <Link href={`/marketplace/saved?collection=${collection.id}`}>{inner}</Link>
}