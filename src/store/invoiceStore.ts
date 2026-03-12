import { create } from 'zustand'
import { invoicesApi } from '@/api/invoices'
import type { InvoiceScan, ScanStage, DemoType } from '@/types/invoice'
import { DEMO_MOCK_DATA } from '@/utils/demoData'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const STAGE_SEQUENCE: ScanStage[] = [
  'parsing',
  'canary_input',
  'fraud_rules',
  'graph',
  'explaining',
  'canary_output',
  'complete',
]

interface InvoiceState {
  scans: InvoiceScan[]
  currentScan: InvoiceScan | null
  isScanning: boolean
  scanStage: ScanStage | null
  error: string | null

  uploadInvoice: (file: File) => Promise<void>
  loadInvoice: (id: string) => Promise<void>
  loadDemoInvoice: (type: DemoType) => Promise<void>
  clearError: () => void
  clearCurrent: () => void
}

// Simulate pipeline stage progression for demo mode
const simulateStages = async (
  setScanStage: (stage: ScanStage) => void,
  delayMs = 400
) => {
  for (const stage of STAGE_SEQUENCE) {
    setScanStage(stage)
    if (stage !== 'complete') await new Promise((r) => setTimeout(r, delayMs))
  }
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  scans: [],
  currentScan: null,
  isScanning: false,
  scanStage: null,
  error: null,

  uploadInvoice: async (file) => {
    set({ isScanning: true, error: null, scanStage: 'parsing' })
    try {
      if (DEMO_MODE) {
        await simulateStages((stage) => set({ scanStage: stage }))
        const mock = DEMO_MOCK_DATA['legit_1']
        mock.filename = file.name
        set((s) => ({ scans: [mock, ...s.scans], currentScan: mock, isScanning: false }))
        return
      }
      // Kick off stage simulation in parallel with real API call
      simulateStages((stage) => set({ scanStage: stage }), 600)
      const result = await invoicesApi.scan(file)
      set((s) => ({
        scans: [result, ...s.scans],
        currentScan: result,
        isScanning: false,
        scanStage: 'complete',
      }))
    } catch (err) {
      set({ error: (err as Error).message, isScanning: false, scanStage: null })
    }
  },

  loadInvoice: async (id) => {
    if (DEMO_MODE) {
      const found = get().scans.find((s) => s.id === id) ?? DEMO_MOCK_DATA['legit_1']
      set({ currentScan: found })
      return
    }
    try {
      const result = await invoicesApi.getById(id)
      set({ currentScan: result })
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  loadDemoInvoice: async (type) => {
    set({ isScanning: true, error: null, scanStage: 'parsing' })
    try {
      if (DEMO_MODE) {
        await simulateStages((stage) => set({ scanStage: stage }))
        const mock = DEMO_MOCK_DATA[type]
        set((s) => ({ scans: [mock, ...s.scans], currentScan: mock, isScanning: false }))
        return
      }
      simulateStages((stage) => set({ scanStage: stage }), 600)
      const result = await invoicesApi.loadDemo(type)
      set((s) => ({
        scans: [result, ...s.scans],
        currentScan: result,
        isScanning: false,
        scanStage: 'complete',
      }))
    } catch (err) {
      set({ error: (err as Error).message, isScanning: false, scanStage: null })
    }
  },

  clearError: () => set({ error: null }),
  clearCurrent: () => set({ currentScan: null, scanStage: null }),
}))
