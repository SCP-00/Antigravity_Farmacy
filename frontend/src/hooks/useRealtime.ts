// ══════════════════════════════════════════════════════════
//  hooks/useRealtime.ts — Hooks para SSE + WebSocket
//  useSSE:    Conexión SSE para dashboard en vivo (usa fetch
//            + ReadableStream para poder enviar headers JWT)
//  useWS:     Conexión WebSocket para eventos POS
// ══════════════════════════════════════════════════════════
import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuthStore } from '@/store/authStore'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

// ── useSSE — Dashboard en vivo (fetch-based SSE) ──────────
/**
 * Evento SSE recibido desde el servidor.
 * Contiene el tipo de evento, los datos y el timestamp del servidor.
 */
export interface SSEEvent {
  tipo: string
  data: Record<string, unknown>
  timestamp: string
}

/** Opciones para configurar la conexión SSE. */
interface UseSSEOptions {
  /** Lista de tipos de eventos a filtrar */
  eventos?: string[]
  /** Callback por cada evento recibido */
  onEvent?: (event: SSEEvent) => void
  /** Callback cuando la conexión se establece */
  onConnected?: () => void
  /** Habilitar/deshabilitar la conexión */
  enabled?: boolean
}

/**
 * Hook para conexión SSE (Server-Sent Events) para dashboard en vivo.
 * Usa `fetch` + `ReadableStream` para poder enviar headers JWT.
 * Incluye reconexión exponencial (hasta 20 intentos, max 30s).
 *
 * @example
 * ```tsx
 * const { conectado, ultimoEvento } = useSSE({
 *   eventos: ['nueva-venta', 'stock-critico'],
 *   onEvent: (ev) => console.log('Evento:', ev),
 * })
 * ```
 */
export function useSSE(options: UseSSEOptions = {}) {
  const { eventos, onEvent, onConnected, enabled = true } = options
  const { token } = useAuthStore()
  const [conectado, setConectado] = useState(false)
  const [ultimoEvento, setUltimoEvento] = useState<SSEEvent | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef<number>(0)
  const maxReconnectAttempts = 20

  const conectar = useCallback(async () => {
    if (!token || !enabled) return

    // Cancelar conexión anterior
    abortRef.current?.abort()

    const params = new URLSearchParams()
    if (eventos && eventos.length > 0) {
      params.set('eventos', eventos.join(','))
    }
    const url = `${API_URL}/reportes/stream?${params.toString()}`

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        signal: abort.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`SSE connection failed: ${response.status}`)
      }

      setConectado(true)
      reconnectAttempts.current = 0
      onConnected?.()

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parsear SSE frames
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''  // Último fragmento puede estar incompleto

        let currentEvent = ''
        let currentData = ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6).trim()
          } else if (line === '' && currentData) {
            // Fin del frame SSE
            if (currentEvent === 'connected') {
              // Evento de conexión inicial
              onConnected?.()
            } else if (currentEvent && currentEvent !== 'heartbeat') {
              try {
                const payload: SSEEvent = JSON.parse(currentData)
                setUltimoEvento(payload)
                onEvent?.(payload)
              } catch { /* ignorar parse error */ }
            }
            currentEvent = ''
            currentData = ''
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      setConectado(false)
    }

    // Reconexión exponencial (si no fue abortado)
    if (!abort.signal.aborted && reconnectAttempts.current < maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
      reconnectAttempts.current++
      reconnectTimer.current = setTimeout(conectar, delay)
    }
  }, [token, eventos, enabled, onEvent, onConnected])

  useEffect(() => {
    conectar()
    return () => {
      abortRef.current?.abort()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [conectar])

  return { conectado, ultimoEvento }
}

// ── useWS — WebSocket para POS ─────────────────────────────
/**
 * Evento WebSocket recibido desde el servidor.
 */
export interface WSEvent {
  event: string
  data: Record<string, unknown>
  timestamp: string
}

/** Opciones para configurar la conexión WebSocket. */
interface UseWSOptions {
  /** Callback por cada evento recibido */
  onEvent?: (event: WSEvent) => void
  /** Callback cuando la conexión se establece */
  onConnected?: () => void
  /** Habilitar/deshabilitar la conexión */
  enabled?: boolean
}

/**
 * Hook para conexión WebSocket para eventos POS en tiempo real.
 * Incluye heartbeat cada 30s, reconexión exponencial (hasta 20 intentos, max 30s),
 * y función `enviar()` para enviar mensajes al servidor.
 *
 * @example
 * ```tsx
 * const { conectado, enviar } = useWS({
 *   onEvent: (ev) => {
 *     if (ev.event === 'nueva-venta') mostrarNotificacion(ev.data)
 *   },
 * })
 * ```
 */
export function useWS(options: UseWSOptions = {}) {
  const { onEvent, onConnected, enabled = true } = options
  const { token } = useAuthStore()
  const [conectado, setConectado] = useState(false)
  const [ultimoEvento, setUltimoEvento] = useState<WSEvent | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef<number>(0)
  const maxReconnectAttempts = 20
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const conectar = useCallback(() => {
    if (!token || !enabled) return

    if (wsRef.current) {
      wsRef.current.close()
    }

    // Convertir API_URL base a ws://
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || ''
    const wsUrl = (baseUrl.startsWith('https') ? baseUrl.replace('https', 'wss') : baseUrl.replace('http', 'ws')) || 'ws://localhost:3000'
    const url = `${wsUrl}/ws?token=${token}`

    const ws = new WebSocket(url)

    ws.onopen = () => {
      setConectado(true)
      reconnectAttempts.current = 0
      onConnected?.()

      // Heartbeat cada 30s
      heartbeatTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }))
        }
      }, 30000)
    }

    ws.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data)
        setUltimoEvento(event)
        onEvent?.(event)
      } catch { /* ignorar */ }
    }

    ws.onclose = () => {
      setConectado(false)
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current)

      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        reconnectAttempts.current++
        reconnectTimer.current = setTimeout(conectar, delay)
      }
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [token, enabled, onEvent, onConnected])

  useEffect(() => {
    conectar()
    return () => {
      if (wsRef.current) wsRef.current.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current)
    }
  }, [conectar])

  const enviar = useCallback((type: string, channel?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, channel }))
    }
  }, [])

  return { conectado, ultimoEvento, enviar }
}
