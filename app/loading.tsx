export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}