import { apiClient } from './client'
import type { SupplierGraph } from '@/types/graph'

export const graphApi = {
  getGraph: async (): Promise<SupplierGraph> => {
    const { data } = await apiClient.get<SupplierGraph>('/api/graph')
    return data
  },
}
