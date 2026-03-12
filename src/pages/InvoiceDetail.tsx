import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody, Spinner } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EventFeed } from '@/components/security/EventFeed'
import { riskConfig, formatScore } from '@/utils/riskScore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useInvoiceStore } from '@/store'

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentScan, loadInvoice } = useInvoiceStore()

  useEffect(() => {
    if (id) loadInvoice(id)
  }, [id, loadInvoice])

  if (!currentScan) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const scan = currentScan
  const cfg = riskConfig[scan.status]

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={14} />
        Dashboard
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-mono font-bold text-lg text-slate-200">
              {scan.extracted.invoice_number}
            </h1>
            <Badge variant={scan.status} size="md">{cfg.label}</Badge>
          </div>
          <p className="font-mono text-xs text-slate-500">{scan.extracted.supplier_name}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xl font-bold text-slate-100">
            {formatCurrency(scan.extracted.total_amount, scan.extracted.currency)}
          </p>
          <p className="font-mono text-xs text-slate-600">{formatDate(scan.extracted.invoice_date)}</p>
        </div>
      </div>

      {/* Risk score */}
      <Card glow={scan.status}>
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-slate-500 tracking-widest">RISK SCORE</span>
            <span className="font-mono font-bold text-2xl" style={{ color: cfg.color }}>
              {formatScore(scan.risk_score)}
            </span>
          </div>
          <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${scan.risk_score * 100}%`, background: cfg.color }}
            />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-5">
        {/* Extracted fields */}
        <Card>
          <CardHeader>
            <span className="font-mono text-xs text-slate-500 tracking-widest">EXTRACTED FIELDS</span>
          </CardHeader>
          <CardBody className="space-y-2">
            {[
              ['Supplier',  scan.extracted.supplier_name],
              ['Address',   scan.extracted.supplier_address],
              ['Inv. Date', formatDate(scan.extracted.invoice_date)],
              ['Due Date',  formatDate(scan.extracted.due_date)],
              ['Currency',  scan.extracted.currency],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 text-xs font-mono">
                <span className="text-slate-600">{label}</span>
                <span className="text-slate-300 text-right truncate max-w-[180px]">{value}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Fraud flags */}
        <Card>
          <CardHeader>
            <span className="font-mono text-xs text-slate-500 tracking-widest">FRAUD DETECTION</span>
          </CardHeader>
          <CardBody className="space-y-2">
            {scan.fraud_flags.map((flag) => (
              <div key={flag.rule} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${flag.triggered ? 'bg-red-400' : 'bg-emerald-400'}`} />
                    <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wide">
                      {flag.rule.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="font-mono text-[10px]" style={{
                    color: flag.triggered ? '#EF4444' : '#10B981'
                  }}>
                    {(flag.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-0.5 bg-surface-alt rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${flag.confidence * 100}%`,
                      background: flag.triggered ? '#EF4444' : '#10B981',
                    }}
                  />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Explanation */}
      <Card>
        <CardHeader>
          <span className="font-mono text-xs text-slate-500 tracking-widest">AI EXPLANATION</span>
          <Badge variant="info" className="ml-auto">Gemini 2.5 Flash</Badge>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-slate-300 font-serif leading-relaxed border-l-2 border-amber-500/30 pl-4">
            {scan.explanation.summary}
          </p>
        </CardBody>
      </Card>

      {/* Canary events (if any) */}
      {scan.canary_events.length > 0 && (
        <Card>
          <CardHeader>
            <span className="font-mono text-xs text-red-400 tracking-widest">⚠ CANARY LAYER EVENTS</span>
          </CardHeader>
          <CardBody>
            <EventFeed events={scan.canary_events} />
          </CardBody>
        </Card>
      )}

      {/* Line items */}
      <Card>
        <CardHeader>
          <span className="font-mono text-xs text-slate-500 tracking-widest">LINE ITEMS</span>
        </CardHeader>
        <CardBody>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-slate-600 border-b border-border">
                <th className="text-left pb-2">Description</th>
                <th className="text-right pb-2">Qty</th>
                <th className="text-right pb-2">Unit Price</th>
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {scan.extracted.line_items.map((item, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 text-slate-300 pr-4">{item.description}</td>
                  <td className="py-2 text-right text-slate-500">{item.quantity}</td>
                  <td className="py-2 text-right text-slate-400">
                    {formatCurrency(item.unit_price, scan.extracted.currency)}
                  </td>
                  <td className="py-2 text-right text-slate-200 font-medium">
                    {formatCurrency(item.total, scan.extracted.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  )
}
