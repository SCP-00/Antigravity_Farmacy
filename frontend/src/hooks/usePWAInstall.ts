// ══════════════════════════════════════════════════════════
//  usePWAInstall.ts — Hook para beforeinstallprompt + analytics
//  Captura el evento beforeinstallprompt, expone install(),
//  y trackea métricas de instalación en localStorage.
// ══════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from 'react'

/* ─── Tipos ─────────────────────────────────────────────── */
interface PWAInstallAnalytics {
  /** Timestamp de cuándo el navegador emitió beforeinstallprompt */
  firstPromptAvailableAt: number | null
  /** Timestamp de cuándo el usuario hizo clic en "Instalar" */
  installClickedAt: number | null
  /** Timestamp de cuándo el usuario aceptó la instalación */
  installedAt: number | null
  /** Timestamp de cuándo el usuario rechazó la instalación */
  dismissedAt: number | null
  /** Cuántas veces se ha mostrado el banner */
  bannerShownCount: number
  /** Cuántas veces el usuario ha hecho clic en instalar */
  installClickCount: number
  /** Cuántas veces se completó la instalación */
  installCompletedCount: number
  /** Cuántas veces se descartó */
  dismissCount: number
}

const ANALYTICS_KEY = 'farmacy_pwa_install_analytics'

function loadAnalytics(): PWAInstallAnalytics {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY)
    if (raw) return JSON.parse(raw) as PWAInstallAnalytics
  } catch { /* ignora */ }
  return {
    firstPromptAvailableAt: null,
    installClickedAt: null,
    installedAt: null,
    dismissedAt: null,
    bannerShownCount: 0,
    installClickCount: 0,
    installCompletedCount: 0,
    dismissCount: 0,
  }
}

function saveAnalytics(a: PWAInstallAnalytics) {
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(a))
  } catch { /* ignora */ }
}

/* ─── Hook ───────────────────────────────────────────────── */
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled]   = useState(false)
  const analyticsRef = useRef<PWAInstallAnalytics>(loadAnalytics())
  // Previene double‑conteo cuando install() + appinstalled se disparan juntos
  const hasRecordedInstallRef = useRef(false)

  // Verificar si ya está instalado (display-mode: standalone)
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) {
      setIsInstalled(true)
      analyticsRef.current.installedAt ??= Date.now()
      saveAnalytics(analyticsRef.current)
    }
  }, [])

  // Escuchar beforeinstallprompt
  useEffect(() => {
    // Previene que Chrome muestre el mini-infobar automáticamente
    // y nos permite capturar el evento para mostrar nuestro banner
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setIsInstallable(true)
      const a = analyticsRef.current
      if (!a.firstPromptAvailableAt) {
        a.firstPromptAvailableAt = Date.now()
        saveAnalytics(a)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Detectar instalación completada
    const onInstalled = () => {
      if (hasRecordedInstallRef.current) return // ya lo contó install()
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallPrompt(null)
      const a = analyticsRef.current
      a.installedAt = Date.now()
      a.installCompletedCount += 1
      saveAnalytics(a)
    }

    window.addEventListener('appinstalled', onInstalled)

    // Detectar si display-mode cambia a standalone (iOS Safari)
    const mql = window.matchMedia('(display-mode: standalone)')
    const onDisplayMode = (e: MediaQueryListEvent) => {
      if (e.matches && !hasRecordedInstallRef.current) {
        setIsInstalled(true)
        setIsInstallable(false)
        setInstallPrompt(null)
        const a = analyticsRef.current
        a.installedAt ??= Date.now()
        a.installCompletedCount += 1
        saveAnalytics(a)
      }
    }
    if (mql.addEventListener) {
      mql.addEventListener('change', onDisplayMode)
    } else {
      // Safari fallback
      mql.addListener(onDisplayMode)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
      if (mql.removeEventListener) {
        mql.removeEventListener('change', onDisplayMode)
      } else {
        mql.removeListener(onDisplayMode)
      }
    }
  }, [])

  /** Marca el banner como mostrado una vez más */
  const markBannerShown = useCallback(() => {
    const a = analyticsRef.current
    a.bannerShownCount += 1
    saveAnalytics(a)
  }, [])

  /** Dispara el prompt de instalación y trackea resultado */
  const install = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false

    const a = analyticsRef.current
    a.installClickedAt = Date.now()
    a.installClickCount += 1
    saveAnalytics(a)

    try {
      const promptEvent = installPrompt as any
      await promptEvent.prompt()
      const result = await promptEvent.userChoice

      if (result.outcome === 'accepted') {
        hasRecordedInstallRef.current = true
        setIsInstalled(true)
        setIsInstallable(false)
        a.installedAt = Date.now()
        a.installCompletedCount += 1
        saveAnalytics(a)
        return true
      } else {
        a.dismissedAt = Date.now()
        a.dismissCount += 1
        setIsInstallable(false) // No volver a preguntar esta sesión
        setInstallPrompt(null)
        saveAnalytics(a)
        return false
      }
    } catch {
      a.dismissCount += 1
      saveAnalytics(a)
      return false
    }
  }, [installPrompt])

  /** Descartar banner por ahora */
  const dismiss = useCallback(() => {
    const a = analyticsRef.current
    a.dismissedAt = Date.now()
    a.dismissCount += 1
    saveAnalytics(a)
    setIsInstallable(false)
    setInstallPrompt(null)
  }, [])

  /** Resetear analíticas (útil en desarrollo) */
  const resetAnalytics = useCallback(() => {
    analyticsRef.current = {
      firstPromptAvailableAt: null,
      installClickedAt: null,
      installedAt: null,
      dismissedAt: null,
      bannerShownCount: 0,
      installClickCount: 0,
      installCompletedCount: 0,
      dismissCount: 0,
    }
    saveAnalytics(analyticsRef.current)
  }, [])

  /** Obtener analíticas actuales */
  const getAnalytics = useCallback((): PWAInstallAnalytics => {
    return { ...analyticsRef.current }
  }, [])

  return {
    /** Si el navegador soporta instalación PWA (criterios cumplidos) */
    isInstallable,
    /** Si la app ya está instalada (display-mode: standalone) */
    isInstalled,
    /** Disparar el prompt de instalación */
    install,
    /** Descartar banner por ahora */
    dismiss,
    /** Marcar banner como mostrado */
    markBannerShown,
    /** Obtener analíticas de instalación */
    getAnalytics,
    /** Resetear analíticas */
    resetAnalytics,
  } as const
}

export type { PWAInstallAnalytics }
