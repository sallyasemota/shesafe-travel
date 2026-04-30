import { useState } from 'react'
import { useCheckInActions } from '../hooks/useCheckInActions'
import type { Trip } from '../types/trip'

export function DemoBanner({ trip }: { trip: Trip }) {
  const actions = useCheckInActions(trip)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = (key: string, fn: () => Promise<void>) => async () => {
    if (busy) return
    setError(null)
    setBusy(key)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update demo state.')
    } finally {
      setBusy(null)
    }
  }

  // All four buttons drive the existing realtime path — page reacts via the
  // same hook every viewer uses, so the demo shows the real product.
  const resetGreen = run('green', async () => {
    await actions.startTimer(4 * 60 * 60_000)
  })

  const triggerYellow = run('yellow', async () => {
    const now = Date.now()
    // 62s window, 50s elapsed → ≥80% → yellow
    await actions.setTimerWindow(new Date(now - 50_000), new Date(now + 12_000))
  })

  const triggerOrange = run('orange', async () => {
    const now = Date.now()
    // 80s timer, expired 8s ago. Original duration = 80s ≥ 60s → grace = 25%
    // capped at 30s = 20s. Elapsed-since-expiry 8s < 20s → orange.
    await actions.setTimerWindow(new Date(now - 80_000), new Date(now - 8_000))
  })

  const triggerRed = run('red', async () => {
    const now = Date.now()
    // 10s timer, expired 50s ago. Grace = 25% × 10s = 2.5s. 50s ≫ 2.5s → red.
    await actions.setTimerWindow(new Date(now - 60_000), new Date(now - 50_000))
  })

  return (
    <div className="px-4 sm:px-6 pt-5">
      <div className="max-w-2xl mx-auto rounded-2xl bg-gold/15 border border-gold/50 p-5 sm:p-6 space-y-5">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral">
            Live demo
          </p>
          <h2 className="font-serif font-medium text-2xl sm:text-3xl leading-tight tracking-tight text-navy">
            What is{' '}
            <span className="italic text-coral">SheSafe Travel?</span>
          </h2>
          <p className="text-sm sm:text-[15px] text-navy/80 leading-relaxed">
            A real-time safety companion for women who travel solo. One
            shareable link — no app, no login — keeps the people who love you
            in the loop with a live check-in countdown, an AI safety briefing
            tailored to your destination, and tap-to-call emergency contacts.
            Built for Women Build AI Build-A-Thon 2026.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-2">
            <FeaturePill>Live check-in timer</FeaturePill>
            <FeaturePill>AI safety briefing</FeaturePill>
            <FeaturePill>Emergency contacts</FeaturePill>
            <FeaturePill>Offline PDF packets</FeaturePill>
          </div>
        </div>

        <div className="border-t border-gold/40 pt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy/55">
            What this page is
          </p>
          <p className="text-sm text-navy/80 leading-relaxed">
            Exactly what your{' '}
            <span className="italic">mom</span> sees during your trip — the
            same live page she'd open from the link you texted her. Every
            change appears in real time on every open device.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy/55">
            Try the cascade instantly
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <DemoButton
              onClick={resetGreen}
              busy={busy === 'green'}
              tone="emerald"
              icon="▶"
              label="Green"
            />
            <DemoButton
              onClick={triggerYellow}
              busy={busy === 'yellow'}
              tone="yellow"
              icon="⚠"
              label="Yellow"
            />
            <DemoButton
              onClick={triggerOrange}
              busy={busy === 'orange'}
              tone="orange"
              icon="●"
              label="Overdue"
            />
            <DemoButton
              onClick={triggerRed}
              busy={busy === 'red'}
              tone="red"
              icon="!"
              label="Alert"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <p className="text-xs text-navy/55 italic">
          Demo controls only · won't appear on real trips you create.
        </p>
      </div>
    </div>
  )
}

function FeaturePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/80 border border-gold/40 px-3 py-1 text-xs font-medium text-navy">
      {children}
    </span>
  )
}

const TONE_STYLES: Record<
  'emerald' | 'yellow' | 'orange' | 'red',
  { idle: string; hover: string }
> = {
  emerald: {
    idle: 'bg-white text-emerald-800 border-emerald-300',
    hover: 'hover:bg-emerald-50',
  },
  yellow: {
    idle: 'bg-white text-yellow-800 border-yellow-300',
    hover: 'hover:bg-yellow-50',
  },
  orange: {
    idle: 'bg-white text-orange-800 border-orange-300',
    hover: 'hover:bg-orange-50',
  },
  red: {
    idle: 'bg-white text-red-800 border-red-300',
    hover: 'hover:bg-red-50',
  },
}

function DemoButton({
  onClick,
  busy,
  tone,
  icon,
  label,
}: {
  onClick: () => void
  busy: boolean
  tone: 'emerald' | 'yellow' | 'orange' | 'red'
  icon: string
  label: string
}) {
  const styles = TONE_STYLES[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.idle} ${styles.hover}`}
    >
      <span aria-hidden>{icon}</span>
      {busy ? 'Setting…' : label}
    </button>
  )
}
