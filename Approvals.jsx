import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Card, Badge } from '../components/Card.jsx'
import { CheckCircle2, XCircle, Shield, Zap, Lock, ArrowRightCircle, Clock } from 'lucide-react'

const ACTION_ICON = {
  quarantine: Lock, block: Shield, qos_boost: Zap, reroute: ArrowRightCircle
}

export default function Approvals() {
  const [pending, setPending] = useState([])
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('pending')
  const [processing, setProcessing] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [p, approved, rejected] = await Promise.all([
      api.approvals('pending'),
      api.approvals('approved'),
      api.approvals('rejected')
    ])
    setPending(p)
    setHistory([...approved, ...rejected].sort((a, b) =>
      new Date(b.decided_at || 0) - new Date(a.decided_at || 0)
    ))
  }

  async function decide(id, decision) {
    setProcessing(id)
    try {
      await api.decide(id, decision)
      await load()
    } catch (e) {
      console.error(e)
    }
    setProcessing(null)
  }

  const items = tab === 'pending' ? pending : history

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold glow-cyan text-text">Approvals</h1>
        <p className="text-sm text-muted mt-1 font-mono">
          Human-in-the-loop decision queue · AI recommends, you decide
        </p>
      </div>

      {/* Patent-angle callout */}
      <div className="cyber-card p-4 border-l-4 border-cyan-glow fade-in">
        <div className="flex items-center gap-3">
          <Shield className="text-cyan-glow" size={20} />
          <div>
            <div className="text-sm font-semibold text-text">Why this matters</div>
            <div className="text-xs text-muted mt-1">
              Unlike Cisco DNA Center (fully autonomous), SYNAPSE requires admin approval for every corrective action.
              Each decision is logged and feeds the model retraining loop — making the system smarter over time while
              keeping humans in control. <span className="text-cyan-glow">This is our patent-worthy innovation.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <TabButton active={tab === 'pending'} onClick={() => setTab('pending')} count={pending.length}>
          Pending
        </TabButton>
        <TabButton active={tab === 'history'} onClick={() => setTab('history')} count={history.length}>
          History
        </TabButton>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-center py-12 text-muted">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-matrix" />
            <p className="text-sm">No {tab} approvals</p>
          </div>
        )}
        {items.map(a => {
          const Icon = ACTION_ICON[a.action_type] || Shield
          const isPending = a.status === 'pending'
          return (
            <div key={a.id} className={`cyber-card p-5 fade-in ${
              a.status === 'approved' ? 'border-matrix/30' :
              a.status === 'rejected' ? 'border-danger/30' : ''
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg ${
                    isPending ? 'bg-warn/20' : a.status === 'approved' ? 'bg-matrix/20' : 'bg-danger/20'
                  }`}>
                    <Icon size={18} className={
                      isPending ? 'text-warn' : a.status === 'approved' ? 'text-matrix' : 'text-danger'
                    } />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold uppercase tracking-wide">{a.action_type.replace('_', ' ')}</span>
                      <Badge variant={a.source_type === 'anomaly' ? 'high' : 'medium'}>{a.source_type}</Badge>
                      {!isPending && <Badge variant={a.status === 'approved' ? 'success' : 'critical'}>{a.status}</Badge>}
                    </div>
                    <div className="text-sm text-cyan-glow font-mono mb-2">{a.target}</div>
                    <div className="text-xs text-muted leading-relaxed">{a.reasoning}</div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-muted font-mono">
                  <div className="flex items-center gap-1 justify-end">
                    <Clock size={10} />
                    {new Date(a.created_at).toLocaleTimeString()}
                  </div>
                  {a.decided_by && <div className="mt-1">by {a.decided_by.split('@')[0]}</div>}
                </div>
              </div>

              {isPending && (
                <div className="flex gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => decide(a.id, 'approved')}
                    disabled={processing === a.id}
                    className="btn-primary flex items-center gap-2"
                  >
                    <CheckCircle2 size={14} />
                    {processing === a.id ? 'Processing…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => decide(a.id, 'rejected')}
                    disabled={processing === a.id}
                    className="btn-danger flex items-center gap-2"
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                  <div className="ml-auto text-[11px] text-muted font-mono self-center">
                    → logged for model retraining
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, count, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
        active ? 'text-cyan-glow border-cyan-glow' : 'text-muted border-transparent hover:text-text'
      }`}
    >
      {children} <span className="text-xs opacity-70">({count})</span>
    </button>
  )
}
