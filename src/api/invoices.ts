import { apiClient } from './client'
import type { InvoiceScan, DemoType } from '@/types/invoice'

export const invoicesApi = {
  scan: async (file: File): Promise<InvoiceScan> => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await apiClient.post<InvoiceScan>('/api/scan', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  getById: async (id: string): Promise<InvoiceScan> => {
    const { data } = await apiClient.get<InvoiceScan>(`/api/invoice/${id}`)
    return data
  },

  loadDemo: async (type: DemoType): Promise<InvoiceScan> => {
    const { data } = await apiClient.post<InvoiceScan>(`/api/demo/${type}`)
    return data
  },

  list: async (): Promise<InvoiceScan[]> => {
    const { data } = await apiClient.get<{ scans: InvoiceScan[] }>('/api/invoices')
    return data.scans
  },
}
