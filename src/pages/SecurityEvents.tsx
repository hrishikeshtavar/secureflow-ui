import { useEffect } from 'react'
import { Shield } from 'lucide-react'
import { Card, CardHeader, CardBody, Spinner } from '@/components/ui/Card'
import { EventFeed } from '@/components/security/EventFeed'
import { useSecurityStore } from '@/store'

export default function SecurityEvents() {
  const { events, isLoading, unreadCount, fetchEvents, markAllRead } = useSecurityStore()

  useEffect(() => {
    fetchEvents()
    markAllRead()
  }, [fetchEvents, markAllRead])

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono font-bold text-lg text-slate-200 flex items-center gap-2">
            <Shield size={18} className="text-amber-400" />
            Security Events
          </h1>
          <p className="font-mono text-xs text-slate-500 mt-0.5">
            Canary Layer — real-time input/output monitoring log
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="font-mono text-xs text-red-400 bg-red-900/30 border border-red-500/30 px-2 py-1 rounded">
            {unreadCount} new event{unreadCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <Card>
        <CardHeader>
          <span className="font-mono text-xs text-slate-500 tracking-widest">
            EVENT LOG — {events.length} events
          </span>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <EventFeed events={events} limit={50} />
          )}
        </CardBody>
      </Card>
    </div>
  )
}
