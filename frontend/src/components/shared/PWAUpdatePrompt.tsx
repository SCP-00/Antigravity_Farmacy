// ══════════════════════════════════════════════════════════
//  PWAUpdatePrompt.tsx — Service Worker update notification
//  Muestra un toast cuando hay una nueva versión disponible
// ══════════════════════════════════════════════════════════
'use client'

import { useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

/**
 * Componente que registra el Service Worker y muestra notificaciones toast
 * cuando hay una nueva versión disponible o la app está lista para offline.
 *
 * - No renderiza nada visible (return null)
 * - Importa dinámicamente `virtual:pwa-register` de vite-plugin-pwa
 * - Se renderiza una sola vez en `main.tsx`
 *
 * @example
 * ```tsx
 * <PWAUpdatePrompt />
 * ```
 */
export function PWAUpdatePrompt() {
  const handleUpdate = useCallback(() => {
    toast.success(
      '¡Nueva versión disponible! Actualiza la página para ver los cambios.',
      {
        id: 'pwa-update',
        duration: 8000,
        icon: '🔄',
        style: {
          background: '#E8F5F0',
          color: '#0A5A45',
          border: '1px solid #A8D5C4',
          borderRadius: '12px',
          fontSize: '14px',
        },
      }
    )
  }, [])

  const handleOfflineReady = useCallback(() => {
    toast.success('Farmacy funciona sin conexión 🏪', {
      id: 'pwa-offline',
      duration: 4000,
      style: {
        background: '#FFF8E6',
        color: '#7B5E00',
        border: '1px solid #FFE082',
        borderRadius: '12px',
        fontSize: '14px',
      },
    })
  }, [])

  useEffect(() => {
    // Importación dinámica del módulo virtual de vite-plugin-pwa
    // Solo disponible en build; en dev no falla gracias al try/catch
    let cancelled = false

    async function register() {
      try {
        const { registerSW } = await import('virtual:pwa-register')

        if (cancelled) return

        registerSW({
          onNeedRefresh() {
            handleUpdate()
          },
          onOfflineReady() {
            handleOfflineReady()
          },
        })
      } catch {
        // virtual:pwa-register no está disponible en dev con devOptions.enabled: false
        // No hacer nada — el SW se registra automáticamente en build
      }
    }

    register()

    return () => { cancelled = true }
  }, [handleUpdate, handleOfflineReady])

  // Este componente no renderiza nada visible
  return null
}
