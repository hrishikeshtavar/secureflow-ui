import { clsx } from 'clsx'
import { Spinner } from '@/components/ui/Card'
import type { ScanStage } from '@/types/invoice'

const STAGES: { id: ScanStage; label: string; description: string }[] = [
  { id: 'parsing',       label: 'Document AI',     description: 'Extracting 30+ fields from invoice...' },
  { id: 'canary_input',  label: 'Canary — Input',  description: 'Scanning for injection payloads...' },
  { id: 'fraud_rules',   label: 'Fraud Engine',    description: 'Running 5 detection rules...' },
  { id: 'graph',         label: 'Graph Analysis',  description: 'Checking supplier network...' },
  { id: 'explaining',    label: 'Gemini XAI',      description: 'Generating explanation...' },
  { id: 'canary_output', label: 'Canary — Output', description: 'Validating AI response...' },
  { id: 'complete',      label: 'Complete',         description: 'Analysis complete.' },
]

const STAGE_ORDER = STAGES.map((s) => s.id)

interface ScanProgressProps {
  stage: ScanStage
}

export default function ScanProgress({ stage }: ScanProgressProps) {
  const currentIdx = STAGE_ORDER.indexOf(stage)

  const currentStage = STAGES.find((s) => s.id === stage)

  return (
    <div className="space-y-4">
      {/* Active stage label */}
      <div className="flex items-center gap-3">
        {stage !== 'complete' && <Spinner size="sm" />}
        <div>
          <p className="font-mono text-sm text-amber-400 font-medium">
            {currentStage?.label}
          </p>
          <p className="font-mono text-xs text-slate-500">
            {currentStage?.description}
          </p>
        </div>
      </div>

      {/* Stage track */}
      <div className="space-y-1">
        {STAGES.filter((s) => s.id !== 'complete').map((s, i) => {
          const done = i < currentIdx
          const active = s.id === stage
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className={clsx(
                'w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors',
                done    ? 'bg-emerald-400' :
                active  ? 'bg-amber-400 animate-pulse' :
                          'bg-slate-700'
              )} />
              <span className={clsx(
                'font-mono text-xs transition-colors',
                done   ? 'text-emerald-400/70' :
                active ? 'text-amber-400' :
                         'text-slate-700'
              )}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
