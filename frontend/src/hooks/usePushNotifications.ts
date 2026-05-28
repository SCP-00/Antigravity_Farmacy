// ══════════════════════════════════════════════════════════
//  hooks/usePushNotifications.ts — Push subscription manager
//  - Solicitar permiso de notificaciones
//  - Suscribir/desuscribir al empleado logueado
//  - Auto-suscripción al login
// ══════════════════════════════════════════════════════════
import { useState, useCallback, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { api } from '@/config/api'
import { useAuthStore } from '@/store/authStore'

const PUBLIC_VAPID_KEY_CACHE = 'farmacy-vapid-public-key'

/** Obtener la clave pública VAPID desde el backend (con cache) */
async function getVapidPublicKey(): Promise<string | null> {
  // Intentar cache local primero
  const cached = localStorage.getItem(PUBLIC_VAPID_KEY_CACHE)
  if (cached) return cached

  try {
    const { data } = await api.get('/push/vapid-public-key')
    const key = data?.data?.publicKey
    if (key) {
      localStorage.setItem(PUBLIC_VAPID_KEY_CACHE, key)
      return key
    }
  } catch { /* push no configurado */ }
  return null
}

/** Convertir clave pública VAPID (base64 url-safe) a Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export interface PushState {
  /** ¿El browser soporta Push API? */
  supported: boolean
  /** ¿El usuario ya dió permiso? */
  permission: NotificationPermission | 'unsupported'
  /** ¿Está el empleado suscrito actualmente? */
  subscribed: boolean
  /** ¿Está en proceso de (des)suscripción? */
  loading: boolean
  /** Suscribir al empleado actual */
  subscribe: () => Promise<void>
  /** Desuscribir al empleado actual */
  unsubscribe: () => Promise<void>
}

export function usePushNotifications(): PushState {
  const { token, empleado } = useAuthStore()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supported] = useState(() => 'serviceWorker' in navigator && 'PushManager' in window)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (!supported) return 'unsupported'
    return Notification.permission
  })
  const swRegistration = useRef<ServiceWorkerRegistration | null>(null)

  // Detectar cambios de permiso en tiempo real
  useEffect(() => {
    if (!supported) return

    const handlePermissionChange = () => {
      setPermission(Notification.permission)
    }

    // Safari soporta? No, pero Chrome/Firefox sí
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'notifications' }).then((status) => {
        status.onchange = handlePermissionChange
      }).catch(() => {})
    }
  }, [supported])

  // Obtener el Service Worker registration
  useEffect(() => {
    if (!supported || !token) return

    navigator.serviceWorker.ready
      .then((reg) => {
        swRegistration.current = reg
        // Verificar si ya hay suscripción activa
        return reg.pushManager.getSubscription()
      })
      .then((sub) => {
        setSubscribed(!!sub)
      })
      .catch(() => {})
  }, [supported, token])

  const subscribe = useCallback(async () => {
    if (!supported || !token || !empleado?.id) return

    // Si el permiso está en default, solicitarlo
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') {
        toast.error('Permiso de notificaciones denegado')
        return
      }
    }

    if (Notification.permission !== 'granted') {
      toast.error('Las notificaciones están bloqueadas. Habilítalas desde la configuración del navegador.')
      return
    }

    setLoading(true)
    try {
      // Obtener service worker registration
      const reg = swRegistration.current || await navigator.serviceWorker.ready
      swRegistration.current = reg

      // Obtener clave pública VAPID
      const vapidKey = await getVapidPublicKey()
      if (!vapidKey) {
        toast.error('Push notifications no configuradas en el servidor')
        setLoading(false)
        return
      }

      // Verificar suscripción existente
      const existingSub = await reg.pushManager.getSubscription()
      if (existingSub) {
        // Ya está suscrito — solo actualizar en backend
        await api.post('/push/subscribir', {
          subscription: {
            endpoint: existingSub.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(existingSub.getKey('p256dh')!),
              auth: arrayBufferToBase64(existingSub.getKey('auth')!),
            },
          },
          userAgent: navigator.userAgent,
        })
        setSubscribed(true)
        toast.success('Notificaciones push activadas')
        setLoading(false)
        return
      }

      // Suscribir nuevo
      const applicationServerKey = urlBase64ToUint8Array(vapidKey)
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      })

      // Guardar en backend
      await api.post('/push/subscribir', {
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(subscription.getKey('auth')!),
          },
        },
        userAgent: navigator.userAgent,
      })

      setSubscribed(true)
      toast.success('Notificaciones push activadas')
    } catch (err: any) {
      console.error('[Push] Error al suscribir:', err)
      toast.error('Error al activar notificaciones push')
    } finally {
      setLoading(false)
    }
  }, [supported, token, empleado?.id])

  const unsubscribe = useCallback(async () => {
    if (!supported || !token || !empleado?.id) return

    setLoading(true)
    try {
      const reg = swRegistration.current || await navigator.serviceWorker.ready

      // Obtener suscripción actual y desuscribir del push service
      const subscription = await reg.pushManager.getSubscription()
      if (subscription) {
        // Primero notificar al backend
        await api.delete('/push/subscribir', {
          data: { endpoint: subscription.endpoint },
        }).catch(() => {})

        // Luego desuscribir del push service
        await subscription.unsubscribe()
      } else {
        // Si no hay suscripción activa, igual limpiar en backend
        await api.delete('/push/subscribir', {
          data: { endpoint: '' },
        }).catch(() => {})
      }

      setSubscribed(false)
      toast.success('Notificaciones push desactivadas')
    } catch (err: any) {
      console.error('[Push] Error al desuscribir:', err)
      toast.error('Error al desactivar notificaciones push')
    } finally {
      setLoading(false)
    }
  }, [supported, token, empleado?.id])

  return { supported, permission, subscribed, loading, subscribe, unsubscribe }
}

/** Helper: ArrayBuffer → Base64 URL-safe string */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
