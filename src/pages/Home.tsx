import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Brain, Network, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const pillars = [
  {
    icon: Brain,
    title: 'AI Fraud Detection',
    desc: 'Document AI + ML rules detect duplicate invoices, amount anomalies, suspicious suppliers and circular billing patterns.',
    color: '#3B82F6',
  },
  {
    icon: ShieldCheck,
    title: 'Canary Layer Security',
    desc: 'Model Armor monitors every LLM input and output in real-time — blocking prompt injection, PII leakage, and hallucinated risk scores.',
    color: '#F59E0B',
  },
  {
    icon: Network,
    title: 'Explainable AI',
    desc: 'Every decision comes with Gemini-generated 3-layer explanations: plain-language summary, evidence mapping, and confidence breakdown.',
    color: '#10B981',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#080D14] flex flex-col items-center justify-center px-6 py-16">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
          <span className="font-mono font-black text-amber-400 text-lg">SF</span>
        </div>
        <div>
          <p className="font-mono font-black text-xl text-white tracking-wide">SecureFlow AI</p>
          <p className="font-mono text-xs text-slate-500 tracking-widest">INVOICE INTELLIGENCE</p>
        </div>
      </div>

      {/* Headline */}
      <div className="text-center mb-12 max-w-xl">
        <h1 className="font-mono font-black text-3xl text-white leading-tight mb-4">
          Fraud-proof invoices.<br />
          <span className="text-amber-400">Attack-proof AI.</span>
        </h1>
        <p className="font-mono text-sm text-slate-400 leading-relaxed">
          The only invoice financing platform that protects its own AI engine from adversarial attacks
          embedded in the documents it processes.
        </p>
      </div>

      {/* CTA */}
      <Button variant="primary" size="lg" onClick={() => navigate('/dashboard')}>
        Open Dashboard
        <ArrowRight size={16} />
      </Button>

      {/* Pillars */}
      <div className="grid grid-cols-3 gap-5 mt-16 max-w-3xl w-full">
        {pillars.map(({ icon: Icon, title, desc, color }) => (
          <div
            key={title}
            className="bg-surface border border-border rounded-lg p-5"
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center mb-3 border"
              style={{ background: color + '18', borderColor: color + '40' }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <p className="font-mono font-bold text-sm text-slate-200 mb-2">{title}</p>
            <p className="font-mono text-[11px] text-slate-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Footer tagline */}
      <p className="font-mono text-[10px] text-slate-700 mt-12 tracking-widest">
        BUILT ON GOOGLE CLOUD · DOCUMENT AI · VERTEX AI · MODEL ARMOR
      </p>
    </div>
  )
}
