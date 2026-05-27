// ══════════════════════════════════════════════════════════
//  InstallPWABanner.tsx — Banner de instalación PWA
//  Aparece como slide-up cuando beforeinstallprompt está disponible
// ══════════════════════════════════════════════════════════
'use client'

import { useEffect, useRef } from 'react'
import { X, Download } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export default function InstallPWABanner() {
  const { isInstallable, isInstalled, install, dismiss, markBannerShown } =
    usePWAInstall()
  const bannerRef = useRef<HTMLDivElement>(null)
  const hasShownRef = useRef(false)

  // Marcar como mostrado la primera vez que se vuelve visible
  useEffect(() => {
    if (isInstallable && !hasShownRef.current) {
      hasShownRef.current = true
      markBannerShown()
    }
  }, [isInstallable, markBannerShown])

  if (!isInstallable || isInstalled) return null

  const handleInstall = async () => {
    const ok = await install()
    if (ok) {
      // Se instaló — el banner desaparece automáticamente porque isInstalled → true
    }
  }

  const handleDismiss = () => {
    dismiss()
  }

  return (
    <div
      ref={bannerRef}
      role="alert"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up px-4 pb-4 pointer-events-none"
    >
      <div
        className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-teal-100 bg-white p-4 shadow-xl shadow-teal-900/10 backdrop-blur-sm
                   dark:border-teal-800 dark:bg-dark-surface dark:shadow-black/30"
      >
        <div className="flex items-start gap-3">
          {/* Icono */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white">
            <Download size={20} />
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-dark-text">
              Instala Farmacy
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-dark-text-secondary leading-relaxed">
              Accede a tu catálogo de medicamentos sin conexión y más rápido.
            </p>

            {/* Botones */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-semibold text-white
                           transition-all duration-150 hover:bg-teal-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
              >
                <Download size={14} />
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors
                           hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300/50
                           dark:text-dark-text-secondary dark:hover:bg-dark-hover"
              >
                Ahora no
              </button>
            </div>
          </div>

          {/* Cerrar */}
          <button
            onClick={handleDismiss}
            aria-label="Cerrar"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400
                       transition-colors hover:bg-slate-100 hover:text-slate-600
                       dark:text-dark-text-muted dark:hover:bg-dark-hover"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.32, 0, 0.24, 1);
        }
      `}</style>
    </div>
  )
}
