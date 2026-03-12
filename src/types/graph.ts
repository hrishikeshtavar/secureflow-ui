export type FraudPattern = 'circular_billing' | 'shell_company' | 'anomalous_connection' | null

export interface GraphNode {
  id: string
  label: string
  risk_score: number
  invoice_count: number
  fraud_patterns: FraudPattern[]
  total_value: number
}

export interface GraphEdge {
  from: string
  to: string
  weight: number
  fraud_pattern: FraudPattern
  invoice_ids: string[]
}

export interface SupplierGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  generated_at: string
}
