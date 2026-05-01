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

export function CheckInHistoryList({ checkIns }: { checkIns: CheckIn[] }) {
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
            <span className="text-[15px] font-semibold text-navy">
              Checked in at {formatClock(c.created_at, now)}
            </span>
            <span className="text-xs text-navy/55">
              {formatRelative(c.created_at, now)}
            </span>
          </div>
          {c.message && (
            <div className="rounded-2xl rounded-tl-md bg-coral/10 border border-coral/25 px-4 py-3 flex items-start gap-2.5 shadow-[0_1px_3px_rgba(61,64,91,0.04)]">
              <SpeechIcon className="w-4 h-4 text-coral mt-0.5 shrink-0" />
              <p className="text-[15px] italic text-navy/85 leading-snug break-words">
                {c.message}
              </p>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
