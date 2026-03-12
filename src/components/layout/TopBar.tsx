import { AlertTriangle, Activity } from 'lucide-react'
import { useSecurityStore } from '@/store'

export default function TopBar() {
  const { alertActive, alertEvent, dismissAlert } = useSecurityStore()

  return (
    <>
      {/* Main topbar */}
      <header className="h-14 flex items-center justify-between px-5 bg-surface border-b border-border">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-slate-500 tracking-widest">LIVE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-600">
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <div className="w-px h-4 bg-border" />
          <span className="text-xs font-mono text-slate-600">GCP: europe-west2</span>
        </div>
      </header>

      {/* Attack alert banner */}
      {alertActive && alertEvent && (
        <div className="bg-red-950 border-b border-red-500/40 px-5 py-2.5 flex items-center gap-3 animate-fade-in">
          <AlertTriangle size={14} className="text-red-400 flex-shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0">
            <span className="text-red-400 font-mono font-bold text-xs tracking-wider mr-2">
              SECURITY ALERT
            </span>
            <span className="text-red-300 text-xs font-mono truncate">
              {alertEvent.detail}
            </span>
          </div>
          <button
            onClick={dismissAlert}
            className="text-red-600 hover:text-red-300 font-mono text-xs shrink-0"
          >
            DISMISS
          </button>
        </div>
      )}
    </>
  )
}
