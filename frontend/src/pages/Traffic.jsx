import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Card } from '../components/Card.jsx'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'

const VLAN_META = {
  10: { name: 'Admin / ERP', color: '#00F0FF' },
  20: { name: 'Faculty', color: '#67E8F9' },
  30: { name: 'Students Wi-Fi', color: '#00FF88' },
  40: { name: 'Smart Classrooms', color: '#A78BFA' },
  50: { name: 'CCTV / AI Surveillance', color: '#B91C1C' },
  60: { name: 'IoT Labs', color: '#F472B6' },
  70: { name: 'Online Exams', color: '#FF3860' },
  80: { name: 'Guest', color: '#8B9BB4' },
}

export default function Traffic() {
  const [timeseries, setTimeseries] = useState([])
  const [current, setCurrent] = useState([])
  const [hours, setHours] = useState(24)

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [hours])

  async function load() {
    const [ts, cur] = await Promise.all([
      api.trafficTimeseries(hours),
      api.trafficCurrent()
    ])
    setTimeseries(ts)
    setCurrent(cur)
  }

  const totalBw = current.reduce((s, c) => s + c.bandwidth_mbps, 0)
  const totalDevices = current.reduce((s, c) => s + c.active_devices, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold glow-cyan text-text">Network Traffic</h1>
          <p className="text-sm text-muted mt-1 font-mono">
            Live telemetry · {totalBw.toFixed(0)} Mbps aggregate · {totalDevices} active devices
          </p>
        </div>
        <select
          value={hours}
          onChange={e => setHours(+e.target.value)}
          className="bg-panel border border-border rounded-lg px-3 py-2 text-sm text-text focus:border-cyan-glow outline-none"
        >
          <option value={6}>Last 6h</option>
          <option value={12}>Last 12h</option>
          <option value={24}>Last 24h</option>
        </select>
      </div>

      {/* Per-VLAN current state */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {current.map(c => {
          const meta = VLAN_META[c.vlan] || { name: `VLAN ${c.vlan}`, color: '#8B9BB4' }
          return (
            <div key={c.vlan} className="cyber-card p-4 fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-muted uppercase tracking-widest font-mono">{meta.name}</div>
                <div className="text-[10px] font-mono" style={{ color: meta.color }}>VLAN {c.vlan}</div>
              </div>
              <div className="text-xl font-bold" style={{ color: meta.color }}>
                {c.bandwidth_mbps.toFixed(0)} <span className="text-xs text-muted font-normal">Mbps</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-muted mt-2">
                <span>Latency: {c.latency_ms}ms</span>
                <span>Loss: {c.packet_loss_pct}%</span>
              </div>
              <div className="text-[10px] font-mono text-muted mt-1">
                {c.active_devices} devices
              </div>
            </div>
          )
        })}
      </div>

      {/* Timeseries chart */}
      <Card title={`Bandwidth per VLAN (${hours}h)`} subtitle="Mbps over time">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={timeseries}>
            <XAxis dataKey="time" stroke="#8B9BB4" style={{ fontSize: 11 }} />
            <YAxis stroke="#8B9BB4" style={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#141A28', border: '1px solid #1F2937', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {Object.entries(VLAN_META).map(([vlan, meta]) => (
              <Line
                key={vlan}
                type="monotone"
                dataKey={`vlan_${vlan}`}
                stroke={meta.color}
                strokeWidth={2}
                dot={false}
                name={meta.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Current bandwidth bar comparison */}
      <Card title="Current Load Comparison" subtitle="Mbps right now per VLAN">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={current.map(c => ({
            name: `VLAN ${c.vlan}`,
            bandwidth: c.bandwidth_mbps,
            fill: VLAN_META[c.vlan]?.color || '#8B9BB4'
          }))}>
            <XAxis dataKey="name" stroke="#8B9BB4" style={{ fontSize: 11 }} />
            <YAxis stroke="#8B9BB4" style={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#141A28', border: '1px solid #1F2937', borderRadius: 8 }} />
            <Bar dataKey="bandwidth" radius={[6, 6, 0, 0]}>
              {current.map((c, i) => (
                <text key={i} x={0} y={0} fill={VLAN_META[c.vlan]?.color || '#8B9BB4'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
