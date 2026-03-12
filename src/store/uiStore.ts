import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  debugPanelOpen: boolean

  toggleSidebar: () => void
  setDebugPanel: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  debugPanelOpen: import.meta.env.VITE_SHOW_DEBUG_PANEL === 'true',

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setDebugPanel: (open) => set({ debugPanelOpen: open }),
}))
