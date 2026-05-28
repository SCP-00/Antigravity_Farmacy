// ══════════════════════════════════════════════════════════
//  hooks/index.ts — Custom hooks reutilizables
// ══════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuthStore, useAuthClienteStore } from '@/store/authStore'
import { useCarritoStore }  from '@/store/carritoStore'
import { authService, authClienteService, productosService, chatbotService } from '@/services'
import { RUTA_POR_ROL, type RolEmpleado } from '@/config/constants'

/**
 * Hook para debounce genérico con delay configurable (default 400ms).
 * Útil para búsquedas, inputs que requieren esperar antes de disparar una acción.
 *
 * @example
 * ```tsx
 * const debouncedValue = useDebounce(searchTerm, 500)
 * ```
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

/**
 * Hook de autenticación para empleados (admin/farmaceuta/auxiliar).
 * Envuelve `useAuthStore` + react-query mutation con toast de feedback.
 * Redirige según el rol del empleado al hacer login.
 *
 * @returns `{ empleado, token, estaLogueado, tieneRol, login, loginLoading, logout }`
 */
export function useAuth() {
  const store    = useAuthStore()
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),

    onSuccess: (data) => {
      store.setLogin(data.token, data.refreshToken, data.empleado)
      toast.success(`¡Bienvenido, ${data.empleado.nombre}!`)
      navigate(RUTA_POR_ROL[data.empleado.rol as RolEmpleado] ?? '/admin')
    },

    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Credenciales inválidas')
    },
  })

  const logout = useCallback(async () => {
    try { await authService.logout() } catch { /* silencioso */ }
    store.cerrarSesion()
  }, [store])

  return {
    empleado:     store.empleado,
    token:        store.token,
    estaLogueado: store.estaLogueado(),
    tieneRol:     store.tieneRol,
    login:        loginMutation.mutate,
    loginLoading: loginMutation.isPending,
    logout,
  }
}

/**
 * Hook de autenticación para clientes (tienda web público).
 * Incluye login y registro con feedback visual mediante toast.
 * Invalida la query de carrito al iniciar sesión.
 *
 * @returns `{ cliente, estaLogueado, login, registro, cerrarSesion, googleUrl }`
 */
export function useAuthCliente() {
  const store    = useAuthClienteStore()
  const navigate = useNavigate()
  const qc       = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authClienteService.login(email, password),

    onSuccess: (data) => {
      store.setLogin(data.token, data.cliente)
      qc.invalidateQueries({ queryKey: ['carrito'] })
      toast.success(`¡Bienvenido, ${data.cliente.nombre}!`)
      navigate('/')
    },

    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Credenciales inválidas')
    },
  })

  const registroMutation = useMutation({
    mutationFn: authClienteService.registro,
    onSuccess: () => {
      toast.success('¡Cuenta creada! Revisa tu email para verificarla.')
      navigate('/login')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Error al registrarse')
    },
  })

  return {
    cliente:          store.cliente,
    estaLogueado:     store.estaLogueado(),
    login:            loginMutation.mutate,
    loginLoading:     loginMutation.isPending,
    registro:         registroMutation.mutate,
    registroLoading:  registroMutation.isPending,
    cerrarSesion:     store.cerrarSesion,
    googleUrl: authClienteService.googleUrl(),
  }
}

/**
 * Hook que expone permisos booleanos según el rol del empleado autenticado.
 * Facilita el renderizado condicional de módulos en la UI.
 *
 * @returns `{ puedeVerCaja, puedeVerInventario, puedeVerCompras, …, esAdmin, esFarmaceuta, esAuxiliar }`
 */
export function usePermisos() {
  const { tieneRol } = useAuthStore()
  return {
    puedeVerCaja:        tieneRol('ADMINISTRADOR', 'FARMACEUTA'),
    puedeVerInventario:  tieneRol('ADMINISTRADOR', 'AUXILIAR'),
    puedeVerCompras:     tieneRol('ADMINISTRADOR', 'AUXILIAR'),
    puedeVerClientes:    tieneRol('ADMINISTRADOR', 'FARMACEUTA'),
    puedeVerEmpleados:   tieneRol('ADMINISTRADOR'),
    puedeVerReportes:    tieneRol('ADMINISTRADOR'),
    puedeVerConfig:      tieneRol('ADMINISTRADOR'),
    esAdmin:             tieneRol('ADMINISTRADOR'),
    esFarmaceuta:        tieneRol('FARMACEUTA'),
    esAuxiliar:          tieneRol('AUXILIAR'),
  }
}

/**
 * Búsqueda de productos con debounce (400ms) para el catálogo público.
 * Cachea resultados con `placeholderData` para evitar flickers.
 *
 * @param params.q - Texto de búsqueda
 * @param params.categoria - Filtrar por categoría
 * @param params.marca - Filtrar por marca
 * @param params.rx - Solo recetados (true) o solo OTC (false)
 * @param params.precioMin - Precio mínimo
 * @param params.precioMax - Precio máximo
 * @param params.envio - Solo productos con envío disponible
 * @param params.tienda - Solo productos en tienda física
 * @param params.ordenar - Criterio de ordenamiento
 * @param params.pagina - Número de página
 * @param params.limite - Resultados por página
 */
export function useProductosBusqueda(params: {
  q?: string; categoria?: string; marca?: string; rx?: boolean; precioMin?: number; precioMax?: number; envio?: boolean; tienda?: boolean; ordenar?: string; pagina?: number; limite?: number
}) {
  const debouncedQ = useDebounce(params.q ?? '', 400)

  return useQuery({
    queryKey: ['productos', 'buscar', { ...params, q: debouncedQ }],
    queryFn:  () => productosService.buscar({ ...params, q: debouncedQ }),
    placeholderData: (prev) => prev,
  })
}

/**
 * Categorías de productos con staleTime de 30 minutos.
 * Las categorías cambian poco, por lo que se cachean agresivamente.
 */
export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn:  () => import('@/services').then((m) => m.categoriasService.listar()),
    staleTime: 1000 * 60 * 30,  // 30 minutos — las categorías no cambian seguido
  })
}

/**
 * Hook del carrito de compras con toast de confirmación al agregar.
 * Envuelve `useCarritoStore` y agrega feedback visual.
 *
 * @example
 * ```tsx
 * const { items, total, agregar, limpiar } = useCarrito()
 * ```
 */
export function useCarrito() {
  const store = useCarritoStore()
  const { estaLogueado } = useAuthClienteStore()

  const agregar = useCallback((item: Parameters<typeof store.agregar>[0]) => {
    store.agregar(item)
    toast.success(`${item.nombre} agregado al carrito`, { icon: '🛒' })
  }, [store])

  return {
    items:           store.items,
    totalItems:      store.totalItems(),
    subtotal:        store.subtotal(),
    total:           store.total(),
    tieneRx:         store.tieneRx(),
    requiereLogin:   !estaLogueado && store.items.length > 0,
    agregar,
    quitar:          store.quitar,
    cambiarCantidad: store.cambiarCantidad,
    limpiar:         store.limpiar,
  }
}

/** Producto sugerido por el chatbot con información clave para el usuario. */
export interface ProductoChatbot {
  id: string
  nombre: string
  concentracion?: string
  presentacion?: string
  laboratorio?: string
  precioVenta: number
  requiereRx: boolean
  principioActivo?: string
  stockTotal: number
}

/** Alerta de seguridad/interacción farmacológica generada por el chatbot. */
export interface AlertaChatbot {
  tipo: string
  productoA: string
  productoB?: string
  descripcion: string
  severidad: string
}

/**
 * Mensaje individual del chat (usuario o bot).
 * Puede incluir productos y alertas de seguridad embebidas.
 */
export interface MensajeChat {
  role: 'user' | 'bot'
  texto: string
  productos?: ProductoChatbot[]
  alertas?: AlertaChatbot[]
  alertasVisibles?: boolean
  menuActivo?: string
}

/**
 * useChatbot — hook principal del chatbot.
 * Envía mensajes vía HTTP REST por defecto.
 * Si `useWS` está disponible, puede usar WebSocket para menor latencia.
 */
export function useChatbot(transport: 'http' | 'ws' = 'http') {
  const [mensajes,     setMensajes]     = useState<MensajeChat[]>([])
  const [escribiendo,  setEscribiendo]  = useState(false)
  const [sessionToken, _setSessionToken] = useState(() =>
    `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )

  const wsRef = useRef<WebSocket | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const wsReconnectAttempts = useRef(0)
  const wsReconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Conectar WebSocket con reconexión exponencial
  useEffect(() => {
    if (transport !== 'ws') return

    const conectarWS = () => {
      const token = useAuthStore.getState().token
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || ''
      const wsUrl = (baseUrl.startsWith('https') ? baseUrl.replace('https', 'wss') : baseUrl.replace('http', 'ws')) || 'ws://localhost:3000'
      const url = `${wsUrl}/ws?token=${token || ''}`

      const ws = new WebSocket(url)
      ws.onopen = () => {
        setWsConnected(true)
        wsReconnectAttempts.current = 0
      }
      ws.onclose = () => {
        setWsConnected(false)
        // Reconexión exponencial: 1s → 30s max, hasta 20 intentos
        if (wsReconnectAttempts.current < 20) {
          const delay = Math.min(1000 * Math.pow(2, wsReconnectAttempts.current), 30000)
          wsReconnectAttempts.current++
          wsReconnectTimer.current = setTimeout(conectarWS, delay)
        }
      }
      ws.onerror = () => { ws.close() }
      wsRef.current = ws
    }

    conectarWS()

    return () => {
      setWsConnected(false)
      if (wsReconnectTimer.current) clearTimeout(wsReconnectTimer.current)
      wsRef.current?.close()
    }
  }, [transport])

  const enviar = useCallback(async (texto: string) => {
    if (!texto.trim()) return

    setMensajes(prev => [...prev, { role: 'user', texto }])
    setEscribiendo(true)

    try {
      // Intentar WebSocket si está conectado
      if (transport === 'ws' && wsRef.current?.readyState === WebSocket.OPEN) {
        const response = await new Promise<{
          respuesta: string; productos?: ProductoChatbot[]
          alertas?: AlertaChatbot[]; menuActivo?: string
        }>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout WS')), 15000)
          const handler = (e: MessageEvent) => {
            try {
              const msg = JSON.parse(e.data)
              if (msg.event === 'chatbot:respuesta') {
                clearTimeout(timeout)
                wsRef.current?.removeEventListener('message', handler)
                resolve(msg.data)
              } else if (msg.event === 'chatbot:error') {
                clearTimeout(timeout)
                wsRef.current?.removeEventListener('message', handler)
                reject(new Error(msg.data?.mensaje || 'Error WS'))
              }
            } catch { /* ignorar */ }
          }
          wsRef.current?.addEventListener('message', handler)
          wsRef.current?.send(JSON.stringify({
            type: 'CHATBOT',
            mensaje: texto,
            sessionToken,
          }))
        })

        setMensajes(prev => [...prev, {
          role: 'bot',
          texto: response.respuesta,
          productos: response.productos ?? [],
          alertas: response.alertas ?? [],
          menuActivo: response.menuActivo ?? 'menu',
        }])
      } else {
        // Fallback a HTTP
        const res = await chatbotService.enviarMensaje(texto, sessionToken)
        setMensajes(prev => [...prev, {
          role: 'bot',
          texto: res.respuesta,
          productos: res.productos ?? [],
          alertas: res.alertas ?? [],
          alertasVisibles: res.alertasVisibles ?? false,
          menuActivo: res.menuActivo ?? 'menu',
        }])
      }
    } catch {
      setMensajes(prev => [...prev, {
        role: 'bot',
        texto: 'Lo siento, tuve un problema. Intenta de nuevo.',
      }])
    } finally {
      setEscribiendo(false)
    }
  }, [sessionToken, transport])

  return { mensajes, escribiendo, enviar, sessionToken, wsConnected }
}

/**
 * Helpers de formateo para display: moneda COP, fechas y horas.
 *
 * @example
 * ```tsx
 * const { cop, fecha, fechaCorta, fechaHora } = useFormateo()
 * cop(15000) // → "$15.000"
 * fecha(new Date()) // → "28 de mayo de 2026"
 * ```
 */
export function useFormateo() {
  const cop = (n: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(n)

  const fecha = (d: string | Date) =>
    new Date(d).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

  const fechaCorta = (d: string | Date) =>
    new Date(d).toLocaleDateString('es-CO')

  const fechaHora = (d: string | Date) =>
    new Date(d).toLocaleDateString('es-CO', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })

  return { cop, fecha, fechaCorta, fechaHora }
}

/**
 * Hook para leer/escribir valores en localStorage con tipo genérico.
 * Similar a `useState` pero persiste en localStorage.
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch { return defaultValue }
  })

  const set = useCallback((v: T) => {
    setValue(v)
    localStorage.setItem(key, JSON.stringify(v))
  }, [key])

  return [value, set] as const
}

export * from './useScanner'
export { usePWAInstall } from './usePWAInstall'
export type { PWAInstallAnalytics } from './usePWAInstall'
export { usePushNotifications } from './usePushNotifications'
export type { PushState } from './usePushNotifications'
export { useSSE, useWS } from './useRealtime'
export type { SSEEvent, WSEvent } from './useRealtime'