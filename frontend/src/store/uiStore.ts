import { create } from 'zustand'

interface UiState {
  sidebarAbierto:  boolean
  carritoAbierto:  boolean
  chatbotAbierto:  boolean
  modalActivo:     string | null

  toggleSidebar:  () => void
  toggleCarrito:  () => void
  toggleChatbot:  () => void
  abrirModal:     (id: string) => void
  cerrarModal:    () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarAbierto: false,
  carritoAbierto: false,
  chatbotAbierto: false,
  modalActivo:    null,

  toggleSidebar:  () => set((s) => ({ sidebarAbierto: !s.sidebarAbierto })),
  toggleCarrito:  () => set((s) => ({ carritoAbierto: !s.carritoAbierto })),
  toggleChatbot:  () => set((s) => ({ chatbotAbierto: !s.chatbotAbierto })),
  abrirModal:     (id) => set({ modalActivo: id }),
  cerrarModal:    () => set({ modalActivo: null }),
}))