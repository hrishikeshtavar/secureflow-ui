import type { RiskStatus } from '@/types/invoice'

export const getRiskStatus = (score: number): RiskStatus => {
  if (score < 0.3) return 'pass'
  if (score < 0.7) return 'warn'
  return 'blocked'
}

export const riskConfig: Record<RiskStatus, { label: string; color: string; bg: string; border: string; tailwind: string }> = {
  pass: {
    label: 'Low Risk',
    color: '#10B981',
    bg: '#064E3B',
    border: '#10B98144',
    tailwind: 'text-emerald-400 bg-emerald-900/40 border-emerald-500/30',
  },
  warn: {
    label: 'Med Risk',
    color: '#F59E0B',
    bg: '#92610A',
    border: '#F59E0B44',
    tailwind: 'text-amber-400 bg-amber-900/40 border-amber-500/30',
  },
  blocked: {
    label: 'HIGH RISK',
    color: '#EF4444',
    bg: '#7F1D1D',
    border: '#EF444444',
    tailwind: 'text-red-400 bg-red-900/40 border-red-500/30',
  },
}

export const formatScore = (score: number): string =>
  (score * 100).toFixed(0) + '%'
