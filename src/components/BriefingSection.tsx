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
  // Match +/digit followed by 1+ more chars from the phone-allowed set.
  // Total length must be ≥ 2 — covers short emergency numbers like "19", "15", "911".
  const match = value.match(/[+0-9][\d\s\-()]+/)
  if (!match) return null
  const cleaned = match[0].replace(/[^\d+]/g, '')
  return cleaned.length >= 2 ? `tel:${cleaned}` : null
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
    <div className="rounded-2xl bg-white border border-coral/30 shadow-sm px-5 py-8 sm:px-8 sm:py-10 text-center space-y-5 min-h-[260px] flex flex-col items-center justify-center">
      <div className="space-y-3">
        <p className="text-base sm:text-lg font-semibold text-coral animate-pulse">
          Building your safety briefing…
        </p>
        <p
          key={step}
          className="text-sm text-navy/70 px-2 transition-opacity duration-500"
        >
          {LOADING_STEPS[step]}
        </p>
      </div>

      <div className="w-full max-w-[180px] space-y-2 pt-1">
        {LOADING_STEPS.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full bg-coral/20 overflow-hidden"
          >
            <div
              className={`h-full bg-coral transition-all duration-700 ease-out ${
                i === step
                  ? 'w-full'
                  : i < step || (step === 0 && i === LOADING_STEPS.length - 1)
                    ? 'w-full opacity-50'
                    : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>

      <p className="text-xs text-navy/40 pt-1">
        This usually takes about 30 seconds.
      </p>
    </div>
  )
}

function DataSourceBadge({
  source,
}: {
  source: 'live' | 'ai_knowledge' | 'demo'
}) {
  const variant =
    source === 'demo'
      ? {
          wrap: 'bg-coral/15 text-coral border-coral/40',
          dot: 'bg-coral',
          label: 'Pre-loaded briefing',
        }
      : source === 'live'
        ? {
            wrap: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            dot: 'bg-emerald-500',
            label: 'Live advisory data',
          }
        : {
            wrap: 'bg-gold/30 text-navy border-gold',
            dot: 'bg-gold',
            label: 'AI knowledge',
          }
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs sm:text-sm font-medium border ${variant.wrap}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${variant.dot}`}
        aria-hidden
      />
      <span className="hidden sm:inline">Data source: </span>
      {variant.label}
    </div>
  )
}

function EmergencyRow({ label, value }: { label: string; value: string }) {
  const tel = extractTel(value)
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy">{label}</p>
        <p className="text-sm text-navy/80 break-words">{value}</p>
      </div>
      {tel && (
        <a
          href={tel}
          className="shrink-0 inline-flex items-center justify-center min-h-[44px] rounded-full bg-coral text-cream text-sm font-semibold px-4 py-2 hover:opacity-90 active:scale-95 transition"
        >
          Call
        </a>
      )}
    </li>
  )
}

function AccordionItem({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl bg-white border border-navy/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-navy font-medium hover:bg-navy/[0.02] transition-colors"
      >
        <span>{title}</span>
        <span
          aria-hidden
          className={`text-coral text-xl leading-none transition-transform duration-300 ease-out ${
            open ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 text-[15px] leading-relaxed text-navy/85 whitespace-pre-line">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function BriefingSection({
  data,
  homeCountry,
  onRefresh,
}: {
  data: BriefingData | null
  homeCountry?: string | null
  onRefresh?: () => void
}) {
  if (!data) return <BriefingLoading />

  const sections = data.sections ?? {}
  const emergency = sections.emergency_contacts
  const dataSource = data.data_source ?? 'ai_knowledge'
  const embassyLabel = `${homeCountry?.trim() || 'US'} Embassy`
  const embassyValue = emergency?.embassy ?? emergency?.us_embassy

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <DataSourceBadge source={dataSource} />
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs sm:text-sm font-medium text-coral hover:underline active:opacity-70"
          >
            ↻ Refresh briefing
          </button>
        )}
      </div>

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
            {embassyValue && (
              <EmergencyRow label={embassyLabel} value={embassyValue} />
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
            <AccordionItem key={key} title={label} defaultOpen={defaultOpen}>
              {text}
            </AccordionItem>
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
