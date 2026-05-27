/// <reference types="vite/client" />

/**
 * Módulo virtual generado por vite-plugin-pwa.
 * Provee registerSW() para registrar el Service Worker.
 * Solo disponible en build; en dev (devOptions.enabled: false) no existe.
 */
declare module 'virtual:pwa-register' {
  import type { RegisterSWOptions } from 'workbox-window'

  export type { RegisterSWOptions }

  /**
   * Registra el Service Worker y retorna una función de actualización.
   */
  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>
}
