import { useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { riskConfig } from '@/utils/riskScore'
import { formatDateTime, formatCurrency } from '@/utils/formatters'
import { useInvoiceStore } from '@/store'

export default function AuditTrail() {
  const navigate = useNavigate()
  const { scans } = useInvoiceStore()

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="font-mono font-bold text-lg text-slate-200 flex items-center gap-2">
          <ClipboardList size={18} className="text-amber-400" />
          Audit Trail
        </h1>
        <p className="font-mono text-xs text-slate-500 mt-0.5">
          Tamper-evident decision log — every scan, timestamped and hashed
        </p>
      </div>

      <Card>
        <CardHeader>
          <span className="font-mono text-xs text-slate-500 tracking-widest">
            AUDIT LOG — {scans.length} entries
          </span>
        </CardHeader>
        <CardBody className="p-0">
          {scans.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-mono text-xs text-slate-600">No scans yet. Upload an invoice to begin.</p>
            </div>
          ) : (
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-slate-600 border-b border-border">
                  {['Timestamp', 'Invoice ID', 'Supplier', 'Amount', 'Decision', 'Canary', 'Audit ID'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scans.map((scan) => (
                  <tr
                    key={scan.id}
                    className="border-b border-border/50 hover:bg-surface-alt cursor-pointer transition-colors"
                    onClick={() => navigate(`/invoice/${scan.id}`)}
                  >
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(scan.scanned_at)}</td>
                    <td className="px-4 py-3 text-slate-300 font-medium">{scan.extracted.invoice_number}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-[160px] truncate">{scan.extracted.supplier_name}</td>
                    <td className="px-4 py-3 text-slate-300">{formatCurrency(scan.extracted.total_amount, scan.extracted.currency)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={scan.status}>{riskConfig[scan.status].label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {scan.canary_events.length > 0 ? (
                        <Badge variant="blocked">⚠ {scan.canary_events.length} event{scan.canary_events.length > 1 ? 's' : ''}</Badge>
                      ) : (
                        <Badge variant="pass">CLEAN</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{scan.audit_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
