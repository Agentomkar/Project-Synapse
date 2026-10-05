const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function get(path) {
  const r = await fetch(`${API_BASE}${path}`)
  if (!r.ok) throw new Error(`API ${path}: ${r.status}`)
  return r.json()
}

async function post(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!r.ok) throw new Error(`API ${path}: ${r.status}`)
  return r.json()
}

export const api = {
  overview: () => get('/api/overview'),
  devices: (params = '') => get(`/api/devices${params}`),
  deviceStats: () => get('/api/devices/stats'),
  anomalies: (params = '') => get(`/api/anomalies${params}`),
  anomalyStats: () => get('/api/anomalies/stats'),
  predictions: () => get('/api/predictions'),
  approvals: (status = 'pending') => get(`/api/approvals?status=${status}`),
  decide: (id, decision) => post(`/api/approvals/${id}/decide`, { decision }),
  trafficTimeseries: (hours = 24) => get(`/api/traffic/timeseries?hours=${hours}`),
  trafficCurrent: () => get('/api/traffic/current'),
  audit: (limit = 20) => get(`/api/audit?limit=${limit}`),
  mlMetrics: () => get('/api/ml/metrics'),
  scoreAnomaly: (features) => post('/api/ml/score-anomaly', features),
  predictFailure: (features) => post('/api/ml/predict-failure', features),
}
