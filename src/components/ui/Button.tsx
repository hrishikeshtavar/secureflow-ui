import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'attack'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary:   'bg-amber-500 hover:bg-amber-400 text-black font-semibold border border-amber-400',
  secondary: 'bg-surface-alt hover:bg-border text-slate-300 border border-border-bright',
  ghost:     'bg-transparent hover:bg-surface-alt text-slate-400 hover:text-slate-200 border border-transparent',
  danger:    'bg-red-900/40 hover:bg-red-900/70 text-red-400 border border-red-500/30',
  attack:    'bg-red-950 hover:bg-red-900 text-red-300 border border-red-500/50 animate-pulse-slow',
}

const sizes = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-6 py-3',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center gap-2 rounded font-mono tracking-wide transition-colors cursor-pointer',
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
