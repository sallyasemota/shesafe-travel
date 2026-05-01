import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BriefingSection } from '../components/BriefingSection'
import { CheckInHistoryList } from '../components/CheckInHistoryList'
import { CheckInTimer } from '../components/CheckInTimer'
import { CheckInWarningOverlay } from '../components/CheckInWarningOverlay'
import { DemoBanner } from '../components/DemoBanner'
import { EmergencyActions } from '../components/EmergencyActions'
import { PDFDownloads } from '../components/PDFDownloads'
import { ShareButton } from '../components/ShareButton'
import { TripStatusDisplay } from '../components/TripStatusDisplay'
import { useCheckInActions } from '../hooks/useCheckInActions'
import { useCheckInHistory } from '../hooks/useCheckInHistory'
import { useNow } from '../hooks/useNow'
import { useRealtimeTrip } from '../hooks/useRealtimeTrip'
import { supabase } from '../lib/supabase'
import {
  computeVisualStatus,
  formatRelative,
  type VisualStatus,
} from '../lib/tripStatus'
import type { RiskLevel, Trip } from '../types/trip'

const SECTION_TABS = [
  { id: 'status', label: 'Status' },
  { id: 'briefing', label: 'Safety Briefing' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'documents', label: 'Documents' },
] as const

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

function TripView({ trip, traveler }: { trip: Trip; traveler: boolean }) {
  const now = useNow(1000)
  const visualStatus = computeVisualStatus(trip, now)
  const checkIns = useCheckInHistory(trip.id)
  const actions = useCheckInActions(trip)

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

  const [activeTab, setActiveTab] = useState<string>('status')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length > 0) {
          setActiveTab(visible[0].target.id)
        }
      },
      {
        // Triggers when a section enters the upper portion of the viewport.
        // top -80px accounts for the sticky tab bar; bottom -55% biases
        // toward "the section near the top of what's visible".
        rootMargin: '-80px 0px -55% 0px',
        threshold: [0, 0.1, 0.5, 1],
      },
    )

    SECTION_TABS.forEach((t) => {
      const el = document.getElementById(t.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const handleTabClick = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveTab(id)
    }
  }

  const handleRefreshBriefing = async () => {
    await supabase
      .from('trips')
      .update({ briefing_data: null })
      .eq('share_code', trip.share_code)

    void fetch('/api/generate-briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shareCode: trip.share_code,
        destinationCity: trip.destination_city,
        destinationCountry: trip.destination_country,
        travelDatesStart: trip.travel_dates_start,
        travelDatesEnd: trip.travel_dates_end,
      }),
    }).catch(() => {})
  }

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
            aria-label="SheSafe Travel — home"
            className="font-serif font-medium text-lg tracking-tight hover:opacity-80 transition-opacity"
          >
            SheSafe<span className="italic text-coral"> Travel</span>
          </Link>
        </div>
      </nav>

      {trip.share_code === 'marrakech-demo' && <DemoBanner trip={trip} />}

      <header className="px-5 pt-8 pb-6 max-w-2xl mx-auto">
        <h1 className="font-serif font-medium text-3xl md:text-5xl leading-[1.1] tracking-[-0.015em]">
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
          {trip.briefing_data?.overall_risk_level && (
            <RiskBadge level={trip.briefing_data.overall_risk_level} />
          )}
          <ShareButton url={pageUrl} travelerName={trip.traveler_name} />
        </div>
      </header>

      {isAlert && (
        <div className="px-5 pt-3 max-w-2xl mx-auto">
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
        </div>
      )}

      <SectionTabs activeId={activeTab} onSelect={handleTabClick} />

      <div className="px-5 pt-6 pb-12 max-w-2xl mx-auto space-y-8">
        <section id="status" className="scroll-mt-20 space-y-5">
          <TripStatusDisplay trip={trip} checkIns={checkIns} />

          {traveler && (
            <Section title="Your check-in timer">
              <CheckInTimer trip={trip} visualStatus={visualStatus} />
            </Section>
          )}

          {(checkIns.length > 0 || trip.check_in_status === 'active') && (
            <Section title="Check-in history">
              <CheckInHistoryList checkIns={checkIns} />
            </Section>
          )}
        </section>

        <section id="briefing" className="scroll-mt-20">
          <Section title="AI safety briefing">
            <BriefingSection
              data={trip.briefing_data}
              homeCountry={trip.traveler_home_country}
              onRefresh={handleRefreshBriefing}
            />
          </Section>
        </section>

        <section id="contacts" className="scroll-mt-20 space-y-5">
          {isAlert ? (
            <>
              <EmergencyActions trip={trip} urgent />
              <IfIGoMissing trip={trip} />
            </>
          ) : (
            <EmergencyActions trip={trip} urgent={false} />
          )}
        </section>

        <section id="documents" className="scroll-mt-20">
          <Section title="Offline access">
            <PDFDownloads trip={trip} />
          </Section>
        </section>
      </div>

      <footer className="px-5 pb-10 max-w-2xl mx-auto text-center space-y-1">
        <p className="text-sm font-medium text-navy/70">
          Powered by SheSafe Travel
        </p>
        <p className="text-xs text-navy/50">This page updates in real-time.</p>
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

function SectionTabs({
  activeId,
  onSelect,
}: {
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <nav
      aria-label="Trip page sections"
      className="sticky top-0 z-30 bg-cream/95 backdrop-blur-sm border-b border-navy/10 shadow-[0_2px_12px_rgba(61,64,91,0.05)]"
    >
      <div className="max-w-2xl mx-auto px-3 sm:px-5">
        <ul
          role="tablist"
          className="flex gap-0 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {SECTION_TABS.map((t) => {
            const active = activeId === t.id
            return (
              <li key={t.id} className="flex-shrink-0">
                <a
                  href={`#${t.id}`}
                  role="tab"
                  aria-selected={active}
                  onClick={(e) => {
                    e.preventDefault()
                    onSelect(t.id)
                  }}
                  className={`block px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/40 focus-visible:ring-inset rounded-sm ${
                    active
                      ? 'text-coral border-coral'
                      : 'text-navy/65 border-transparent hover:text-navy'
                  }`}
                >
                  {t.label}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
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
