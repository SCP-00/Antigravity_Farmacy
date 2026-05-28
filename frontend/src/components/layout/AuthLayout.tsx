import { Outlet, Link } from 'react-router-dom'
import { useUiStore } from '@/store/uiStore'
import ThemeToggle from '@/components/shared/ThemeToggle'

/**
 * Layout de autenticación con diseño centrado, fondo degradado,
 * logo de Farmacy y tarjeta de contenido.
 * Usado para login, registro, recuperación de contraseña, etc.
 *
 * @example
 * ```tsx
 * <Route element={<AuthLayout />}>
 *   <Route path="/login" element={<LoginAdmin />} />
 *   <Route path="/admin/login" element={<LoginAdmin />} />
 * </Route>
 * ```
 */
export default function AuthLayout() {
  const { darkMode } = useUiStore()

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300
      ${darkMode
        ? 'bg-dark-bg'
        : 'bg-gradient-to-br from-teal-50 via-[#E8F5F0] to-blue-50'
      }`}>
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105
              ${darkMode ? 'bg-teal-600' : 'bg-teal-700'}`}>
              <span className="text-white font-bold text-3xl">F</span>
            </div>
            <span className={`font-serif text-2xl transition-colors duration-300 ${darkMode ? 'text-dark-text' : 'text-teal-900'}`}>Farmacy</span>
          </Link>
          <p className={`text-sm mt-1 ${darkMode ? 'text-dark-text-muted' : 'text-gray-500'}`}>Sistema de Gestión de Farmacias · UTP</p>
        </div>

        {/* Theme toggle flotante */}
        <div className="absolute top-4 right-4">
          <ThemeToggle compact />
        </div>

        {/* Card de autenticación */}
        <div className={`rounded-3xl shadow-lg p-8 transition-colors duration-300
          ${darkMode
            ? 'bg-dark-surface border border-dark-border'
            : 'bg-white border border-[#D8EBE4]'
          }`}>
          <Outlet />
        </div>

        <p className={`text-center text-xs mt-6 ${darkMode ? 'text-dark-text-muted' : 'text-gray-400'}`}>
          © {new Date().getFullYear()} Farmacy · Proyecto académico
        </p>
      </div>
    </div>
  )
}