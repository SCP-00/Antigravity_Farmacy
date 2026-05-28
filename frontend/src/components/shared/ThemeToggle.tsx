import { Moon, Sun } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'

/** Props para el botón de cambio de tema claro/oscuro. */
interface ThemeToggleProps {
  /** Clases CSS adicionales */
  className?: string
  /** Modo compacto sin label textual */
  compact?: boolean
}

/**
 * Botón de cambio entre tema claro y oscuro.
 * Usa `useUiStore` para el estado global del tema.
 * Soporta animación de rotación entre iconos Sun/Moon.
 */
export default function ThemeToggle({ className = '', compact = false }: ThemeToggleProps) {
  const { darkMode, toggleDarkMode } = useUiStore()

  return (
    <button
      onClick={toggleDarkMode}
      className={`relative flex items-center justify-center rounded-full
        transition-all duration-300 active:scale-90
        ${compact
          ? 'w-9 h-9 hover:bg-teal-100 dark:hover:bg-teal-800/40'
          : 'px-3 py-2 gap-2 hover:bg-teal-50 dark:hover:bg-teal-800/30'
        }
        ${className}`}
      title={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
      aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      <div className="relative w-5 h-5">
        <Sun
          size={18}
          className={`absolute inset-0 text-amber-500 transition-all duration-500
            ${darkMode ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
        />
        <Moon
          size={18}
          className={`absolute inset-0 text-teal-400 transition-all duration-500
            ${darkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
        />
      </div>
      {!compact && (
        <span className="text-sm text-gray-600 dark:text-dark-text-secondary">
          {darkMode ? 'Oscuro' : 'Claro'}
        </span>
      )}
    </button>
  )
}
