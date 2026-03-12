import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#080D14] flex items-center justify-center">
      <div className="text-center">
        <p className="font-mono text-6xl font-black text-border mb-4">404</p>
        <p className="font-mono text-sm text-slate-500 mb-8">Route not found</p>
        <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    </div>
  )
}
