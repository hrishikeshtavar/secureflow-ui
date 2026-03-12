import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Binary, Brain, Network, Radar, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Entropy } from '@/components/ui/entropy'
import { SecureFlowLogo } from '@/components/ui/secure-flow-logo'

const pillars = [
  {
    icon: Brain,
    title: 'AI Fraud Detection',
    desc: 'Document AI and rule analysis detect duplicate invoices, suspicious suppliers, and circular billing patterns before funds move.',
    color: '#38BDF8',
  },
  {
    icon: ShieldCheck,
    title: 'Canary Layer Security',
    desc: 'Prompt injection, leakage attempts, and unsafe model outputs are blocked before they can contaminate downstream decisions.',
    color: '#F59E0B',
  },
  {
    icon: Network,
    title: 'Explainable Decisions',
    desc: 'Every verdict maps signals back to evidence so risk teams can review why the system cleared, flagged, or blocked an invoice.',
    color: '#10B981',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const [entropySize, setEntropySize] = useState(420)

  useEffect(() => {
    const updateEntropySize = () => {
      if (window.innerWidth < 480) {
        setEntropySize(280)
        return
      }

      if (window.innerWidth < 768) {
        setEntropySize(340)
        return
      }

      setEntropySize(420)
    }

    updateEntropySize()
    window.addEventListener('resize', updateEntropySize)

    return () => {
      window.removeEventListener('resize', updateEntropySize)
    }
  }, [])

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.12),_transparent_24%),#080d14] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col">
        <header className="mb-10 flex items-center justify-between gap-4">
          <SecureFlowLogo />
          <div className="hidden items-center gap-3 md:flex">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300">
              Live defense mesh
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigate('/security')}>
              Security Feed
            </Button>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,520px)]">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.28em] text-slate-300">
              <Radar size={14} className="text-cyan-300" />
              Invoice risk intelligence for AI-first finance teams
            </div>

            <h1 className="font-mono text-4xl font-black leading-[1.05] text-white md:text-6xl">
              Fraud-proof invoices.
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-white to-amber-300 bg-clip-text text-transparent">
                Attack-proof AI.
              </span>
            </h1>

            <p className="mt-6 max-w-xl font-mono text-sm leading-7 text-slate-400 md:text-[15px]">
              SecureFlow inspects every invoice and every prompt path at once, combining fraud
              scoring, document reasoning, and adversarial defense before risky money moves.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="primary"
                size="lg"
                className="lighting-button justify-center"
                onClick={() => navigate('/dashboard')}
              >
                Open Dashboard
                <ArrowRight size={16} />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/graph')}>
                Explore Risk Graph
                <Binary size={16} />
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {pillars.map(({ icon: Icon, title, desc, color }, index) => (
                <div
                  key={title}
                  className="word-float rounded-2xl border border-white/10 bg-slate-950/70 p-5 backdrop-blur-sm"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div
                    className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border"
                    style={{ background: `${color}18`, borderColor: `${color}40` }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <p className="mb-2 font-mono text-sm font-bold text-slate-100">{title}</p>
                  <p className="font-mono text-[11px] leading-relaxed text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-cyan-400/10 via-transparent to-amber-400/10 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-black/70 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-sm">
              <Entropy
                size={entropySize}
                className="max-w-full rounded-[1.5rem] border border-white/10"
              />
              <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-slate-500">
                    Order / chaos boundary
                  </p>
                  <p className="mt-1 font-mono text-sm text-slate-300">
                    Defense signals stabilize trusted data paths in real time.
                  </p>
                </div>
                <ShieldCheck size={18} className="light-glow text-emerald-300" />
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[0.32em] text-slate-600 md:flex-row md:items-center md:justify-between">
          <span>Built on Google Cloud - Document AI - Vertex AI - Model Armor</span>
          <span>SecureFlow keeps the model path as trusted as the payment path</span>
        </footer>
      </div>
    </div>
  )
}
