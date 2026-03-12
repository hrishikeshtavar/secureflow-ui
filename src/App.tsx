import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppShell from '@/components/layout/AppShell'
import Home from '@/pages/Home'
import Dashboard from '@/pages/Dashboard'
import InvoiceDetail from '@/pages/InvoiceDetail'
import SecurityEvents from '@/pages/SecurityEvents'
import GraphView from '@/pages/GraphView'
import AuditTrail from '@/pages/AuditTrail'
import SettingsPage from '@/pages/Settings'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0D1520',
            color: '#E2EAF4',
            border: '1px solid #1A2C42',
            fontFamily: '"Courier New", monospace',
            fontSize: '12px',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/invoice/:id" element={<InvoiceDetail />} />
          <Route path="/security" element={<SecurityEvents />} />
          <Route path="/graph" element={<GraphView />} />
          <Route path="/audit" element={<AuditTrail />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
