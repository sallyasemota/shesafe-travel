import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import type { BriefingData } from '../src/types/trip'

loadEnv({ path: '.env.local' })

const rawUrl = process.env.VITE_SUPABASE_URL?.trim()
const key = process.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!rawUrl || !key) {
  console.error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local',
  )
  process.exit(1)
}

// Strip trailing slashes and an accidentally-appended /rest/v1/ path —
// the JS client appends that itself.
const url = rawUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/, '')

const supabase = createClient(url, key)

const SHARE_CODE = 'marrakech-demo'

const briefingData: BriefingData = {
  overall_risk_level: 'Moderate',
  risk_score: 3,
  last_updated: new Date().toISOString().slice(0, 10),
  data_source: 'live',
  sections: {
    safety_overview:
      "Marrakesh is one of Morocco's most-visited cities and is generally safe for solo women travelers. Persistent street harassment in the medina is the main quality-of-life concern, alongside petty theft (bag-snatching from mopeds) and tourist scams. Violent crime against tourists is rare. Stay alert in the souks and stick to busy streets after dark.",
    cultural_norms_for_women:
      "Modest dress is strongly expected — cover shoulders and knees, especially in the medina. A light scarf is essential for entering mosques. Saying 'la, shukran' (no, thank you) firmly to street vendors is necessary; engaging in conversation is interpreted as interest. Women dining alone may be seated near the back of restaurants — request a different table if you'd prefer.",
    harassment_and_scam_patterns:
      "Catcalling and persistent following are common in the medina, especially after dark. The 'fake guide' scam is widespread — strangers offer to lead you somewhere then demand large fees. Tannery 'guides' will try to pull you into leather shops. Always ask for prices before agreeing to anything; haggle to roughly 30-40% of the opening price.",
    transport_safety:
      "Taxis: insist on the meter ('compteur'); a fair price from the airport to the medina is around 100 MAD. Use Heetch or InDriver apps for app-hailed rides. Avoid driving yourself — the medina is car-free and traffic outside is chaotic. Don't accept rides from unmarked cars.",
    safe_areas:
      'Gueliz (the Ville Nouvelle / new city) is the most comfortable area for solo women — wide boulevards, cafes, and a relaxed atmosphere. The Hivernage district near major hotels is also safe at night. Within the medina, Mouassine and the area around Maison de la Photographie are relatively tourist-friendly. Avoid Bab Doukkala and the tanneries district after dark. Jemaa el-Fna is safe during the day but turns aggressive toward solo women after 9 PM.',
    emergency_contacts: {
      police: '19',
      ambulance: '15',
      fire: '15',
      embassy:
        'US Consulate General Casablanca: +212 522-64-20-00, 8 Boulevard Moulay Youssef, Casablanca — handles consular services for Marrakesh.',
      womens_crisis_line: 'Not available',
    },
    health_and_medical:
      'For serious medical needs, go to Polyclinique du Sud (Gueliz) or Clinique Yasmine — both have English-speaking staff. Pharmacies (pharmacies de garde) are open 24/7 on a rotating basis; check signs in any pharmacy window. Tap water is not safe to drink; use bottled water for brushing teeth too.',
    communication:
      'Buy a Maroc Telecom or Orange Maroc SIM at the airport arrivals hall (~100 MAD for data); coverage is strong throughout Marrakesh. WhatsApp is the dominant communication app locally. Download offline maps via Maps.me with the Marrakesh medina map pre-loaded — Google Maps has gaps in medina alleyways. The emergency tourist police line is +212 (0)524-384-601.',
    what_to_wear:
      'Loose, breathable linen or cotton that covers shoulders and knees is ideal — both culturally respectful and reduces street harassment. A light scarf is essential to cover hair when entering mosques or more conservative neighborhoods. Avoid sleeveless tops and short skirts in the medina; in Gueliz cafes and rooftop restaurants, smart casual is fine. Comfortable closed-toe walking shoes for cobblestone medina streets.',
    solo_dining_and_nightlife:
      "For dinner: Kasbah Cafe, Le Jardin Secret, and Nomad (rooftop terrace) are all comfortable for solo women. Avoid the cheap food stalls in Jemaa el-Fna at night. For drinks: Le Salama and Sky Bar at La Mamounia are safe and tourist-friendly. Ride-hail back to your hotel after 10 PM — don't walk the medina alone.",
  },
  top_3_tips: [
    "Treat 'la, shukran' as a firm magic phrase. Saying it once and walking away ends 90% of street harassment without escalating it.",
    'Always agree on taxi fare or insist on the meter BEFORE getting in. The going rate from the airport to the medina is 100 MAD.',
    "Download Maps.me offline before you arrive — Google Maps regularly fails in medina alleyways and you don't want to be lost there at night.",
  ],
  phrases_to_know: [
    { local: 'La, shukran', english: 'No, thank you (firm)' },
    { local: 'Bshhal hada?', english: 'How much is this?' },
    { local: 'Smahli', english: 'Excuse me / Sorry' },
    { local: 'Mn fadlik', english: 'Please / If you would' },
  ],
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// Hardcoded UUIDs so re-running the seed updates the same check-in rows
// instead of accumulating duplicates. (Anon role doesn't have DELETE on
// these tables under current RLS, so we rely on UPSERT for idempotency.)
const CHECK_IN_IDS = [
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
]

async function main() {
  const now = new Date()
  const today = isoDate(now)
  const oneWeek = isoDate(new Date(now.getTime() + 7 * 24 * 3_600_000))

  const lastCheckIn = new Date(now.getTime() - 30 * 60_000)
  const timerExpires = new Date(now.getTime() + 4 * 3_600_000)

  // 1. Upsert trip by share_code (works whether row exists or not — anon RLS
  //    permits INSERT and UPDATE, but not DELETE)
  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .upsert(
      {
        share_code: SHARE_CODE,
        traveler_name: 'Sofia',
        destination_city: 'Marrakech',
        destination_country: 'Morocco',
        travel_dates_start: today,
        travel_dates_end: oneWeek,
        traveler_phone: '+1 555 123 4567',
        traveler_home_country: 'United States',
        emergency_contacts: [
          {
            name: 'Maria (Mom)',
            phone: '+1 555 234 5678',
            relationship: 'Mother',
          },
          {
            name: 'Priya',
            phone: '+1 555 345 6789',
            relationship: 'Best Friend',
          },
        ],
        medical_info: {
          blood_type: 'O+',
          allergies: ['penicillin', 'shellfish'],
          medications: [],
        },
        passport_info: {
          number: 'A12345678',
          issuing_country: 'United States',
        },
        traveler_photo_url: null,
        hotel_name: 'Riad Yasmine (demo)',
        hotel_address:
          '209 Diour Saboune, Bab Taghzoute, Medina, Marrakech (real address — demo data only)',
        hotel_phone: '+212 524 38 71 04',
        briefing_data: briefingData,
        check_in_status: 'active',
        last_check_in: lastCheckIn.toISOString(),
        timer_expires_at: timerExpires.toISOString(),
      },
      { onConflict: 'share_code' },
    )
    .select('id')
    .single()

  if (tripErr || !trip) {
    console.error('Failed to upsert trip:', tripErr?.message)
    process.exit(1)
  }
  console.log(`Upserted demo trip ${trip.id}`)

  // 2. Upsert sample check-ins by hardcoded id so re-runs don't duplicate
  const checkIns = [
    {
      id: CHECK_IN_IDS[0],
      delta_minutes: -6 * 60,
      message: 'Arrived at the riad, all settled in.',
    },
    {
      id: CHECK_IN_IDS[1],
      delta_minutes: -2 * 60,
      message: "Walking through the medina — it's beautiful here.",
    },
    {
      id: CHECK_IN_IDS[2],
      delta_minutes: -5,
      message: 'Just had the best tagine at a rooftop cafe! 🧡',
    },
  ]

  let upserted = 0
  for (const ci of checkIns) {
    const created = new Date(now.getTime() + ci.delta_minutes * 60_000)
    const { error } = await supabase.from('check_ins').upsert(
      {
        id: ci.id,
        trip_id: trip.id,
        status: 'safe',
        message: ci.message,
        created_at: created.toISOString(),
      },
      { onConflict: 'id' },
    )
    if (error) {
      console.error(`Failed to upsert check-in (${ci.delta_minutes}m):`, error.message)
      continue
    }
    upserted++
  }
  console.log(`Upserted ${upserted} check-ins`)

  console.log('')
  console.log('Demo URL: https://shesafe-travel.vercel.app/trip/' + SHARE_CODE)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
