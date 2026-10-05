export function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`cyber-card p-5 fade-in ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-text uppercase tracking-wider">{title}</h3>}
            {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function KPI({ label, value, delta, unit = '', color = 'text-cyan-glow' }) {
  return (
    <div className="cyber-card p-4 fade-in">
      <div className="text-[10px] text-muted uppercase tracking-widest mb-2 font-mono">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className={`text-3xl font-bold ${color} glow-cyan`}>{value}</div>
        {unit && <div className="text-xs text-muted">{unit}</div>}
      </div>
      {delta && (
        <div className="text-xs text-muted mt-1 font-mono">{delta}</div>
      )}
    </div>
  )
}

export function Badge({ children, variant = 'medium' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

export function TrustMeter({ score }) {
  const level = score >= 80 ? 'high' : score >= 50 ? 'med' : 'low'
  return (
    <div>
      <div className="flex justify-between text-[10px] font-mono mb-1">
        <span className="text-muted">TRUST</span>
        <span className={level === 'high' ? 'text-matrix' : level === 'med' ? 'text-warn' : 'text-danger'}>
          {score.toFixed(1)}
        </span>
      </div>
      <div className="trust-bar">
        <div className={`trust-fill trust-${level}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}
