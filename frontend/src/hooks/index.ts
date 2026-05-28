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

// ── useDebounce ───────────────────────────────────────────
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// ── useAuth (empleados) ───────────────────────────────────
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

// ── useAuthCliente (tienda web) ───────────────────────────
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

// ── usePermisos ───────────────────────────────────────────
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

// ── useProductos (tienda pública) ─────────────────────────
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

// ── useCategorias ─────────────────────────────────────────
export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn:  () => import('@/services').then((m) => m.categoriasService.listar()),
    staleTime: 1000 * 60 * 30,  // 30 minutos — las categorías no cambian seguido
  })
}

// ── useCarrito ────────────────────────────────────────────
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

// ── useChatbot ────────────────────────────────────────────
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

export interface AlertaChatbot {
  tipo: string
  productoA: string
  productoB?: string
  descripcion: string
  severidad: string
}

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

// ── useFormateo — helpers de display ─────────────────────
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

// ── useLocalStorage ───────────────────────────────────────
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
export { useSSE, useWS } from './useRealtime'
export type { SSEEvent, WSEvent } from './useRealtime'