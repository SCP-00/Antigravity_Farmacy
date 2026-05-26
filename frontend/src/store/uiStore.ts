import { create } from 'zustand'

interface UiState {
  sidebarAbierto:  boolean
  carritoAbierto:  boolean
  chatbotAbierto:  boolean
  modalActivo:     string | null
  darkMode:        boolean

  toggleSidebar:  () => void
  toggleCarrito:  () => void
  toggleChatbot:  () => void
  abrirModal:     (id: string) => void
  cerrarModal:    () => void
  toggleDarkMode: () => void
  setDarkMode:    (v: boolean) => void
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarAbierto: false,
  carritoAbierto: false,
  chatbotAbierto: false,
  modalActivo:    null,
  darkMode:       localStorage.getItem('farmacy-dark-mode') === 'true',

  toggleSidebar:  () => set((s) => ({ sidebarAbierto: !s.sidebarAbierto })),
  toggleCarrito:  () => set((s) => ({ carritoAbierto: !s.carritoAbierto })),
  toggleChatbot:  () => set((s) => ({ chatbotAbierto: !s.chatbotAbierto })),
  abrirModal:     (id) => set({ modalActivo: id }),
  cerrarModal:    () => set({ modalActivo: null }),

  toggleDarkMode: () => {
    const next = !get().darkMode
    localStorage.setItem('farmacy-dark-mode', String(next))
    document.documentElement.classList.toggle('dark', next)
    set({ darkMode: next })
  },

  setDarkMode: (v) => {
    localStorage.setItem('farmacy-dark-mode', String(v))
    document.documentElement.classList.toggle('dark', v)
    set({ darkMode: v })
  },
}))

// ── Init: aplicar modo oscuro guardado al cargar ───────
const saved = localStorage.getItem('farmacy-dark-mode')
if (saved === 'true') {
  document.documentElement.classList.add('dark')
}