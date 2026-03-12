import { clsx } from 'clsx'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime, truncate } from '@/utils/formatters'
import type { SecurityEvent, SecurityEventType } from '@/types/security'

const eventConfig: Record<SecurityEventType, { label: string; variant: 'blocked' | 'warn' | 'pass' | 'info' }> = {
  injection_blocked:    { label: 'BLOCKED',  variant: 'blocked' },
  pii_detected:         { label: 'PII',      variant: 'warn' },
  hallucination_flagged:{ label: 'HALLUC.',  variant: 'warn' },
  output_inconsistency: { label: 'INCONSIST',variant: 'warn' },
  pass:                 { label: 'PASS',     variant: 'pass' },
}

export function EventBadge({ type }: { type: SecurityEventType }) {
  const cfg = eventConfig[type]
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

interface EventFeedProps {
  events: SecurityEvent[]
  limit?: number
  className?: string
}

export function EventFeed({ events, limit = 20, className }: EventFeedProps) {
  const visible = events.slice(0, limit)

  if (visible.length === 0) {
    return (
      <div className={clsx('text-center py-10', className)}>
        <p className="font-mono text-xs text-slate-600">No security events recorded.</p>
      </div>
    )
  }

  return (
    <div className={clsx('space-y-1', className)}>
      {visible.map((event) => (
        <div
          key={event.id}
          className={clsx(
            'flex items-start gap-3 p-3 rounded border transition-colors',
            event.severity === 'critical'
              ? 'bg-red-950/30 border-red-500/20'
              : event.severity === 'warning'
              ? 'bg-amber-950/20 border-amber-500/10'
              : 'bg-surface border-border'
          )}
        >
          <EventBadge type={event.type} />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs text-slate-300">{truncate(event.detail, 100)}</p>
            {event.payload_preview && (
              <p className="font-mono text-[10px] text-red-400/70 mt-1 truncate">
                ↳ {truncate(event.payload_preview, 80)}
              </p>
            )}
          </div>
          <span className="font-mono text-[10px] text-slate-600 flex-shrink-0">
            {formatDateTime(event.timestamp)}
          </span>
        </div>
      ))}
    </div>
  )
}
