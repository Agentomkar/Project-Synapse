import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Card, Badge } from '../components/Card.jsx'
import { ShieldAlert, Globe, Zap, Target, Database, Eye } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const TYPE_ICON = {
  rogue_device: Eye, port_scan: Target, dos: Zap,
  mac_spoof: ShieldAlert, data_exfil: Database
}

export default function Threats() {
  const [anomalies, setAnomalies] = useState([])
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('active')
  const [testingResult, setTestingResult] = useState(null)

  useEffect(() => {
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [filter])

  async function load() {
    const [a, s] = await Promise.all([
      api.anomalies(filter === 'active' ? '?resolved=false' : filter === 'resolved' ? '?resolved=true' : ''),
      api.anomalyStats()
    ])
    setAnomalies(a); setStats(s)
  }

  async function liveScan(type) {
    const samples = {
      portscan: { flow_duration_ms: 15000, packet_count: 800, avg_packet_size: 1500, bytes_per_sec: 9000, packets_per_sec: 180, tcp_flag_count: 50, unique_dst_ports: 40, inter_arrival_std: 200 },
      normal: { flow_duration_ms: 800, packet_count: 45, avg_packet_size: 600, bytes_per_sec: 1100, packets_per_sec: 24, tcp_flag_count: 4, unique_dst_ports: 2, inter_arrival_std: 8 },
      dos: { flow_duration_ms: 30000, packet_count: 15000, avg_packet_size: 1200, bytes_per_sec: 25000, packets_per_sec: 500, tcp_flag_count: 80, unique_dst_ports: 1, inter_arrival_std: 0.5 }
    }
    const result = await api.scoreAnomaly(samples[type])
    setTestingResult({ type, result })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold glow-cyan text-text">Threats</h1>
          <p className="text-sm text-muted mt-1 font-mono">Isolation Forest detections · {anomalies.length} shown</p>
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-panel border border-border rounded-lg px-3 py-2 text-sm text-text focus:border-cyan-glow outline-none"
        >
          <option value="active">Active threats</option>
          <option value="resolved">Resolved</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Live ML testing panel */}
      <Card title="Live Anomaly Scoring" subtitle="Test the Isolation Forest model on sample traffic patterns">
        <div className="flex gap-3 mb-4">
          <button onClick={() => liveScan('normal')} className="btn-ghost">▶ Score Normal Traffic</button>
          <button onClick={() => liveScan('portscan')} className="btn-ghost">▶ Score Port Scan</button>
          <button onClick={() => liveScan('dos')} className="btn-ghost">▶ Score DoS Attack</button>
        </div>
        {testingResult && (
          <div className="bg-panel2 border border-border rounded-lg p-4 font-mono text-xs fade-in">
            <div className="text-muted mb-2 uppercase tracking-widest">Input: {testingResult.type}</div>
            <div className={`text-lg font-bold mb-2 ${testingResult.result.is_anomaly ? 'text-danger' : 'text-matrix'}`}>
              {testingResult.result.verdict}
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div><span className="text-muted">Score:</span> <span className="text-text">{testingResult.result.anomaly_score}</span></div>
              <div><span className="text-muted">Confidence:</span> <span className="text-cyan-glow">{(testingResult.result.confidence * 100).toFixed(1)}%</span></div>
              <div><span className="text-muted">Model:</span> <span className="text-text">{testingResult.result.model}</span></div>
            </div>
          </div>
        )}
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Detections (24h)" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.hourly_last_24h}>
                <XAxis dataKey="hour" stroke="#8B9BB4" style={{ fontSize: 10 }} />
                <YAxis stroke="#8B9BB4" style={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#141A28', border: '1px solid #1F2937', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#00F0FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="By Type">
            <div className="space-y-2">
              {stats.by_type.map(t => (
                <div key={t.type} className="flex justify-between items-center p-2 bg-panel2 rounded-lg">
                  <span className="text-xs font-mono uppercase">{t.type.replace('_', ' ')}</span>
                  <Badge>{t.count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Threat list */}
      <Card title="Threat Feed">
        <div className="space-y-3">
          {anomalies.map(a => {
            const Icon = TYPE_ICON[a.anomaly_type] || ShieldAlert
            return (
              <div key={a.id} className="p-4 bg-panel2 rounded-lg border border-border hover:border-cyan-glow/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${a.severity === 'critical' ? 'bg-danger/20' : a.severity === 'high' ? 'bg-warn/20' : 'bg-cyan-glow/20'}`}>
                      <Icon size={16} className={a.severity === 'critical' ? 'text-danger' : a.severity === 'high' ? 'text-warn' : 'text-cyan-glow'} />
                    </div>
                    <div>
                      <div className="font-semibold uppercase tracking-wide text-sm">{a.anomaly_type.replace('_', ' ')}</div>
                      <div className="text-[11px] text-muted font-mono">{a.device_ip} · {a.device_mac}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.severity}>{a.severity}</Badge>
                    {a.resolved && <Badge variant="success">resolved</Badge>}
                  </div>
                </div>
                <p className="text-xs text-muted ml-11">{a.description}</p>
                <div className="flex items-center gap-4 mt-2 ml-11 text-[11px] font-mono text-muted">
                  <span>Confidence: <span className="text-cyan-glow">{(a.confidence * 100).toFixed(0)}%</span></span>
                  <span>Model: <span className="text-text">{a.model_used}</span></span>
                  <span>{new Date(a.detected_at).toLocaleString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
