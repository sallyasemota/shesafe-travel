import { useNow } from '../hooks/useNow'
import { formatRelative } from '../lib/tripStatus'
import type { CheckIn } from '../types/trip'

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
    <ul className="space-y-2">
      {checkIns.map((c) => (
        <li
          key={c.id}
          className="rounded-lg bg-cream/50 border border-gold/30 px-3 py-2.5"
        >
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-[15px] font-semibold text-navy">
              Checked in at {formatClock(c.created_at, now)}
            </span>
            <span className="text-xs text-navy/50">
              {formatRelative(c.created_at, now)}
            </span>
          </div>
          {c.message && (
            <p className="text-[15px] text-navy/80 mt-1 break-words">
              "{c.message}"
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
