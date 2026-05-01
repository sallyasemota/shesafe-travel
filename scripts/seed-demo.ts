import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import { DEMO_BRIEFING, DEMO_SHARE_CODE } from '../src/lib/demoBriefing'

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
        share_code: DEMO_SHARE_CODE,
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
        briefing_data: DEMO_BRIEFING,
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
  console.log('Demo URL: https://shesafe-travel.vercel.app/trip/' + DEMO_SHARE_CODE)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
