import { useEffect, useState } from 'react'
import type { BriefingData, BriefingSections } from '../types/trip'

const LOADING_STEPS = [
  'Scanning travel advisories…',
  'Analyzing cultural norms…',
  'Finding emergency resources…',
]

const ACCORDION_SECTIONS: Array<{
  key: keyof BriefingSections
  label: string
  defaultOpen?: boolean
}> = [
  { key: 'safety_overview', label: 'Safety overview', defaultOpen: true },
  { key: 'cultural_norms_for_women', label: 'Cultural norms for women' },
  { key: 'harassment_and_scam_patterns', label: 'Harassment & scam patterns' },
  { key: 'transport_safety', label: 'Transport safety' },
  { key: 'safe_areas', label: 'Safe areas' },
  { key: 'health_and_medical', label: 'Health & medical' },
  { key: 'communication', label: 'Communication' },
  { key: 'what_to_wear', label: 'What to wear' },
  { key: 'solo_dining_and_nightlife', label: 'Solo dining & nightlife' },
]

function extractTel(value: string): string | null {
  const match = value.match(/[+0-9][\d\s\-()]{2,}/)
  if (!match) return null
  const cleaned = match[0].replace(/[^\d+]/g, '')
  return cleaned.length >= 3 ? `tel:${cleaned}` : null
}

function BriefingLoading() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % LOADING_STEPS.length)
    }, 2500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="rounded-2xl bg-white border border-coral/30 shadow-sm p-8 text-center space-y-4">
      <p className="text-lg font-semibold text-coral animate-pulse">
        Building your safety briefing…
      </p>
      <p
        key={step}
        className="text-sm text-navy/70 transition-opacity duration-500 animate-pulse"
      >
        {LOADING_STEPS[step]}
      </p>
      <div className="flex justify-center gap-2 pt-2" aria-hidden>
        {LOADING_STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === step ? 'bg-coral' : 'bg-coral/30'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function DataSourceBadge({ live }: { live: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border ${
        live
          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
          : 'bg-gold/30 text-navy border-gold'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${live ? 'bg-emerald-500' : 'bg-gold'}`}
        aria-hidden
      />
      Data source: {live ? 'Live advisory data' : 'AI knowledge'}
    </div>
  )
}

function EmergencyRow({ label, value }: { label: string; value: string }) {
  const tel = extractTel(value)
  return (
    <li className="flex items-baseline justify-between gap-3 py-1">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy">{label}</p>
        <p className="text-sm text-navy/80 break-words">{value}</p>
      </div>
      {tel && (
        <a
          href={tel}
          className="shrink-0 rounded-full bg-coral text-cream text-xs font-semibold px-3 py-1.5 hover:opacity-90 active:scale-95 transition"
        >
          Call
        </a>
      )}
    </li>
  )
}

export function BriefingSection({ data }: { data: BriefingData | null }) {
  if (!data) return <BriefingLoading />

  const sections = data.sections ?? {}
  const emergency = sections.emergency_contacts
  const isLive = data.data_source === 'live'

  return (
    <div className="space-y-5">
      <DataSourceBadge live={isLive} />

      {data.top_3_tips && data.top_3_tips.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.top_3_tips.map((tip, i) => (
            <div
              key={i}
              className="rounded-xl bg-coral/15 border border-coral/40 p-4 text-sm text-navy/90"
            >
              <p className="text-xs font-semibold text-coral uppercase tracking-wider mb-1">
                Tip {i + 1}
              </p>
              <p>{tip}</p>
            </div>
          ))}
        </div>
      )}

      {emergency && (
        <div className="rounded-2xl bg-white border-2 border-coral/40 shadow-sm p-5">
          <h3 className="text-base font-semibold text-coral mb-3">
            Emergency contacts
          </h3>
          <ul className="divide-y divide-navy/5">
            {emergency.police && (
              <EmergencyRow label="Police" value={emergency.police} />
            )}
            {emergency.ambulance && (
              <EmergencyRow label="Ambulance" value={emergency.ambulance} />
            )}
            {emergency.fire && (
              <EmergencyRow label="Fire" value={emergency.fire} />
            )}
            {emergency.us_embassy && (
              <EmergencyRow label="US Embassy" value={emergency.us_embassy} />
            )}
            {emergency.womens_crisis_line &&
              emergency.womens_crisis_line.toLowerCase() !==
                'not available' && (
                <EmergencyRow
                  label="Women's crisis line"
                  value={emergency.womens_crisis_line}
                />
              )}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {ACCORDION_SECTIONS.map(({ key, label, defaultOpen }) => {
          const text = sections[key]
          if (typeof text !== 'string' || !text.trim()) return null
          return (
            <details
              key={key}
              open={defaultOpen}
              className="group rounded-xl bg-white border border-navy/10 overflow-hidden"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between px-4 py-3 text-navy font-medium hover:bg-navy/[0.02] transition">
                <span>{label}</span>
                <span
                  className="text-coral text-lg leading-none transition-transform duration-200 group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <div className="px-4 pb-4 text-sm text-navy/85 whitespace-pre-line">
                {text}
              </div>
            </details>
          )
        })}
      </div>

      {data.phrases_to_know && data.phrases_to_know.length > 0 && (
        <div className="rounded-2xl bg-cream border border-gold/40 p-5">
          <h3 className="text-base font-semibold text-navy mb-3">
            Phrases to know
          </h3>
          <ul className="text-sm space-y-2">
            {data.phrases_to_know.map((phrase, i) => (
              <li key={i}>
                <span className="font-semibold text-navy">{phrase.local}</span>
                <span className="text-navy/60"> — {phrase.english}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
