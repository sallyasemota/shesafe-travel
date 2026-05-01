import { useState } from 'react'
import { useCheckInActions } from '../hooks/useCheckInActions'
import { useNow } from '../hooks/useNow'
import { computeVisualStatus } from '../lib/tripStatus'
import type { Trip } from '../types/trip'

type DemoTone = 'emerald' | 'yellow' | 'orange' | 'red'

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
  const now = useNow(1000)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  // Active demo button reflects the trip's current visual status, so the
  // highlight matches what the rest of the page is actually rendering —
  // including when the cascade auto-progresses (yellow→orange→red).
  const visualStatus = computeVisualStatus(trip, now)
  const activeKey: 'green' | 'yellow' | 'orange' | 'red' | null =
    visualStatus === 'green'
      ? 'green'
      : visualStatus === 'yellow'
        ? 'yellow'
        : visualStatus === 'orange'
          ? 'orange'
          : visualStatus === 'red'
            ? 'red'
            : null

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
    // Insert a real check-in row first so the page's "most recent check-in"
    // record (used by the message bubble) and the trip's last_check_in
    // (used by the status badge) point at the SAME event with the SAME
    // timestamp. Without this, clicking Green updated only the trip and
    // the bubble caption kept showing the old synthetic baseline time.
    await actions.checkIn('All good, just checking in 💛')
    await actions.startTimer(4 * 60 * 60_000)
  })

  const triggerYellow = run('yellow', async () => {
    const now = Date.now()
    // 62s window, 50s elapsed → ≥80% → yellow
    await actions.setTimerWindow(new Date(now - 50_000), new Date(now + 12_000))
  })

  const triggerOrange = run('orange', async () => {
    const now = Date.now()
    // 6-minute timer, expired 30s ago. Duration ≥ 5min → grace is 15min,
    // so the orange window stays open ~14.5 min and won't silently roll
    // into red while a judge is reading the page.
    await actions.setTimerWindow(
      new Date(now - 6 * 60_000 - 30_000),
      new Date(now - 30_000),
    )
  })

  const triggerRed = run('red', async () => {
    const now = Date.now()
    // 10s timer, expired 50s ago. Grace = 2.5s. 50s ≫ 2.5s → red.
    await actions.setTimerWindow(new Date(now - 60_000), new Date(now - 50_000))
  })

  if (collapsed) {
    return (
      <div className="px-4 sm:px-6 pt-5">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gold/30 border border-gold/60 text-navy/80 text-xs font-semibold uppercase tracking-[0.2em] px-4 py-2.5 hover:bg-gold/40 transition-colors"
          >
            <span aria-hidden>🎬</span>
            Show demo controls
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 pt-5">
      <div className="max-w-2xl mx-auto rounded-3xl bg-gold/20 border-2 border-dashed border-gold/70 shadow-[0_2px_30px_rgba(242,204,143,0.15)] p-6 sm:p-8 space-y-7">
        {/* Frame: this is meta-UI for judges, not the actual product */}
        <div className="flex items-start justify-between gap-3 -mb-2">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.28em] text-navy/60 inline-flex items-center gap-1.5">
            <span aria-hidden>🎬</span>
            Demo controls — for judges
          </p>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="text-[11px] font-semibold text-navy/60 hover:text-navy underline-offset-2 hover:underline transition-colors shrink-0"
          >
            Hide
          </button>
        </div>

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
              active={activeKey === 'green'}
            />
            <DemoButton
              onClick={triggerYellow}
              busy={busy === 'yellow'}
              tone="yellow"
              label="Yellow"
              active={activeKey === 'yellow'}
            />
            <DemoButton
              onClick={triggerOrange}
              busy={busy === 'orange'}
              tone="orange"
              label="Overdue"
              active={activeKey === 'orange'}
            />
            <DemoButton
              onClick={triggerRed}
              busy={busy === 'red'}
              tone="red"
              label="Alert"
              active={activeKey === 'red'}
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
      className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream focus-visible:ring-orange-400/60 ${
        active
          ? 'bg-orange-500 text-white border-orange-500 shadow-[0_4px_18px_rgba(249,115,22,0.30)]'
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
        className={`text-[11px] font-medium tracking-wide ${active ? 'text-white/85' : 'text-navy/55'}`}
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
  DemoTone,
  {
    idle: string
    hover: string
    dot: string
    activeDot: string
    activeFill: string
    ring: string
  }
> = {
  emerald: {
    idle: 'bg-white text-emerald-900 border-emerald-300',
    hover: 'hover:bg-emerald-50 hover:border-emerald-400',
    dot: 'bg-emerald-500',
    activeDot: 'bg-white',
    activeFill: 'bg-emerald-500 text-white border-emerald-500 shadow-[0_4px_14px_rgba(16,185,129,0.30)]',
    ring: 'focus-visible:ring-emerald-400',
  },
  yellow: {
    idle: 'bg-white text-yellow-900 border-yellow-300',
    hover: 'hover:bg-yellow-50 hover:border-yellow-400',
    dot: 'bg-yellow-500',
    activeDot: 'bg-white',
    activeFill: 'bg-amber-500 text-white border-amber-500 shadow-[0_4px_14px_rgba(245,158,11,0.30)]',
    ring: 'focus-visible:ring-yellow-400',
  },
  orange: {
    idle: 'bg-white text-orange-900 border-orange-300',
    hover: 'hover:bg-orange-50 hover:border-orange-400',
    dot: 'bg-orange-500',
    activeDot: 'bg-white',
    activeFill: 'bg-orange-500 text-white border-orange-500 shadow-[0_4px_14px_rgba(249,115,22,0.30)]',
    ring: 'focus-visible:ring-orange-400',
  },
  red: {
    idle: 'bg-white text-red-900 border-red-300',
    hover: 'hover:bg-red-50 hover:border-red-400',
    dot: 'bg-red-600',
    activeDot: 'bg-white',
    activeFill: 'bg-red-600 text-white border-red-600 shadow-[0_4px_14px_rgba(220,38,38,0.30)]',
    ring: 'focus-visible:ring-red-400',
  },
}

function DemoButton({
  onClick,
  busy,
  tone,
  label,
  active,
}: {
  onClick: () => void
  busy: boolean
  tone: DemoTone
  label: string
  active: boolean
}) {
  const styles = TONE_STYLES[tone]
  const visual = active
    ? `${styles.activeFill} ${styles.ring}`
    : `${styles.idle} ${styles.hover} ${styles.ring}`
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={active}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${visual}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${active ? styles.activeDot : styles.dot}`}
        aria-hidden
      />
      {busy ? 'Setting…' : label}
    </button>
  )
}
