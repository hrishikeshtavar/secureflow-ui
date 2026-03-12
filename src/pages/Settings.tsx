import { Settings } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="font-mono font-bold text-lg text-slate-200 flex items-center gap-2">
          <Settings size={18} className="text-amber-400" />
          Settings
        </h1>
        <p className="font-mono text-xs text-slate-500 mt-0.5">
          Platform configuration and API integration settings
        </p>
      </div>
      <Card>
        <CardHeader>
          <span className="font-mono text-xs text-slate-500 tracking-widest">GCP CONFIGURATION</span>
        </CardHeader>
        <CardBody className="space-y-4 text-xs font-mono text-slate-500">
          {[
            ['API Base URL',      import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'],
            ['Document AI',       'Invoice Parser v1 — europe-west2'],
            ['Gemini Model',      'gemini-2.5-flash'],
            ['Model Armor',       'Enabled'],
            ['Cloud DLP',         'Enabled'],
            ['Demo Mode',         import.meta.env.VITE_DEMO_MODE === 'true' ? 'ON' : 'OFF'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-border pb-3">
              <span className="text-slate-600">{label}</span>
              <span className="text-slate-300">{value}</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}
