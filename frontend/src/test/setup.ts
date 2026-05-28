// ══════════════════════════════════════════════════════════
//  Test setup — Configuración global para tests frontend
// ══════════════════════════════════════════════════════════
import '@testing-library/jest-dom'

// Mock de IntersectionObserver (usado por LazyImage)
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

// Mock de matchMedia (usado por hooks de responsive)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
