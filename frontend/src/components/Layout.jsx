import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Monitor, ShieldAlert, Zap,
  CheckCircle2, Activity, Brain, Terminal
} from 'lucide-react'

const nav = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/devices', label: 'Devices', icon: Monitor },
  { to: '/threats', label: 'Threats', icon: ShieldAlert },
  { to: '/predictions', label: 'Predictions', icon: Zap },
  { to: '/approvals', label: 'Approvals', icon: CheckCircle2 },
  { to: '/traffic', label: 'Traffic', icon: Activity },
  { to: '/ml', label: 'ML Metrics', icon: Brain },
  { to: '/audit', label: 'Audit Log', icon: Terminal },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-panel border-r border-border flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-glow to-cyan-dim flex items-center justify-center text-bg font-bold text-xl shadow-lg shadow-cyan-glow/30">
              S
            </div>
            <div>
              <h1 className="font-bold text-base glow-cyan text-cyan-glow">SYNAPSE</h1>
              <p className="text-[10px] text-muted uppercase tracking-widest">AI Orchestrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-cyan-glow/10 text-cyan-glow border-l-2 border-cyan-glow'
                    : 'text-muted hover:text-text hover:bg-panel2'
                }`
              }
            >
              <Icon size={16} />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-[10px] text-muted uppercase tracking-widest mb-2">System</div>
          <div className="flex items-center gap-2">
            <span className="status-dot bg-matrix" style={{color:'#00FF88'}} />
            <span className="text-xs text-matrix font-mono">OPERATIONAL</span>
          </div>
          <div className="text-[10px] text-muted mt-2 font-mono">v1.0.0 • Kalasalingam U</div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 grid-bg overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
