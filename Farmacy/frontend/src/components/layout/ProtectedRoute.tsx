// ══════════════════════════════════════════════════════════
//  components/layout/ProtectedRoute.tsx
// ══════════════════════════════════════════════════════════
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, useAuthClienteStore } from '@/store/authStore'

interface Props {
  tipo:   'empleado' | 'cliente'
  roles?: string[]   // Si se especifica, filtra por roles específicos
}

export default function ProtectedRoute({ tipo, roles }: Props) {
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