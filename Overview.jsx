import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Card, Badge } from '../components/Card.jsx'
import NetworkBackground from '../components/NetworkBackground.jsx'
import { Spotlight, GridPattern, GlowCard } from '../components/Effects.jsx'
import { AlertTriangle, Zap, Brain, Shield, Activity } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Link } from 'react-router-dom'

export default function Overview() {
  const [data, setData] = useState(null)
  const [traffic, setTraffic] = useState([])
  const [anomalyStats, setAnomalyStats] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [approvals, setApprovals] = useState([])

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  async function load() {
    try {
      const [o, tr, as, p, ap] = await Promise.all([
        api.overview(), api.trafficTimeseries(12),
        api.anomalyStats(), api.predictions(), api.approvals()
      ])
      setData(o); setTraffic(tr); setAnomalyStats(as); setPredictions(p); setApprovals(ap)
    } catch (e) { console.error(e) }
  }

  if (!data) return <div className="p-8 text-muted">Loading SYNAPSE…</div>

  return (
    <div className="relative">
      {/* HERO section with 3D network */}
      <section className="relative h-[380px] overflow-hidden border-b border-border">
        <NetworkBackground />
        <GridPattern />
        <Spotlight />

        <div className="relative z-10 h-full flex flex-col justify-center px-8 py-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="status-dot bg-matrix" style={{color:'#00FF88'}} />
            <span className="text-xs font-mono text-matrix uppercase tracking-widest">System Operational</span>
            <span className="text-xs text-muted font-mono ml-2">• {new Date(data.timestamp).toLocaleString()}</span>
          </div>

          <h1 className="text-5xl font-bold text-text mb-2 glow-cyan">
            SYNAPSE<span className="text-cyan-glow">.</span>
          </h1>
          <p className="text-sm text-muted font-mono max-w-2xl mb-6">
            AI-powered Network Decision Support System · Monitoring {data.total_devices} devices across 8 VLANs ·
            Dual-model orchestrator with human-in-the-loop approval
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl">
            <HeroKPI label="Devices" value={data.total_devices} sub={`${data.active_devices} active`} icon={Activity} color="cyan-glow" />
            <HeroKPI label="Threats" value={data.active_anomalies} sub={`${data.critical_anomalies} critical`} icon={Shield} color={data.critical_anomalies > 0 ? 'danger' : 'matrix'} />
            <HeroKPI label="Pending" value={data.pending_approvals} sub="Admin action" icon={AlertTriangle} color="warn" />
            <HeroKPI label="Trust Avg" value={`${data.avg_trust_score}`} sub="/ 100" icon={Brain} color="matrix" />
          </div>
        </div>
      </section>

      <div className="p-6 space-y-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Network Traffic (12h)" subtitle="Bandwidth per VLAN in Mbps" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={traffic}>
                <defs>
                  <linearGradient id="g30" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00FF88" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#00FF88" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g70" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF3860" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#FF3860" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g40" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFB800" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#FFB800" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#8B9BB4" style={{ fontSize: 11 }} />
                <YAxis stroke="#8B9BB4" style={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#141A28', border: '1px solid #1F2937', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="vlan_30" stroke="#00FF88" fill="url(#g30)" name="Student (30)" />
                <Area type="monotone" dataKey="vlan_70" stroke="#FF3860" fill="url(#g70)" name="Exam (70)" />
                <Area type="monotone" dataKey="vlan_40" stroke="#FFB800" fill="url(#g40)" name="Classroom (40)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Threat Breakdown" subtitle="By severity (last 24h)">
            {anomalyStats && (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={anomalyStats.by_severity}
                    dataKey="count"
                    nameKey="severity"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {anomalyStats.by_severity.map((e, i) => (
                      <Cell key={i} fill={{ critical: '#FF3860', high: '#FFB800', medium: '#00F0FF', low: '#8B9BB4' }[e.severity]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#141A28', border: '1px solid #1F2937', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {anomalyStats?.by_severity.map(s => (
                <Badge key={s.severity} variant={s.severity}>{s.severity} · {s.count}</Badge>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlowCard>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-text uppercase tracking-wider">AI Predictions</h3>
                <p className="text-xs text-muted mt-1">Random Forest · 15-min horizon</p>
              </div>
              <Link to="/predictions" className="text-xs text-cyan-glow hover:underline">View all →</Link>
            </div>
            <div className="space-y-3">
              {predictions.slice(0, 3).map(p => (
                <div key={p.id} className="p-3 bg-panel2 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-cyan-glow" />
                      <span className="text-sm font-semibold">{p.target}</span>
                    </div>
                    <Badge variant={p.time_to_event_min < 10 ? 'critical' : 'high'}>
                      {p.time_to_event_min.toFixed(1)} min
                    </Badge>
                  </div>
                  <div className="text-xs text-muted">{p.recommended_action}</div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-muted">
                    <span>Confidence: <span className="text-cyan-glow">{(p.confidence * 100).toFixed(0)}%</span></span>
                    <span>Load: <span className="text-warn">{p.current_load_pct}%</span></span>
                  </div>
                </div>
              ))}
            </div>
          </GlowCard>

          <GlowCard>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-text uppercase tracking-wider">Pending Approvals</h3>
                <p className="text-xs text-muted mt-1">Human-in-the-loop queue</p>
              </div>
              <Link to="/approvals" className="text-xs text-cyan-glow hover:underline">Decide →</Link>
            </div>
            <div className="space-y-3">
              {approvals.slice(0, 3).map(a => (
                <div key={a.id} className="p-3 bg-panel2 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-warn" />
                      <span className="text-sm font-semibold uppercase tracking-wide">{a.action_type}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted">{a.source_type}</span>
                  </div>
                  <div className="text-xs text-cyan-glow font-mono mb-1">{a.target}</div>
                  <div className="text-xs text-muted line-clamp-2">{a.reasoning}</div>
                </div>
              ))}
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  )
}

function HeroKPI({ label, value, sub, icon: Icon, color = 'cyan-glow' }) {
  const colorMap = {
    'cyan-glow': 'text-cyan-glow',
    'danger': 'text-danger',
    'matrix': 'text-matrix',
    'warn': 'text-warn',
  }
  return (
    <div className="bg-panel/80 backdrop-blur-sm border border-border rounded-lg p-3 fade-in">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted uppercase tracking-widest font-mono">{label}</span>
        <Icon size={12} className={colorMap[color]} />
      </div>
      <div className={`text-2xl font-bold ${colorMap[color]} glow-cyan`}>{value}</div>
      <div className="text-[10px] text-muted font-mono mt-0.5">{sub}</div>
    </div>
  )
}
