import { useState } from 'react'
import { useCheckInActions } from '../hooks/useCheckInActions'
import type { Trip } from '../types/trip'

export type DemoViewerMode = 'mom' | 'sofia'

export function DemoBanner({
  trip,
  viewerMode,
  onChangeViewerMode,
}: {
  trip: Trip
  viewerMode: DemoViewerMode
  onChangeViewerMode: (mode: DemoViewerMode) => void
}) {
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
    // 80s timer, expired 8s ago. Grace = 25% × 80s = 20s. 8s < 20s → orange.
    await actions.setTimerWindow(new Date(now - 80_000), new Date(now - 8_000))
  })

  const triggerRed = run('red', async () => {
    const now = Date.now()
    // 10s timer, expired 50s ago. Grace = 2.5s. 50s ≫ 2.5s → red.
    await actions.setTimerWindow(new Date(now - 60_000), new Date(now - 50_000))
  })

  return (
    <div className="px-4 sm:px-6 pt-5">
      <div className="max-w-2xl mx-auto rounded-3xl bg-gold/20 border border-gold/60 shadow-[0_2px_30px_rgba(242,204,143,0.15)] p-6 sm:p-8 space-y-7">
        {/* Section 1 — what the product is */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-coral">
            SheSafe Travel · Live demo
          </p>
          <h2 className="font-serif font-semibold text-3xl sm:text-4xl leading-[1.1] tracking-[-0.015em] text-navy">
            See what Maria <span className="italic text-coral">(mom)</span>{' '}
            sees when Sofia travels to Morocco.
          </h2>
          <p className="text-base sm:text-[17px] text-navy/80 leading-relaxed max-w-prose">
            Live check-in countdown, AI safety briefing, tap-to-call emergency
            contacts — all through one shareable link. No app, no login. Built
            for Women Build AI Build-A-Thon 2026.
          </p>
          <ul className="flex flex-wrap gap-1.5 pt-1">
            <FeaturePill>Live check-in timer</FeaturePill>
            <FeaturePill>AI safety briefing</FeaturePill>
            <FeaturePill>Emergency contacts</FeaturePill>
            <FeaturePill>Offline PDF packets</FeaturePill>
          </ul>
        </div>

        {/* Section 2 — what to do here */}
        <div className="border-t border-gold/40 pt-6 space-y-4">
          <p className="text-base text-navy/80 leading-relaxed">
            You're looking at the live page{' '}
            <span className="italic">Maria</span> opened from the link Sofia
            texted her. Right now —{' '}
            <span className="italic text-coral">Sofia's safe</span>, she just
            checked in.
          </p>
          <p className="text-base font-semibold text-navy">
            <span aria-hidden className="mr-1">
              👇
            </span>
            Click through the states to see what happens when a check-in is
            missed.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <DemoButton
              onClick={resetGreen}
              busy={busy === 'green'}
              tone="emerald"
              label="Green"
            />
            <DemoButton
              onClick={triggerYellow}
              busy={busy === 'yellow'}
              tone="yellow"
              label="Yellow"
            />
            <DemoButton
              onClick={triggerOrange}
              busy={busy === 'orange'}
              tone="orange"
              label="Overdue"
            />
            <DemoButton
              onClick={triggerRed}
              busy={busy === 'red'}
              tone="red"
              label="Alert"
            />
          </div>
          {error && (
            <p
              role="alert"
              className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2"
            >
              {error}
            </p>
          )}
          <p className="text-xs text-navy/60 italic">
            Every change appears in real time on every open device. Demo
            controls only · won't appear on trips you create.
          </p>
        </div>

        {/* Section 3 — viewer toggle (mom vs traveler) */}
        <div className="border-t border-gold/40 pt-6 space-y-3">
          <p className="text-sm font-semibold text-navy flex items-center gap-2">
            <span aria-hidden>👀</span>
            Viewing as:
          </p>
          <div
            role="tablist"
            aria-label="Switch between traveler and contact view"
            className="grid grid-cols-2 gap-2"
          >
            <ViewerPill
              active={viewerMode === 'mom'}
              onClick={() => onChangeViewerMode('mom')}
              icon="👀"
              label="Maria (mom)"
              sublabel="What contacts see"
            />
            <ViewerPill
              active={viewerMode === 'sofia'}
              onClick={() => onChangeViewerMode('sofia')}
              icon="📱"
              label="Sofia (traveler)"
              sublabel="The check-in screen"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ViewerPill({
  active,
  onClick,
  icon,
  label,
  sublabel,
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
  sublabel: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream focus-visible:ring-coral/50 ${
        active
          ? 'bg-coral text-cream border-coral shadow-[0_4px_18px_rgba(224,122,95,0.30)]'
          : 'bg-transparent text-coral border-coral hover:bg-coral/5'
      }`}
    >
      <span>
        <span aria-hidden className="mr-1">
          {icon}
        </span>
        {label}
      </span>
      <span
        className={`text-[11px] font-medium tracking-wide ${active ? 'text-cream/80' : 'text-navy/55'}`}
      >
        {sublabel}
      </span>
    </button>
  )
}

function FeaturePill({ children }: { children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center rounded-full bg-white border border-gold/40 px-3 py-1 text-xs font-medium text-navy/85">
      {children}
    </li>
  )
}

const TONE_STYLES: Record<
  'emerald' | 'yellow' | 'orange' | 'red',
  { idle: string; hover: string; dot: string; ring: string }
> = {
  emerald: {
    idle: 'bg-white text-emerald-900 border-emerald-300',
    hover: 'hover:bg-emerald-50 hover:border-emerald-400',
    dot: 'bg-emerald-500',
    ring: 'focus-visible:ring-emerald-400',
  },
  yellow: {
    idle: 'bg-white text-yellow-900 border-yellow-300',
    hover: 'hover:bg-yellow-50 hover:border-yellow-400',
    dot: 'bg-yellow-500',
    ring: 'focus-visible:ring-yellow-400',
  },
  orange: {
    idle: 'bg-white text-orange-900 border-orange-300',
    hover: 'hover:bg-orange-50 hover:border-orange-400',
    dot: 'bg-orange-500',
    ring: 'focus-visible:ring-orange-400',
  },
  red: {
    idle: 'bg-white text-red-900 border-red-300',
    hover: 'hover:bg-red-50 hover:border-red-400',
    dot: 'bg-red-600',
    ring: 'focus-visible:ring-red-400',
  },
}

function DemoButton({
  onClick,
  busy,
  tone,
  label,
}: {
  onClick: () => void
  busy: boolean
  tone: 'emerald' | 'yellow' | 'orange' | 'red'
  label: string
}) {
  const styles = TONE_STYLES[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${styles.idle} ${styles.hover} ${styles.ring}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${styles.dot}`}
        aria-hidden
      />
      {busy ? 'Setting…' : label}
    </button>
  )
}
