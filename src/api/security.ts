import { apiClient } from './client'
import type { SecurityEvent } from '@/types/security'

export const securityApi = {
  getEvents: async (limit = 50, since?: string): Promise<SecurityEvent[]> => {
    const params: Record<string, string | number> = { limit }
    if (since) params.since = since
    const { data } = await apiClient.get<{ events: SecurityEvent[]; total: number }>(
      '/api/security/events',
      { params }
    )
    return data.events
  },
}
