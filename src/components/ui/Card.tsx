import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: 'none' | 'pass' | 'warn' | 'blocked' | 'brand'
}

const glowColors = {
  none:    '',
  pass:    'shadow-[0_0_16px_rgba(16,185,129,0.12)] border-emerald-500/20',
  warn:    'shadow-[0_0_16px_rgba(245,158,11,0.12)] border-amber-500/20',
  blocked: 'shadow-[0_0_16px_rgba(239,68,68,0.15)] border-red-500/20',
  brand:   'shadow-[0_0_16px_rgba(245,158,11,0.10)] border-amber-500/20',
}

export function Card({ children, className, glow = 'none' }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-surface border border-border rounded-lg',
        glowColors[glow],
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('flex items-center gap-2 px-4 py-3 border-b border-border', className)}>
      {children}
    </div>
  )
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('p-4', className)}>{children}</div>
}

export function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }[size]
  return (
    <svg className={clsx('animate-spin text-amber-400', s)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
