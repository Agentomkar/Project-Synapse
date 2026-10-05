import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Overview from './pages/Overview.jsx'
import Devices from './pages/Devices.jsx'
import Threats from './pages/Threats.jsx'
import Predictions from './pages/Predictions.jsx'
import Approvals from './pages/Approvals.jsx'
import Traffic from './pages/Traffic.jsx'
import MLMetrics from './pages/MLMetrics.jsx'
import Audit from './pages/Audit.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="devices" element={<Devices />} />
        <Route path="threats" element={<Threats />} />
        <Route path="predictions" element={<Predictions />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="traffic" element={<Traffic />} />
        <Route path="ml" element={<MLMetrics />} />
        <Route path="audit" element={<Audit />} />
      </Route>
    </Routes>
  )
}
