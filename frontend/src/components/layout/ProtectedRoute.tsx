// ══════════════════════════════════════════════════════════
//  components/layout/ProtectedRoute.tsx
// ══════════════════════════════════════════════════════════
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, useAuthClienteStore } from '@/store/authStore'

/**
 * Props del componente de ruta protegida.
 */
interface ProtectedRouteProps {
  /** Tipo de usuario: empleado (admin) o cliente (B2C) */
  tipo: 'empleado' | 'cliente'
  /** Roles permitidos para empleados (opcional, filtra si se especifica) */
  roles?: string[]
}

/**
 * Ruta protegida que redirige al login si el usuario no está autenticado.
 * Para empleados, puede filtrar por roles específicos.
 *
 * @example
 * ```tsx
 * <Route element={<ProtectedRoute tipo="empleado" roles={['ADMINISTRADOR']} />}>
 *   <Route path="/admin/config" element={<ConfigPage />} />
 * </Route>
 *
 * <Route element={<ProtectedRoute tipo="cliente" />}>
 *   <Route path="/cuenta" element={<MiCuenta />} />
 * </Route>
 * ```
 */
export default function ProtectedRoute({ tipo, roles }: ProtectedRouteProps) {
  const empleadoStore = useAuthStore()
  const clienteStore  = useAuthClienteStore()

  if (tipo === 'cliente') {
    if (!clienteStore.estaLogueado()) {
      return <Navigate to="/login" replace />
    }
    return <Outlet />
  }

  // tipo === 'empleado'
  if (!empleadoStore.estaLogueado()) {
    return <Navigate to="/admin/login" replace />
  }

  if (roles && roles.length > 0 && !empleadoStore.tieneRol(...roles)) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}