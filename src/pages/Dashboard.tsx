import { useEffect } from 'react'
import { Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import UploadZone from '@/components/invoice/UploadZone'
import ScanProgress from '@/components/invoice/ScanProgress'
import ResultCard from '@/components/invoice/ResultCard'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { useInvoiceStore, useSecurityStore } from '@/store'
import { DEMO_LABELS } from '@/utils/demoData'
import type { DemoType } from '@/types/invoice'

const DEMO_TYPES: DemoType[] = ['legit_1', 'legit_2', 'fraud_dup', 'fraud_amount', 'attack']

export default function Dashboard() {
  const { scans, isScanning, scanStage, error, loadDemoInvoice, clearError } = useInvoiceStore()
  const { addEvent } = useSecurityStore()

  // Show toast + trigger security alert for attack scans
  useEffect(() => {
    if (!isScanning && scans.length > 0) {
      const latest = scans[0]
      if (latest.status === 'blocked') {
        if (latest.canary_events.length > 0) {
          const evt = latest.canary_events[0]
          addEvent(evt)
          toast.error('Security threat blocked', { duration: 4000 })
        } else {
          toast.error('Invoice blocked — high fraud risk', { duration: 3000 })
        }
      } else if (latest.status === 'warn') {
        toast('Invoice flagged for review', { icon: '⚠️', duration: 3000 })
      } else {
        toast.success('Invoice cleared — Low Risk', { duration: 2500 })
      }
    }
  }, [isScanning]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error, clearError])

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-mono font-bold text-lg text-slate-200 tracking-wide">
          Invoice Scanner
        </h1>
        <p className="font-mono text-xs text-slate-500 mt-0.5">
          Upload an invoice PDF to run fraud detection and Canary Layer security scan
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Upload + progress */}
        <div className="col-span-2 space-y-4">
          <UploadZone />

          {/* Pipeline progress */}
          {isScanning && scanStage && (
            <Card>
              <CardHeader>
                <span className="font-mono text-xs text-slate-500 tracking-widest">PIPELINE</span>
              </CardHeader>
              <CardBody>
                <ScanProgress stage={scanStage} />
              </CardBody>
            </Card>
          )}

          {/* Results list */}
          {scans.length > 0 && (
            <div className="space-y-2">
              <p className="font-mono text-xs text-slate-600 tracking-widest">
                RESULTS — {scans.length} scan{scans.length !== 1 ? 's' : ''}
              </p>
              {scans.map((scan) => (
                <ResultCard key={scan.id} scan={scan} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Demo panel */}
        <div>
          <Card>
            <CardHeader>
              <Zap size={12} className="text-amber-400" />
              <span className="font-mono text-xs text-slate-500 tracking-widest">DEMO INVOICES</span>
            </CardHeader>
            <CardBody className="space-y-2">
              <p className="font-mono text-[10px] text-slate-600">
                Load a pre-built invoice for live demo
              </p>
              {DEMO_TYPES.map((type) => (
                <Button
                  key={type}
                  variant={type === 'attack' ? 'attack' : 'secondary'}
                  size="sm"
                  className="w-full justify-start text-left"
                  loading={isScanning}
                  onClick={() => loadDemoInvoice(type)}
                >
                  {DEMO_LABELS[type]}
                </Button>
              ))}
            </CardBody>
          </Card>

          {/* Stats */}
          {scans.length > 0 && (
            <Card className="mt-4">
              <CardBody className="space-y-3">
                {(['pass', 'warn', 'blocked'] as const).map((status) => {
                  const count = scans.filter((s) => s.status === status).length
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-600 uppercase tracking-wider">
                        {status === 'pass' ? 'Clear' : status === 'warn' ? 'Flagged' : 'Blocked'}
                      </span>
                      <span className={`font-mono font-bold text-sm ${
                        status === 'pass' ? 'text-emerald-400' :
                        status === 'warn' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {count}
                      </span>
                    </div>
                  )
                })}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
