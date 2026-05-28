import { LucideIcon } from 'lucide-react'

/**
 * Estado vacío con icono, título, descripción y acción opcional.
 * Usado en listas sin datos, búsquedas sin resultados, etc.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Package}
 *   title="No hay productos"
 *   description="Agrega productos al catálogo para empezar"
 *   action={{ label: "Agregar", onClick: () => {} }}
 * />
 * ```
 */
interface EmptyStateProps {
  icon: LucideIcon
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  compact?: boolean
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, compact, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${compact ? 'py-8' : 'py-16'} text-center ${className}`}>
      <Icon size={compact ? 32 : 48} className="text-gray-200 dark:text-dark-border mb-4" />
      {title && (
        <p className="text-sm font-medium text-gray-500 dark:text-dark-text/60 mb-1">{title}</p>
      )}
      {description && (
        <p className="text-xs text-gray-400 dark:text-dark-text/40 max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
