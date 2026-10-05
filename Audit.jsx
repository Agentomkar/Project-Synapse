import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Card } from '../components/Card.jsx'
import {
  Terminal, UserCheck, ShieldAlert, Zap, Brain,
  Globe, Lock, Activity
} from 'lucide-react'

const EVENT_ICON = {
  device_joined: UserCheck,
  anomaly_detected: ShieldAlert,
  admin_action: UserCheck,
  prediction_fired: Zap,
  model_retrained: Brain,
  isp_failover: Globe,
  device_quarantined: Lock,
  qos_boost: Activity,
}

const EVENT_COLOR = {
  device_joined: 'text-matrix',
  anomaly_detected: 'text-danger',
  admin_action: 'text-cyan-glow',
  prediction_fired: 'text-warn',
  model_retrained: 'text-cyan-glow',
  isp_failover: 'text-warn',
  device_quarantined: 'text-danger',
  qos_boost: 'text-matrix',
}

export default function Audit() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [])

  async function load() {
    setLogs(await api.audit(50))
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold glow-cyan text-text">Audit Log</h1>
        <p className="text-sm text-muted mt-1 font-mono">
          Immutable event stream · {logs.length} events shown
        </p>
      </div>

      <Card>
        <div className="font-mono text-xs">
          {logs.map((log, i) => {
            const Icon = EVENT_ICON[log.event_type] || Terminal
            return (
              <div key={log.id} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0 hover:bg-panel2/30 px-2 -mx-2 rounded transition-colors fade-in">
                <div className="text-muted min-w-[140px]">
                  [{new Date(log.timestamp).toLocaleString('en-GB', { hour12: false })}]
                </div>
                <Icon size={14} className={`${EVENT_COLOR[log.event_type] || 'text-muted'} mt-0.5 flex-shrink-0`} />
                <div className={`font-semibold uppercase tracking-wider min-w-[160px] ${EVENT_COLOR[log.event_type] || 'text-text'}`}>
                  {log.event_type.replace(/_/g, '_')}
                </div>
                <div className="text-muted min-w-[180px] truncate">{log.actor}</div>
                <div className="text-text flex-1">{log.details}</div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
