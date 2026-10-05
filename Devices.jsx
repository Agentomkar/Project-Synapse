import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Card, Badge, TrustMeter } from '../components/Card.jsx'
import { Monitor, Smartphone, Cpu, Camera, Shield, Users } from 'lucide-react'

const ICONS = {
  student_laptop: Monitor, faculty_laptop: Monitor, admin_pc: Shield,
  iot_sensor: Cpu, cctv_camera: Camera, exam_terminal: Monitor, guest_phone: Smartphone
}

export default function Devices() {
  const [devices, setDevices] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    const d = await api.devices('?limit=200')
    setDevices(d)
  }

  const filtered = devices.filter(d => {
    if (filter === 'quarantined' && d.status !== 'quarantined') return false
    if (filter === 'low_trust' && d.trust_score >= 50) return false
    if (search && !d.hostname.toLowerCase().includes(search.toLowerCase()) &&
        !d.mac_address.toLowerCase().includes(search.toLowerCase()) &&
        !d.ip_address.includes(search)) return false
    return true
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold glow-cyan text-text">Devices</h1>
          <p className="text-sm text-muted mt-1 font-mono">{devices.length} total · {devices.filter(d => d.status === 'quarantined').length} quarantined</p>
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Search MAC / IP / hostname…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-panel border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-muted focus:border-cyan-glow outline-none w-72 font-mono"
          />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-panel border border-border rounded-lg px-3 py-2 text-sm text-text focus:border-cyan-glow outline-none"
          >
            <option value="all">All devices</option>
            <option value="quarantined">Quarantined</option>
            <option value="low_trust">Low trust (&lt;50)</option>
          </select>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-muted border-b border-border">
              <tr>
                <th className="text-left py-3 px-2">Device</th>
                <th className="text-left py-3 px-2">IP / MAC</th>
                <th className="text-left py-3 px-2">VLAN</th>
                <th className="text-left py-3 px-2">OS</th>
                <th className="text-left py-3 px-2">Trust</th>
                <th className="text-left py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const Icon = ICONS[d.device_type] || Monitor
                return (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-panel2/50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <Icon size={16} className="text-cyan-glow" />
                        <div>
                          <div className="font-semibold">{d.hostname}</div>
                          <div className="text-[11px] text-muted font-mono">{d.user_role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-mono text-xs">
                      <div className="text-text">{d.ip_address}</div>
                      <div className="text-muted">{d.mac_address}</div>
                    </td>
                    <td className="py-3 px-2 font-mono text-cyan-glow">VLAN {d.vlan}</td>
                    <td className="py-3 px-2 text-xs text-muted">{d.os_fingerprint}</td>
                    <td className="py-3 px-2 w-32"><TrustMeter score={d.trust_score} /></td>
                    <td className="py-3 px-2">
                      <Badge variant={d.status === 'active' ? 'success' : d.status === 'quarantined' ? 'critical' : 'medium'}>
                        {d.status}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
