import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckInHistoryList } from '../components/CheckInHistoryList'
import { CheckInTimer } from '../components/CheckInTimer'
import { CheckInWarningOverlay } from '../components/CheckInWarningOverlay'
import { DemoBanner, type DemoViewerMode } from '../components/DemoBanner'
import { DEMO_SHARE_CODE } from '../lib/demoBriefing'
import { EmergencyActions } from '../components/EmergencyActions'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { TravelerCheckInView } from '../components/TravelerCheckInView'
import { ShareButton } from '../components/ShareButton'
import { TripStatusDisplay } from '../components/TripStatusDisplay'
import { useCheckInActions } from '../hooks/useCheckInActions'
import { useCheckInHistory } from '../hooks/useCheckInHistory'
import { useNow } from '../hooks/useNow'
import { useRealtimeTrip } from '../hooks/useRealtimeTrip'
import {
  computeVisualStatus,
  formatRelative,
  type VisualStatus,
} from '../lib/tripStatus'
import type { RiskLevel, Trip } from '../types/trip'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function isTravelerForCode(shareCode: string | undefined): boolean {
  if (!shareCode || typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(`shesafe:traveler:${shareCode}`) === '1'
  } catch {
    return false
  }
}

export default function TripSafetyPage() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const state = useRealtimeTrip(shareCode)

  if (state.kind === 'loading') return <Loading />
  if (state.kind === 'not-found') return <NotFound />
  return (
    <TripView trip={state.trip} traveler={isTravelerForCode(shareCode)} />
  )
}

function Loading() {
  return (
    <main className="min-h-full bg-cream text-navy flex items-center justify-center px-6">
      <p className="text-navy/70">Loading trip…</p>
    </main>
  )
}

function NotFound() {
  return (
    <main className="min-h-full bg-cream text-navy flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center space-y-4">
        <p className="text-sm uppercase tracking-widest text-coral font-semibold">
          404
        </p>
        <h1 className="text-3xl font-semibold">Trip not found.</h1>
        <p className="text-navy/70">Double-check your link.</p>
        <Link
          to="/"
          className="inline-block mt-2 text-coral font-medium hover:underline"
        >
          Back to SheSafe Travel
        </Link>
      </div>
    </main>
  )
}

// Used as the errorElement for /trip/:shareCode so an unexpected runtime
// error during initial render lands here instead of the global NotFound
// (which made crashes look like 404s, e.g. the Sofia toggle bug).
export function TripErrorFallback() {
  const reload = () => {
    if (typeof window !== 'undefined') window.location.reload()
  }
  return (
    <main className="min-h-full bg-cream text-navy flex flex-col">
      <nav className="border-b border-navy/[0.06]">
        <div className="px-5 sm:px-8 py-4 max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-navy/70 hover:text-coral transition-colors rounded-full px-2 py-1"
          >
            <span aria-hidden>←</span> Home
          </Link>
          <Link
            to="/"
            aria-label="SheSafe Travel home"
            className="font-serif font-medium text-lg tracking-tight hover:opacity-80 transition-opacity"
          >
            SheSafe<span className="italic text-coral"> Travel</span>
          </Link>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-md text-center space-y-4">
          <p className="text-xs uppercase tracking-widest text-coral font-semibold">
            Hmm
          </p>
          <h1 className="font-serif font-medium text-3xl tracking-tight">
            We hit a snag loading this trip.
          </h1>
          <p className="text-navy/70 text-sm leading-relaxed">
            Refreshing usually fixes it. Your trip data is safe in the
            background.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-coral text-cream font-semibold shadow hover:opacity-90 transition"
            >
              Reload page
            </button>
            <Link
              to="/trip/marrakech-demo"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-navy border border-navy/15 font-semibold hover:bg-navy/5 transition"
            >
              Open the demo
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

function TripView({ trip, traveler }: { trip: Trip; traveler: boolean }) {
  const now = useNow(1000)
  const visualStatus = computeVisualStatus(trip, now)
  const checkIns = useCheckInHistory(trip.id, trip.share_code)
  const actions = useCheckInActions(trip)

  const isDemo = trip.share_code === DEMO_SHARE_CODE
  const [viewerMode, setViewerMode] = useState<DemoViewerMode>('mom')
  const showTravelerView = isDemo && viewerMode === 'sofia'

  const [warningDismissed, setWarningDismissed] = useState(false)
  const previousStatusRef = useRef<VisualStatus>(visualStatus)
  useEffect(() => {
    const previous = previousStatusRef.current
    if (previous !== 'yellow' && visualStatus === 'yellow') {
      setWarningDismissed(false)
    }
    if (visualStatus !== 'yellow') {
      setWarningDismissed(false)
    }
    previousStatusRef.current = visualStatus
  }, [visualStatus])

  const showWarningOverlay =
    traveler &&
    visualStatus === 'yellow' &&
    !warningDismissed &&
    !!trip.timer_expires_at

  const isAlert = visualStatus === 'red'
  const lastCheckIn = checkIns[0]
  const pageUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://shesafe-travel.vercel.app/trip/${trip.share_code}`

  return (
    <main
      className={`min-h-full text-navy transition-colors duration-500 ${
        isAlert ? 'bg-red-50' : 'bg-cream'
      }`}
    >
      <nav
        className={`border-b ${
          isAlert ? 'border-red-200/60' : 'border-navy/[0.06]'
        }`}
      >
        <div className="px-5 sm:px-8 py-4 max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-navy/70 hover:text-coral transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-full px-2 py-1"
          >
            <span aria-hidden>←</span> Home
          </Link>
          <Link
            to="/"
            aria-label="SheSafe Travel home"
            className="font-serif font-medium text-lg tracking-tight hover:opacity-80 transition-opacity"
          >
            SheSafe<span className="italic text-coral"> Travel</span>
          </Link>
        </div>
      </nav>

      {isDemo && (
        <DemoBanner
          trip={trip}
          viewerMode={viewerMode}
          onChangeViewerMode={setViewerMode}
        />
      )}

      {isDemo && (
        <div className="px-4 sm:px-6 pt-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3" aria-hidden>
            <span className="flex-1 h-px bg-navy/15" />
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-navy/55 whitespace-nowrap">
              What Maria actually sees below
            </span>
            <span className="flex-1 h-px bg-navy/15" />
          </div>
          <div className="mt-4 rounded-full bg-white border border-navy/10 px-4 py-2 text-xs text-navy/70 inline-flex items-center gap-1.5 shadow-sm">
            <span aria-hidden>🔗</span>
            Shared safety page · Sent by{' '}
            <span className="font-semibold text-navy/85">
              {trip.traveler_name}
            </span>
          </div>
        </div>
      )}

      {showTravelerView ? (
        <ErrorBoundary
          fallback={
            <div className="px-5 pt-8 pb-12 max-w-2xl mx-auto text-center">
              <p className="text-sm text-navy/70">
                Couldn't load the traveler view. Switch back to{' '}
                <span className="font-semibold">Maria (mom)</span> in the demo
                controls above to keep going.
              </p>
            </div>
          }
        >
          <TravelerCheckInView trip={trip} />
        </ErrorBoundary>
      ) : (
        <TripContactView
          trip={trip}
          checkIns={checkIns}
          now={now}
          visualStatus={visualStatus}
          isAlert={isAlert}
          lastCheckIn={lastCheckIn}
          pageUrl={pageUrl}
          traveler={traveler}
        />
      )}

      <footer className="px-5 pb-10 pt-6 max-w-2xl mx-auto text-center space-y-1.5">
        <p className="text-sm font-medium text-navy/70">
          Powered by SheSafe Travel
        </p>
        <p className="text-xs text-navy/55">
          Built by{' '}
          <a
            href="https://www.linkedin.com/in/sallyasemota/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-navy/75 hover:text-coral underline-offset-2 hover:underline transition-colors"
          >
            Sally Asemota
          </a>
        </p>
      </footer>

      {showWarningOverlay && trip.timer_expires_at && (
        <CheckInWarningOverlay
          expiresAtIso={trip.timer_expires_at}
          onCheckIn={() => actions.checkIn()}
          onAddHour={() => actions.addOneHour()}
          onDismiss={() => setWarningDismissed(true)}
        />
      )}
    </main>
  )
}

function TripContactView({
  trip,
  checkIns,
  now,
  visualStatus,
  isAlert,
  lastCheckIn,
  pageUrl,
  traveler,
}: {
  trip: Trip
  checkIns: ReturnType<typeof useCheckInHistory>
  now: number
  visualStatus: VisualStatus
  isAlert: boolean
  lastCheckIn: ReturnType<typeof useCheckInHistory>[number] | undefined
  pageUrl: string
  traveler: boolean
}) {
  return (
    <>
      <header className="px-5 pt-8 pb-6 max-w-2xl mx-auto">
        <h1 className="font-serif font-medium text-[28px] sm:text-3xl md:text-5xl leading-[1.15] tracking-[-0.015em] break-words">
          {trip.traveler_name}'s trip to{' '}
          <span className="italic text-coral">
            {trip.destination_city}, {trip.destination_country}
          </span>
        </h1>
        <p className="mt-3 text-base sm:text-lg text-navy/75">
          {formatDate(trip.travel_dates_start)} →{' '}
          {formatDate(trip.travel_dates_end)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge visualStatus={visualStatus} />
          {trip.briefing_data?.overall_risk_level &&
            (visualStatus === 'yellow' || visualStatus === 'orange') && (
              <RiskBadge level={trip.briefing_data.overall_risk_level} />
            )}
          <ShareButton url={pageUrl} travelerName={trip.traveler_name} />
        </div>
      </header>

      {visualStatus === 'orange' && (
        <div className="px-5 pt-3 max-w-2xl mx-auto">
          <div className="rounded-2xl bg-orange-100 border border-orange-300 text-orange-900 p-5 shadow-sm space-y-3">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest font-bold text-orange-700">
                ⚠ Warning · Overdue
              </p>
              <h2 className="text-xl sm:text-2xl font-bold mt-1">
                {trip.traveler_name}'s check-in is overdue
              </h2>
              <p className="text-sm mt-1 text-orange-800/90">
                {lastCheckIn
                  ? `Last check-in: ${formatRelative(lastCheckIn.created_at, now)}`
                  : trip.last_check_in
                    ? `Timer started: ${formatRelative(trip.last_check_in, now)}`
                    : 'No previous check-in on record'}
              </p>
              <p className="text-sm mt-2 text-orange-800/90 font-medium">
                Try calling her.
              </p>
            </div>
            {trip.traveler_phone && (
              <a
                href={`tel:${trip.traveler_phone.replace(/[^\d+]/g, '')}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-base px-6 py-3.5 shadow-[0_6px_20px_rgba(249,115,22,0.30)] active:scale-[0.99] transition"
              >
                <span aria-hidden>📞</span>
                Call {trip.traveler_name}
              </a>
            )}
          </div>
        </div>
      )}

      {isAlert && (
        <div className="px-5 pt-3 max-w-2xl mx-auto space-y-3">
          <div className="rounded-2xl bg-red-600 text-white p-5 text-center shadow-lg">
            <p className="text-xs uppercase tracking-widest font-bold">
              ⚠ Emergency
            </p>
            <h2 className="text-xl sm:text-2xl font-bold mt-1 animate-pulse">
              {trip.traveler_name} has not checked in
            </h2>
            <p className="text-sm mt-1 opacity-95">
              {lastCheckIn
                ? `Last check-in: ${formatRelative(lastCheckIn.created_at, now)}`
                : trip.last_check_in
                  ? `Timer started: ${formatRelative(trip.last_check_in, now)}`
                  : 'No previous check-in on record'}
            </p>
            <p className="text-sm mt-2 opacity-90">
              Try calling now. If you can't reach her, the info below can help
              responders.
            </p>
          </div>
          <IfIGoMissing trip={trip} />
        </div>
      )}

      <div className="px-5 pt-6 pb-12 max-w-2xl mx-auto space-y-5">
        <TripStatusDisplay trip={trip} checkIns={checkIns} />

        {traveler && (
          <Section title="Your check-in timer">
            <CheckInTimer trip={trip} visualStatus={visualStatus} />
          </Section>
        )}

        {(checkIns.length > 0 || trip.check_in_status === 'active') && (
          <Section title="Check-in history">
            <CheckInHistoryList
              checkIns={checkIns}
              travelerName={trip.traveler_name}
            />
          </Section>
        )}

        {isAlert && <EmergencyActions trip={trip} urgent />}
      </div>
    </>
  )
}

const STATUS_BADGE_STYLES: Record<
  VisualStatus,
  { label: string; wrap: string; dot: string; pulse: boolean }
> = {
  inactive: {
    label: 'Planning',
    wrap: 'bg-gold/30 border-gold text-navy',
    dot: 'bg-gold',
    pulse: false,
  },
  green: {
    label: 'On track',
    wrap: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    dot: 'bg-emerald-500',
    pulse: true,
  },
  yellow: {
    label: 'Check in soon',
    wrap: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    dot: 'bg-yellow-500',
    pulse: true,
  },
  orange: {
    label: 'Overdue',
    wrap: 'bg-orange-100 border-orange-400 text-orange-800',
    dot: 'bg-orange-500',
    pulse: true,
  },
  red: {
    label: 'ALERT',
    wrap: 'bg-red-100 border-red-400 text-red-800',
    dot: 'bg-red-600',
    pulse: true,
  },
}

function StatusBadge({ visualStatus }: { visualStatus: VisualStatus }) {
  const s = STATUS_BADGE_STYLES[visualStatus]
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${s.wrap}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${s.dot} ${s.pulse ? 'animate-pulse' : ''}`}
        aria-hidden
      />
      {s.label}
    </span>
  )
}

const RISK_BADGE_STYLES: Record<RiskLevel, { wrap: string; dot: string }> = {
  Low: {
    wrap: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  Moderate: {
    wrap: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    dot: 'bg-yellow-500',
  },
  Elevated: {
    wrap: 'bg-orange-100 text-orange-800 border-orange-300',
    dot: 'bg-orange-500',
  },
  High: {
    wrap: 'bg-red-100 text-red-800 border-red-300',
    dot: 'bg-red-500',
  },
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const style = RISK_BADGE_STYLES[level]
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${style.wrap}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
      {level} risk
    </span>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-white border border-navy/10 shadow-sm p-5">
      <h2 className="text-base uppercase tracking-wider text-navy/60 font-semibold mb-3">
        {title}
      </h2>
      {children}
    </section>
  )
}

function IfIGoMissing({ trip }: { trip: Trip }) {
  const passport = trip.passport_info
  const medical = trip.medical_info
  const photo = trip.traveler_photo_url

  return (
    <div className="rounded-2xl bg-white border-2 border-red-300 shadow-md p-5 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-red-700">If she's missing</h3>
        <p className="text-xs text-red-700/70 italic mt-1">
          Revealed because the check-in alert was triggered. Share with police
          or local responders.
        </p>
      </div>

      {photo && (
        <div>
          <p className="text-xs uppercase font-semibold text-red-700 mb-2">
            Traveler photo
          </p>
          <img
            src={photo}
            alt={trip.traveler_name}
            className="rounded-xl max-w-full max-h-72 border border-red-200"
          />
        </div>
      )}

      {passport && (passport.number || passport.issuing_country) && (
        <div>
          <p className="text-xs uppercase font-semibold text-red-700 mb-2">
            Passport
          </p>
          <ul className="text-sm text-red-900 space-y-1">
            {passport.number && (
              <li>
                <span className="font-semibold">Number:</span> {passport.number}
              </li>
            )}
            {passport.issuing_country && (
              <li>
                <span className="font-semibold">Issued by:</span>{' '}
                {passport.issuing_country}
              </li>
            )}
            {passport.expiry_date && (
              <li>
                <span className="font-semibold">Expires:</span>{' '}
                {passport.expiry_date}
              </li>
            )}
          </ul>
        </div>
      )}

      {medical &&
        (medical.blood_type ||
          (medical.allergies && medical.allergies.length > 0) ||
          (medical.medications && medical.medications.length > 0) ||
          (medical.conditions && medical.conditions.length > 0)) && (
          <div>
            <p className="text-xs uppercase font-semibold text-red-700 mb-2">
              Medical
            </p>
            <ul className="text-sm text-red-900 space-y-1">
              {medical.blood_type && (
                <li>
                  <span className="font-semibold">Blood type:</span>{' '}
                  {medical.blood_type}
                </li>
              )}
              {medical.allergies && medical.allergies.length > 0 && (
                <li>
                  <span className="font-semibold">Allergies:</span>{' '}
                  {medical.allergies.join(', ')}
                </li>
              )}
              {medical.medications && medical.medications.length > 0 && (
                <li>
                  <span className="font-semibold">Medications:</span>{' '}
                  {medical.medications.join(', ')}
                </li>
              )}
              {medical.conditions && medical.conditions.length > 0 && (
                <li>
                  <span className="font-semibold">Conditions:</span>{' '}
                  {medical.conditions.join(', ')}
                </li>
              )}
            </ul>
          </div>
        )}

      {trip.traveler_phone && (
        <div>
          <p className="text-xs uppercase font-semibold text-red-700 mb-2">
            Traveler's phone
          </p>
          <p className="text-sm text-red-900 font-medium">
            {trip.traveler_phone}
          </p>
        </div>
      )}

      {(trip.hotel_name || trip.hotel_address || trip.hotel_phone) && (
        <div>
          <p className="text-xs uppercase font-semibold text-red-700 mb-2">
            Last known accommodation
          </p>
          <ul className="text-sm text-red-900 space-y-1">
            {trip.hotel_name && (
              <li>
                <span className="font-semibold">Name:</span> {trip.hotel_name}
              </li>
            )}
            {trip.hotel_address && (
              <li>
                <span className="font-semibold">Address:</span>{' '}
                {trip.hotel_address}
              </li>
            )}
            {trip.hotel_phone && (
              <li>
                <span className="font-semibold">Phone:</span> {trip.hotel_phone}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
