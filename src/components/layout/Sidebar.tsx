import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Shield,
  GitBranch,
  ClipboardList,
  Settings,
  ChevronLeft,
} from 'lucide-react'
import { useSecurityStore, useUIStore } from '@/store'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/security',  icon: Shield,          label: 'Security',  badge: true },
  { to: '/graph',     icon: GitBranch,       label: 'Graph' },
  { to: '/audit',     icon: ClipboardList,   label: 'Audit Trail' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const unreadCount = useSecurityStore((s) => s.unreadCount)

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-surface border-r border-border transition-all duration-200',
        sidebarCollapsed ? 'w-14' : 'w-52'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border min-h-[57px]">
        <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
          <span className="text-amber-400 font-mono font-bold text-xs">SF</span>
        </div>
        {!sidebarCollapsed && (
          <span className="font-mono font-bold text-sm text-slate-200 tracking-wide whitespace-nowrap">
            SecureFlow
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-2 py-2 rounded text-sm font-mono transition-colors group relative',
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-surface-alt border border-transparent'
              )
            }
          >
            <Icon size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span className="whitespace-nowrap">{label}</span>}
            {badge && unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center p-3 border-t border-border text-slate-600 hover:text-slate-300 transition-colors"
      >
        <ChevronLeft
          size={14}
          className={clsx('transition-transform', sidebarCollapsed && 'rotate-180')}
        />
      </button>
    </aside>
  )
}
