import { ShieldCheck, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'

interface SecureFlowLogoProps {
  compact?: boolean
  className?: string
}

export function SecureFlowLogo({ compact = false, className }: SecureFlowLogoProps) {
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/15 via-sky-400/10 to-amber-400/15 shadow-[0_0_30px_rgba(56,189,248,0.12)]">
        <div className="absolute inset-[5px] rounded-xl border border-white/10 bg-slate-950/90" />
        <ShieldCheck size={20} className="relative z-10 text-cyan-300" />
        <Sparkles size={10} className="light-glow absolute right-1.5 top-1.5 z-10 text-amber-300" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="font-mono text-lg font-black tracking-[0.18em] text-white">SECUREFLOW</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-slate-500">
            Trusted invoice intelligence
          </p>
        </div>
      )}
    </div>
  )
}
