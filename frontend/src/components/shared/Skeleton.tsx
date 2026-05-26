/** Componentes reutilizables de Skeleton loaders */

interface SkeletonProps {
  className?: string
}

export function SkeletonText({ className = '' }: SkeletonProps) {
  return <div className={`h-4 bg-gray-200 dark:bg-dark-border rounded animate-pulse ${className}`} />
}

export function SkeletonBlock({ className = '' }: SkeletonProps) {
  return <div className={`bg-gray-200 dark:bg-dark-border rounded-xl animate-pulse ${className}`} />
}

export function SkeletonCard({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`card p-5 ${className}`}>
      <SkeletonBlock className="h-8 w-8 rounded-full mb-3" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonText key={i} className={i === 0 ? 'w-3/4' : 'w-full'} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex gap-4 px-5 py-3 border-b border-gray-100 dark:border-dark-border">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonText key={`h-${i}`} className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-5 py-4 border-b border-gray-50 dark:border-dark-border">
          {Array.from({ length: columns }).map((_, c) => (
            <SkeletonText key={`r${r}-c${c}`} className={`flex-1 ${c === 0 ? 'w-1/4' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart({ className = '' }: SkeletonProps) {
  return (
    <div className={`flex items-end gap-2 h-48 ${className}`}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-200 dark:bg-dark-border rounded-t-lg animate-pulse"
          style={{ height: `${30 + Math.random() * 70}%` }}
        />
      ))}
    </div>
  )
}
