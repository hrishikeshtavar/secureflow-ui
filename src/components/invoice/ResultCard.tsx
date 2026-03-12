import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle, XCircle, ChevronRight, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { riskConfig, formatScore } from '@/utils/riskScore'
import { formatRelative, formatCurrency } from '@/utils/formatters'
import type { InvoiceScan } from '@/types/invoice'

const statusIcons = {
  pass:    CheckCircle,
  warn:    AlertTriangle,
  blocked: XCircle,
}

interface ResultCardProps {
  scan: InvoiceScan
  compact?: boolean
}

export default function ResultCard({ scan, compact = false }: ResultCardProps) {
  const navigate = useNavigate()
  const cfg = riskConfig[scan.status]
  const Icon = statusIcons[scan.status]
  const triggeredCount = scan.fraud_flags.filter((f) => f.triggered).length
  const hasInjection = scan.canary_events.some((e) => e.type === 'injection_blocked')

  return (
    <div
      className={`bg-surface border rounded-lg transition-all cursor-pointer hover:border-opacity-80 ${
        scan.status === 'blocked' ? 'border-red-500/30' :
        scan.status === 'warn'    ? 'border-amber-500/30' :
                                    'border-border'
      }`}
      onClick={() => navigate(`/invoice/${scan.id}`)}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Status icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: cfg.bg + '55', border: `1px solid ${cfg.border}` }}
        >
          <Icon size={16} style={{ color: cfg.color }} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-sm text-slate-200 font-medium truncate">
                {scan.extracted.invoice_number}
              </p>
              <p className="font-mono text-xs text-slate-500 truncate">
                {scan.extracted.supplier_name}
              </p>
            </div>
            <Badge variant={scan.status} size="md">
              {cfg.label}
            </Badge>
          </div>

          {!compact && (
            <div className="mt-2 flex items-center gap-4">
              {/* Risk score bar */}
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-mono text-slate-600">RISK SCORE</span>
                  <span className="text-[10px] font-mono" style={{ color: cfg.color }}>
                    {formatScore(scan.risk_score)}
                  </span>
                </div>
                <div className="h-1 bg-surface-alt rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${scan.risk_score * 100}%`, background: cfg.color }}
                  />
                </div>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p className="font-mono text-xs text-slate-300 font-medium">
                  {formatCurrency(scan.extracted.total_amount, scan.extracted.currency)}
                </p>
              </div>
            </div>
          )}

          {/* Flags row */}
          {!compact && (triggeredCount > 0 || hasInjection) && (
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {hasInjection && (
                <Badge variant="blocked">⚠ INJECTION</Badge>
              )}
              {scan.fraud_flags
                .filter((f) => f.triggered)
                .map((f) => (
                  <Badge key={f.rule} variant="warn">
                    {f.rule.replace('_', ' ')}
                  </Badge>
                ))}
            </div>
          )}
        </div>

        {/* Arrow + time */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <ChevronRight size={14} className="text-slate-600" />
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-600">
            <Clock size={10} />
            {formatRelative(scan.scanned_at)}
          </div>
        </div>
      </div>
    </div>
  )
}
