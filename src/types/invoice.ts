export type RiskStatus = 'pass' | 'warn' | 'blocked'

export type ScanStage =
  | 'parsing'
  | 'canary_input'
  | 'fraud_rules'
  | 'graph'
  | 'explaining'
  | 'canary_output'
  | 'complete'

export type DemoType =
  | 'legit_1'
  | 'legit_2'
  | 'fraud_dup'
  | 'fraud_amount'
  | 'attack'

export interface LineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface ExtractedFields {
  invoice_number: string
  supplier_name: string
  supplier_address: string
  total_amount: number
  currency: string
  invoice_date: string
  due_date: string
  line_items: LineItem[]
}

export type FraudRuleId =
  | 'duplicate_id'
  | 'amount_anomaly'
  | 'new_supplier'
  | 'suspicious_address'
  | 'date_check'

export interface FraudFlag {
  rule: FraudRuleId
  triggered: boolean
  confidence: number
  detail: string
}

export interface EvidenceItem {
  field: string
  value: string
  rule: FraudRuleId
  significance: 'high' | 'medium' | 'low'
}

export interface ConfidenceItem {
  signal: string
  score: number
  weight: number
}

export interface Explanation {
  summary: string
  evidence: EvidenceItem[]
  confidence_breakdown: ConfidenceItem[]
}

export interface InvoiceScan {
  id: string
  filename: string
  scanned_at: string
  status: RiskStatus
  risk_score: number
  fraud_flags: FraudFlag[]
  canary_events: import('./security').SecurityEvent[]
  extracted: ExtractedFields
  explanation: Explanation
  audit_id: string
}
