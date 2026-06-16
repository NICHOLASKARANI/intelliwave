export function LoadingSkeleton({ type = 'card' }: { type?: 'card' | 'text' | 'page' }) {
  if (type === 'page') {
    return (
      <div className="py-20 container animate-pulse">
        <div className="h-10 w-64 bg-muted rounded-lg mb-6" />
        <div className="h-6 w-96 bg-muted rounded-lg mb-12" />
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (type === 'text') {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-5/6" />
      </div>
    )
  }

  return (
    <div className="animate-pulse p-6 rounded-2xl border">
      <div className="w-14 h-14 bg-muted rounded-xl mb-4" />
      <div className="h-6 bg-muted rounded w-3/4 mb-2" />
      <div className="h-4 bg-muted rounded w-full mb-1" />
      <div className="h-4 bg-muted rounded w-2/3" />
    </div>
  )
}