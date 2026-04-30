import { useEffect, useState } from 'react'
import { useNow } from '../hooks/useNow'
import { formatCountdown } from '../lib/tripStatus'

export function CheckInWarningOverlay({
  expiresAtIso,
  onCheckIn,
  onAddHour,
  onDismiss,
}: {
  expiresAtIso: string
  onCheckIn: () => void
  onAddHour: () => void
  onDismiss: () => void
}) {
  const now = useNow(1000)
  const expiresMs = new Date(expiresAtIso).getTime()
  const [busy, setBusy] = useState<'checkin' | 'addhour' | null>(null)

  useEffect(() => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 400])
      }
    } catch {
      // vibration unsupported — non-fatal
    }
  }, [])

  const handleCheckIn = async () => {
    if (busy) return
    setBusy('checkin')
    try {
      await onCheckIn()
      onDismiss()
    } finally {
      setBusy(null)
    }
  }

  const handleAddHour = async () => {
    if (busy) return
    setBusy('addhour')
    try {
      await onAddHour()
      onDismiss()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-warning-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div
        className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
        aria-hidden
        onClick={onDismiss}
      />
      <div className="relative w-full max-w-sm rounded-3xl bg-cream border-2 border-yellow-400 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-yellow-100 border-2 border-yellow-400">
          <span className="text-3xl" aria-hidden>
            ⏰
          </span>
        </div>

        <div className="text-center space-y-1">
          <h2
            id="checkin-warning-title"
            className="text-2xl font-bold text-navy"
          >
            Check in soon
          </h2>
          <p className="text-sm text-navy/70">
            Your timer is almost up. Tap below to confirm you're safe — or add
            time if you need it.
          </p>
        </div>

        <div className="rounded-xl bg-white border border-navy/10 px-4 py-3 text-center">
          <p className="text-xs uppercase tracking-wider text-navy/60">
            Time remaining
          </p>
          <p className="font-mono text-3xl font-bold tabular-nums text-yellow-800">
            {formatCountdown(expiresMs, now)}
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleAddHour}
            disabled={!!busy}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-yellow-400 text-navy font-bold text-lg shadow hover:bg-yellow-500 active:scale-[0.98] transition disabled:opacity-50"
          >
            <span aria-hidden>⏰</span>
            {busy === 'addhour' ? 'Adding…' : 'Add 1 hour'}
          </button>
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={!!busy}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-coral text-cream font-semibold shadow hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
          >
            <span aria-hidden>✓</span>
            {busy === 'checkin' ? 'Saving…' : "I'm safe — check in"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            disabled={!!busy}
            className="w-full text-sm text-navy/60 hover:text-navy py-2"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
