export type SecurityEventType =
  | 'injection_blocked'
  | 'pii_detected'
  | 'hallucination_flagged'
  | 'output_inconsistency'
  | 'pass'

export type Severity = 'critical' | 'warning' | 'info'

export interface SecurityEvent {
  id: string
  timestamp: string
  type: SecurityEventType
  invoice_id: string
  severity: Severity
  detail: string
  payload_preview?: string
}
