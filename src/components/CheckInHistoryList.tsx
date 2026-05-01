import { useNow } from '../hooks/useNow'
import { formatRelative } from '../lib/tripStatus'
import type { CheckIn } from '../types/trip'
import { SpeechIcon } from './icons'

function formatClock(iso: string, nowMs: number): string {
  const d = new Date(iso)
  const sameDay = new Date(nowMs).toDateString() === d.toDateString()
  return d.toLocaleString('en-US', {
    month: sameDay ? undefined : 'short',
    day: sameDay ? undefined : 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function CheckInHistoryList({
  checkIns,
  travelerName,
}: {
  checkIns: CheckIn[]
  travelerName?: string
}) {
  const now = useNow(60_000)

  if (checkIns.length === 0) {
    return (
      <p className="text-sm text-navy/60 italic">
        No check-ins yet. Once the traveler checks in, you'll see them here.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {checkIns.map((c) => (
        <li key={c.id} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-navy">
              <SpeechIcon className="w-3.5 h-3.5 text-coral/80 shrink-0" />
              {travelerName ? `${travelerName} checked in` : 'Checked in'} at{' '}
              {formatClock(c.created_at, now)}
            </span>
            <span className="text-xs text-navy/55">
              {formatRelative(c.created_at, now)}
            </span>
          </div>
          {c.message && (
            <div className="rounded-xl rounded-tl-md bg-coral/10 border border-coral/25 px-4 py-3 shadow-sm">
              <p className="text-base italic text-navy/90 leading-snug break-words">
                {c.message}
              </p>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
