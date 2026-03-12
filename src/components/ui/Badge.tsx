import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'pass' | 'warn' | 'blocked' | 'info' | 'outline'
  size?: 'sm' | 'md'
  className?: string
}

const variants = {
  default:  'text-slate-300 bg-slate-800 border-slate-700',
  pass:     'text-emerald-400 bg-emerald-900/40 border-emerald-500/30',
  warn:     'text-amber-400 bg-amber-900/40 border-amber-500/30',
  blocked:  'text-red-400 bg-red-900/40 border-red-500/30',
  info:     'text-blue-400 bg-blue-900/40 border-blue-500/30',
  outline:  'text-slate-400 bg-transparent border-slate-600',
}

const sizes = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-mono font-semibold tracking-wider border rounded',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}
