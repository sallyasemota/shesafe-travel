import type { EmergencyContact, Trip } from '../types/trip'

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

function extractTel(value: string): string | null {
  // Match +/digit followed by 1+ more chars from the phone-allowed set.
  // Total length must be ≥ 2 — covers short emergency numbers like "19", "15", "911".
  const match = value.match(/[+0-9][\d\s\-()]+/)
  if (!match) return null
  const cleaned = match[0].replace(/[^\d+]/g, '')
  return cleaned.length >= 2 ? `tel:${cleaned}` : null
}

interface ActionItem {
  key: string
  label: string
  detail?: string
  tel: string
}

function buildActions(trip: Trip, urgent: boolean): ActionItem[] {
  const items: ActionItem[] = []
  const emergency = trip.briefing_data?.sections?.emergency_contacts

  // Personal contacts (traveler + emergency contacts) only surface in the
  // urgent reveal — calm mode shows just emergency services so the page
  // stays low-stakes when she's checked in or just running late.
  if (urgent && trip.traveler_phone) {
    items.push({
      key: 'traveler',
      label: `Call ${trip.traveler_name}`,
      detail: trip.traveler_phone,
      tel: telHref(trip.traveler_phone),
    })
  }

  if (emergency?.police) {
    const tel = extractTel(emergency.police)
    if (tel) {
      items.push({
        key: 'police',
        label: 'Local police',
        detail: emergency.police,
        tel,
      })
    }
  }

  if (emergency?.ambulance) {
    const tel = extractTel(emergency.ambulance)
    if (tel) {
      items.push({
        key: 'ambulance',
        label: 'Ambulance',
        detail: emergency.ambulance,
        tel,
      })
    }
  }

  if (emergency?.fire) {
    const tel = extractTel(emergency.fire)
    if (tel) {
      items.push({
        key: 'fire',
        label: 'Fire',
        detail: emergency.fire,
        tel,
      })
    }
  }

  const embassyValue = emergency?.embassy ?? emergency?.us_embassy
  if (embassyValue) {
    const tel = extractTel(embassyValue)
    if (tel) {
      const homeCountry = trip.traveler_home_country?.trim() || 'US'
      items.push({
        key: 'embassy',
        label: `${homeCountry} Embassy`,
        detail: embassyValue,
        tel,
      })
    }
  }

  if (urgent) {
    const contacts = (trip.emergency_contacts ?? []).filter(
      (c): c is EmergencyContact => Boolean(c?.name && c?.phone),
    )
    contacts.forEach((c, i) => {
      items.push({
        key: `contact-${i}`,
        label: `Call ${c.name}`,
        detail: c.relationship ? `${c.relationship} — ${c.phone}` : c.phone,
        tel: telHref(c.phone),
      })
    })
  }

  return items
}

export function EmergencyActions({
  trip,
  urgent,
}: {
  trip: Trip
  urgent: boolean
}) {
  const actions = buildActions(trip, urgent)
  if (actions.length === 0) return null

  if (urgent) {
    return (
      <div className="rounded-2xl bg-white border-2 border-red-400 shadow-lg p-5 space-y-3 [animation:pulse_2.5s_ease-in-out_infinite]">
        <div className="flex items-center gap-2">
          <span className="text-red-600 text-xl" aria-hidden>
            🚨
          </span>
          <h2 className="text-base sm:text-lg font-bold text-red-700 uppercase tracking-wide">
            Call for help — now
          </h2>
        </div>
        <ul className="space-y-3">
          {actions.map((a) => (
            <li key={a.key}>
              <a
                href={a.tel}
                className="flex items-center justify-between gap-3 rounded-xl bg-red-600 text-white px-4 py-5 shadow hover:bg-red-700 active:scale-[0.99] transition"
              >
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-bold truncate">
                    {a.label}
                  </p>
                  {a.detail && (
                    <p className="text-sm opacity-90 truncate">{a.detail}</p>
                  )}
                </div>
                <span
                  className="shrink-0 text-base sm:text-lg font-bold"
                  aria-hidden
                >
                  📞 CALL
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white border border-navy/10 shadow-sm p-5">
      <h2 className="text-base uppercase tracking-wider text-navy/60 font-semibold mb-3">
        Emergency services
      </h2>
      <ul className="space-y-2">
        {actions.map((a) => (
          <li key={a.key}>
            <a
              href={a.tel}
              className="flex items-center justify-between gap-3 min-h-[64px] rounded-xl bg-cream/40 border border-gold/40 px-4 py-3 hover:bg-cream/60 active:scale-[0.99] transition"
            >
              <div className="min-w-0">
                <p className="font-semibold text-navy truncate">{a.label}</p>
                {a.detail && (
                  <p className="text-sm text-navy/70 truncate">{a.detail}</p>
                )}
              </div>
              <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-coral text-cream font-semibold text-sm px-4 py-2">
                Call
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
