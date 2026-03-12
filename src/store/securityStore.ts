import { create } from 'zustand'
import { securityApi } from '@/api/security'
import type { SecurityEvent } from '@/types/security'
import { DEMO_SECURITY_EVENTS } from '@/utils/demoData'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

interface SecurityState {
  events: SecurityEvent[]
  alertActive: boolean
  alertEvent: SecurityEvent | null
  unreadCount: number
  isLoading: boolean
  error: string | null

  fetchEvents: () => Promise<void>
  addEvent: (event: SecurityEvent) => void
  dismissAlert: () => void
  markAllRead: () => void
}

export const useSecurityStore = create<SecurityState>((set) => ({
  events: [],
  alertActive: false,
  alertEvent: null,
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null })
    try {
      if (DEMO_MODE) {
        set({ events: DEMO_SECURITY_EVENTS, isLoading: false })
        return
      }
      const events = await securityApi.getEvents()
      set({ events, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },

  addEvent: (event) =>
    set((s) => ({
      events: [event, ...s.events],
      unreadCount: s.unreadCount + 1,
      alertActive: event.severity === 'critical',
      alertEvent: event.severity === 'critical' ? event : s.alertEvent,
    })),

  dismissAlert: () => set({ alertActive: false, alertEvent: null }),

  markAllRead: () => set({ unreadCount: 0 }),
}))
