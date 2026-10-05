import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Brain, Target, TrendingUp, Database, Zap, Shield, Sparkles, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar } from 'recharts'
import { Spotlight } from '../components/Effects.jsx'

export default function MLMetrics() {
  const [metrics, setMetrics] = useState(null)

  useEffect(() => { api.mlMetrics().then(setMetrics) }, [])

  if (!metrics) return <div className="p-8 text-muted">Loading…</div>

  const iso = metrics.isolation_forest
  const rf = metrics.random_forest

  return (
    <div className="p-6 space-y-6 relative">
      {/* Header with spotlight */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-panel p-6 mb-6">
        <Spotlight fill="#00FF88" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="text-matrix" size={20} />
            <span className="text-xs font-mono text-matrix uppercase tracking-widest">Dual-Model Architecture</span>
          </div>
          <h1 className="text-3xl font-bold glow-cyan text-text mb-2">ML Model Performance</h1>
          <p className="text-sm text-muted max-w-2xl">
            Combining <span className="text-matrix">unsupervised</span> anomaly detection with{' '}
            <span className="text-cyan-glow">supervised</span> failure prediction in a human-approved orchestrator.
            No SDN required — our patent-worthy innovation.
          </p>
        </div>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-6 gap-4 auto-rows-[180px]">

        {/* 1. Isolation Forest Accuracy - large hero tile */}
        <BentoTile className="col-span-3 row-span-2" accent="matrix">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-[10px] text-muted uppercase tracking-widest font-mono mb-1">Isolation Forest</div>
              <div className="text-sm text-muted">Unsupervised Anomaly Detection</div>
            </div>
            <Shield className="text-matrix" size={20} />
          </div>
          <div className="flex items-baseline gap-2 my-4">
            <div className="text-6xl font-bold text-matrix glow-matrix">{(iso.accuracy * 100).toFixed(1)}</div>
            <div className="text-lg text-muted">%</div>
            <div className="text-xs text-muted ml-2">accuracy</div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <MiniStat label="Precision" value={`${(iso.precision * 100).toFixed(0)}%`} />
            <MiniStat label="Recall" value={`${(iso.recall * 100).toFixed(0)}%`} />
            <MiniStat label="F1" value={iso.f1_score.toFixed(2)} />
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 text-[11px] font-mono text-muted">
            Trained on {iso.training_samples} normal samples → Catches rogue devices, port scans, DoS, data exfil
          </div>
        </BentoTile>

        {/* 2. Random Forest Accuracy */}
        <BentoTile className="col-span-3 row-span-2" accent="cyan">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-[10px] text-muted uppercase tracking-widest font-mono mb-1">Random Forest</div>
              <div className="text-sm text-muted">Supervised Failure Prediction</div>
            </div>
            <Zap className="text-cyan-glow" size={20} />
          </div>
          <div className="flex items-baseline gap-2 my-4">
            <div className="text-6xl font-bold text-cyan-glow glow-cyan">{(rf.accuracy * 100).toFixed(1)}</div>
            <div className="text-lg text-muted">%</div>
            <div className="text-xs text-muted ml-2">accuracy</div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <MiniStat label="Precision" value={`${(rf.precision * 100).toFixed(0)}%`} />
            <MiniStat label="Recall" value={`${(rf.recall * 100).toFixed(0)}%`} />
            <MiniStat label="F1" value={rf.f1_score.toFixed(2)} />
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 text-[11px] font-mono text-muted">
            {rf.training_samples} samples · <span className="text-cyan-glow">{rf.prediction_horizon_min}-min</span> prediction horizon
          </div>
        </BentoTile>

        {/* 3. Confusion Matrix - IF */}
        <BentoTile className="col-span-3 row-span-2">
          <div className="text-[10px] text-muted uppercase tracking-widest font-mono mb-3">
            Confusion Matrix — Isolation Forest
          </div>
          <div className="grid grid-cols-2 gap-3 h-[calc(100%-30px)]">
            <ConfusionCell label="True Negative" value={iso.confusion_matrix.TN} color="matrix" />
            <ConfusionCell label="False Positive" value={iso.confusion_matrix.FP} color="warn" />
            <ConfusionCell label="False Negative" value={iso.confusion_matrix.FN} color="danger" />
            <ConfusionCell label="True Positive" value={iso.confusion_matrix.TP} color="cyan-glow" />
          </div>
        </BentoTile>

        {/* 4. Feature Importance */}
        <BentoTile className="col-span-3 row-span-2">
          <div className="text-[10px] text-muted uppercase tracking-widest font-mono mb-2">
            Top Features — Random Forest
          </div>
          <div className="text-xs text-muted mb-3">What drives failure prediction?</div>
          <ResponsiveContainer width="100%" height="75%">
            <BarChart
              layout="vertical"
              data={Object.entries(rf.feature_importance)
                .map(([k, v]) => ({ feature: k.replace(/_/g, ' '), importance: v }))
                .sort((a, b) => a.importance - b.importance)}
              margin={{ left: 10, right: 10 }}
            >
              <XAxis type="number" stroke="#8B9BB4" style={{ fontSize: 10 }} />
              <YAxis dataKey="feature" type="category" stroke="#8B9BB4" style={{ fontSize: 10 }} width={110} />
              <Tooltip contentStyle={{ background: '#141A28', border: '1px solid #1F2937', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                {Object.entries(rf.feature_importance).map((_, i) => (
                  <Cell key={i} fill={`hsl(${180 + i * 15}, 80%, 55%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </BentoTile>

        {/* Methodology tiles */}
        <BentoTile className="col-span-2" accent="cyan">
          <Database size={18} className="text-cyan-glow mb-2" />
          <div className="text-sm font-semibold mb-1">Dataset</div>
          <div className="text-xs text-muted">
            CICIDS2017-style synthetic + campus-pattern temporal data
          </div>
        </BentoTile>

        <BentoTile className="col-span-2">
          <Target size={18} className="text-matrix mb-2" />
          <div className="text-sm font-semibold mb-1">Model Config</div>
          <div className="text-xs text-muted font-mono">
            IF: 150 trees · RF: 200 trees, depth 12
          </div>
        </BentoTile>

        <BentoTile className="col-span-2" accent="matrix">
          <TrendingUp size={18} className="text-matrix mb-2" />
          <div className="text-sm font-semibold mb-1">Retraining Loop</div>
          <div className="text-xs text-muted">
            Admin approvals feed weekly retrain cycle — human-in-the-loop
          </div>
        </BentoTile>

      </div>
    </div>
  )
}

function BentoTile({ children, className = '', accent }) {
  const borderAccent = accent === 'matrix' ? 'border-t-2 border-t-matrix' :
                       accent === 'cyan' ? 'border-t-2 border-t-cyan-glow' : ''
  return (
    <div className={`cyber-card p-4 fade-in ${borderAccent} ${className}`}>
      {children}
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-panel2 rounded px-2 py-1.5 text-center">
      <div className="text-[9px] text-muted uppercase tracking-widest font-mono">{label}</div>
      <div className="text-sm font-bold text-text font-mono">{value}</div>
    </div>
  )
}

function ConfusionCell({ label, value, color }) {
  const colorMap = {
    matrix: 'bg-matrix/10 border-matrix/30 text-matrix',
    warn: 'bg-warn/10 border-warn/30 text-warn',
    danger: 'bg-danger/10 border-danger/30 text-danger',
    'cyan-glow': 'bg-cyan-glow/10 border-cyan-glow/30 text-cyan-glow',
  }
  return (
    <div className={`rounded-lg border p-3 flex flex-col justify-center items-center ${colorMap[color]}`}>
      <div className="text-[9px] text-muted uppercase tracking-widest font-mono mb-1">{label}</div>
      <div className="text-3xl font-bold font-mono">{value}</div>
    </div>
  )
}
