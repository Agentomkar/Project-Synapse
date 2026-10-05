import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Card, Badge } from '../components/Card.jsx'
import { Zap, Wifi, Server, Network, Globe, Clock } from 'lucide-react'

const TYPE_ICON = { ap: Wifi, switch: Server, vlan: Network, isp: Globe }
const TYPE_COLOR = { ap: 'text-cyan-glow', switch: 'text-warn', vlan: 'text-matrix', isp: 'text-danger' }

export default function Predictions() {
  const [preds, setPreds] = useState([])
  const [liveResult, setLiveResult] = useState(null)
  const [form, setForm] = useState({
    hour: new Date().getHours(),
    day_of_week: new Date().getDay(),
    current_load_pct: 65,
    device_count: 450,
    is_exam_period: 1,
    is_class_hour: 1,
    historical_avg_load: 55
  })

  useEffect(() => {
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [])

  async function load() {
    setPreds(await api.predictions())
  }

  async function runPrediction() {
    const r = await api.predictFailure(form)
    setLiveResult(r)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold glow-cyan text-text">Predictions</h1>
        <p className="text-sm text-muted mt-1 font-mono">Random Forest · 15-min horizon · Calendar-aware QoS</p>
      </div>

      {/* Live prediction tester */}
      <Card title="Live Failure Prediction" subtitle="Test the model with custom network conditions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <InputField label="Hour (0-23)" value={form.hour} onChange={v => setForm({...form, hour: +v})} />
          <InputField label="Day of week (0-6)" value={form.day_of_week} onChange={v => setForm({...form, day_of_week: +v})} />
          <InputField label="Current load %" value={form.current_load_pct} onChange={v => setForm({...form, current_load_pct: +v})} />
          <InputField label="Device count" value={form.device_count} onChange={v => setForm({...form, device_count: +v})} />
          <InputField label="Exam period (0/1)" value={form.is_exam_period} onChange={v => setForm({...form, is_exam_period: +v})} />
          <InputField label="Class hour (0/1)" value={form.is_class_hour} onChange={v => setForm({...form, is_class_hour: +v})} />
          <InputField label="Historical avg load" value={form.historical_avg_load} onChange={v => setForm({...form, historical_avg_load: +v})} />
          <div className="flex items-end">
            <button onClick={runPrediction} className="btn-primary w-full">▶ Predict</button>
          </div>
        </div>
        {liveResult && (
          <div className={`p-4 rounded-lg border fade-in font-mono text-xs ${
            liveResult.failure_predicted ? 'bg-danger/10 border-danger/30' : 'bg-matrix/10 border-matrix/30'
          }`}>
            <div className={`text-xl font-bold mb-2 ${liveResult.failure_predicted ? 'text-danger' : 'text-matrix'}`}>
              {liveResult.verdict}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>Failure prob: <span className="text-danger">{(liveResult.failure_probability * 100).toFixed(1)}%</span></div>
              <div>Normal prob: <span className="text-matrix">{(liveResult.normal_probability * 100).toFixed(1)}%</span></div>
              <div>Horizon: <span className="text-cyan-glow">{liveResult.horizon_minutes} min</span></div>
            </div>
          </div>
        )}
      </Card>

      {/* Active predictions */}
      <Card title={`Active Predictions (${preds.length})`} subtitle="Sorted by time-to-event (urgent first)">
        <div className="space-y-3">
          {preds.map(p => {
            const Icon = TYPE_ICON[p.target_type] || Zap
            const urgent = p.time_to_event_min < 10
            return (
              <div key={p.id} className={`p-4 bg-panel2 rounded-lg border transition-colors ${
                urgent ? 'border-danger/30' : 'border-border hover:border-cyan-glow/30'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${urgent ? 'bg-danger/20' : 'bg-cyan-glow/10'}`}>
                      <Icon size={18} className={urgent ? 'text-danger' : TYPE_COLOR[p.target_type]} />
                    </div>
                    <div>
                      <div className="font-semibold text-base">{p.target}</div>
                      <div className="text-[11px] text-muted font-mono uppercase tracking-widest">
                        {p.target_type} · {p.prediction_type}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${urgent ? 'text-danger glow-cyan' : 'text-cyan-glow'}`}>
                      {p.time_to_event_min.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-muted font-mono">min to event</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <MetricBar label="Confidence" value={p.confidence * 100} color="cyan" />
                  <MetricBar label="Current Load" value={p.current_load_pct} color={p.current_load_pct > 80 ? 'danger' : 'warn'} />
                  <div className="flex items-end gap-1 text-[10px] font-mono text-muted">
                    <Clock size={10} />
                    {new Date(p.predicted_at).toLocaleTimeString()}
                  </div>
                </div>

                <div className="bg-bg/40 rounded p-2 border-l-2 border-cyan-glow">
                  <div className="text-[10px] text-muted uppercase tracking-widest mb-1">Recommended Action</div>
                  <div className="text-sm text-text">{p.recommended_action}</div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function InputField({ label, value, onChange }) {
  return (
    <div>
      <div className="text-[10px] text-muted uppercase tracking-widest mb-1 font-mono">{label}</div>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-panel2 border border-border rounded px-3 py-2 text-sm text-text focus:border-cyan-glow outline-none font-mono"
      />
    </div>
  )
}

function MetricBar({ label, value, color }) {
  const colorMap = { cyan: 'bg-cyan-glow', warn: 'bg-warn', danger: 'bg-danger', matrix: 'bg-matrix' }
  return (
    <div>
      <div className="flex justify-between text-[10px] font-mono mb-1">
        <span className="text-muted uppercase tracking-widest">{label}</span>
        <span className="text-text">{value.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-bg rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[color]}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
