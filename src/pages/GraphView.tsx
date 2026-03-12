import { useEffect, useRef, useState } from 'react'
import { GitBranch } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

// Static demo graph — replace with API call when backend is ready
const DEMO_NODES = [
  { id: 'sup_001', label: 'Acme Office\nSupplies', risk: 0.08, invoices: 42, x: 0,    y: -200 },
  { id: 'sup_002', label: 'TechPro\nServices',     risk: 0.12, invoices: 18, x: 250,  y: -100 },
  { id: 'sup_003', label: 'Global Tech\nSolutions', risk: 0.74, invoices: 8,  x: -250, y: -100 },
  { id: 'sup_004', label: 'Shell Co\nLtd',          risk: 0.95, invoices: 3,  x: -300, y: 100  },
  { id: 'sup_005', label: 'Reliable\nContractors',  risk: 0.10, invoices: 25, x: 0,    y: 150  },
  { id: 'sup_006', label: 'FastPay\nInvoicing',     risk: 0.88, invoices: 6,  x: 200,  y: 150  },
  { id: 'sup_007', label: 'Midland\nSuppliers',     risk: 0.22, invoices: 31, x: -100, y: 250  },
]

const DEMO_EDGES = [
  { from: 'sup_001', to: 'sup_002', weight: 5,  fraud: false },
  { from: 'sup_002', to: 'sup_005', weight: 3,  fraud: false },
  { from: 'sup_003', to: 'sup_004', weight: 8,  fraud: true  },
  { from: 'sup_004', to: 'sup_006', weight: 6,  fraud: true  },
  { from: 'sup_006', to: 'sup_003', weight: 4,  fraud: true  }, // circular
  { from: 'sup_001', to: 'sup_007', weight: 2,  fraud: false },
  { from: 'sup_007', to: 'sup_005', weight: 3,  fraud: false },
]

const nodeColor = (risk: number) => {
  if (risk < 0.3) return '#10B981'
  if (risk < 0.7) return '#F59E0B'
  return '#EF4444'
}

export default function GraphView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selected, setSelected] = useState<typeof DEMO_NODES[0] | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    const cx = W / 2
    const cy = H / 2

    ctx.clearRect(0, 0, W, H)

    // Draw edges
    DEMO_EDGES.forEach(({ from, to, fraud }) => {
      const a = DEMO_NODES.find(n => n.id === from)!
      const b = DEMO_NODES.find(n => n.id === to)!
      ctx.beginPath()
      ctx.moveTo(cx + a.x, cy + a.y)
      ctx.lineTo(cx + b.x, cy + b.y)
      ctx.strokeStyle = fraud ? '#EF444466' : '#1E3A5566'
      ctx.lineWidth = fraud ? 2 : 1
      if (fraud) {
        ctx.setLineDash([6, 3])
      } else {
        ctx.setLineDash([])
      }
      ctx.stroke()
      ctx.setLineDash([])
    })

    // Draw nodes
    DEMO_NODES.forEach((node) => {
      const nx = cx + node.x
      const ny = cy + node.y
      const r = Math.max(20, Math.min(36, node.invoices * 0.7))
      const color = nodeColor(node.risk)

      // Glow for high risk
      if (node.risk > 0.6) {
        ctx.beginPath()
        ctx.arc(nx, ny, r + 6, 0, Math.PI * 2)
        ctx.fillStyle = color + '22'
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(nx, ny, r, 0, Math.PI * 2)
      ctx.fillStyle = color + '22'
      ctx.strokeStyle = color
      ctx.lineWidth = node.id === selected?.id ? 2.5 : 1.5
      ctx.fill()
      ctx.stroke()

      // Label
      ctx.fillStyle = '#94A3B8'
      ctx.font = '10px "Courier New"'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      node.label.split('\n').forEach((line, i) => {
        ctx.fillText(line, nx, ny + (i - 0.5) * 12)
      })
    })
  }, [selected])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const cx = canvas.width / 2
    const cy = canvas.height / 2

    const hit = DEMO_NODES.find((n) => {
      const dx = mx - (cx + n.x)
      const dy = my - (cy + n.y)
      return Math.sqrt(dx * dx + dy * dy) < 36
    })
    setSelected(hit ?? null)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="font-mono font-bold text-lg text-slate-200 flex items-center gap-2">
          <GitBranch size={18} className="text-amber-400" />
          Supplier Network
        </h1>
        <p className="font-mono text-xs text-slate-500 mt-0.5">
          Graph analysis — circular billing, shell company, and anomalous connection detection
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <Card className="overflow-hidden">
            <canvas
              ref={canvasRef}
              onClick={handleClick}
              className="w-full cursor-pointer"
              style={{ height: 440, background: '#080D14' }}
            />
          </Card>
          <div className="flex gap-4 mt-3 px-1">
            {[
              { color: '#10B981', label: 'Low risk' },
              { color: '#F59E0B', label: 'Medium risk' },
              { color: '#EF4444', label: 'High risk / fraud pattern' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full border" style={{ background: color + '33', borderColor: color }} />
                <span className="font-mono text-[10px] text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <span className="font-mono text-xs text-slate-500 tracking-widest">
                {selected ? 'SUPPLIER DETAIL' : 'SELECT A NODE'}
              </span>
            </CardHeader>
            <CardBody>
              {selected ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-mono font-bold text-sm text-slate-200">
                      {selected.label.replace('\n', ' ')}
                    </p>
                    <p className="font-mono text-[10px] text-slate-600 mt-0.5">{selected.id}</p>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Invoices</span>
                      <span className="text-slate-300">{selected.invoices}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Risk Score</span>
                      <span style={{ color: nodeColor(selected.risk) }}>
                        {(selected.risk * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status</span>
                      <Badge variant={selected.risk < 0.3 ? 'pass' : selected.risk < 0.7 ? 'warn' : 'blocked'}>
                        {selected.risk < 0.3 ? 'Low Risk' : selected.risk < 0.7 ? 'Med Risk' : 'HIGH RISK'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="font-mono text-xs text-slate-600 text-center py-4">
                  Click a node to inspect supplier details
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <span className="font-mono text-xs text-slate-500 tracking-widest">PATTERNS DETECTED</span>
            </CardHeader>
            <CardBody className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-mono text-xs text-red-300 font-medium">Circular billing</p>
                  <p className="font-mono text-[10px] text-slate-600">sup_003 → sup_004 → sup_006 → sup_003</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-mono text-xs text-red-300 font-medium">Shell company</p>
                  <p className="font-mono text-[10px] text-slate-600">Shell Co Ltd — 3 invoices, high value, no web presence</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
