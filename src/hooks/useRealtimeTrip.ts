import { useEffect, useState } from 'react'
import { DEMO_BRIEFING, DEMO_SHARE_CODE } from '../lib/demoBriefing'
import { supabase } from '../lib/supabase'
import type { Trip } from '../types/trip'

export type RealtimeTripState =
  | { kind: 'loading' }
  | { kind: 'ready'; trip: Trip }
  | { kind: 'not-found' }

// Demo trip is always served with a hardcoded briefing so the page renders
// instantly — no /api/generate-briefing round-trip, no loading spinner, no
// dependency on the row's briefing_data being present in the DB.
function withDemoOverrides(trip: Trip): Trip {
  if (trip.share_code !== DEMO_SHARE_CODE) return trip
  return { ...trip, briefing_data: DEMO_BRIEFING, check_in_interval_hours: 2 }
}

export function useRealtimeTrip(
  shareCode: string | undefined,
): RealtimeTripState {
  const [state, setState] = useState<RealtimeTripState>({ kind: 'loading' })

  useEffect(() => {
    if (!shareCode) {
      setState({ kind: 'not-found' })
      return
    }

    let active = true

    async function load() {
      // Demo trip: reset to a calm green state on every visitor's load so
      // the first impression is always "she's safe" — then they can click
      // through the cascade controls in DemoBanner. Writes BEFORE the
      // fetch so the first paint already shows green (no flash of stale
      // alert/yellow state from a previous visitor).
      if (shareCode === DEMO_SHARE_CODE) {
        const now = Date.now()
        const startedAt = new Date(now - 5 * 60_000)
        const expiresAt = new Date(now + 105 * 60_000)
        await supabase
          .from('trips')
          .update({
            check_in_status: 'active',
            last_check_in: startedAt.toISOString(),
            timer_expires_at: expiresAt.toISOString(),
          })
          .eq('share_code', shareCode)
      }

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('share_code', shareCode)
        .maybeSingle()

      if (!active) return

      if (error || !data) {
        setState({ kind: 'not-found' })
        return
      }

      setState({ kind: 'ready', trip: withDemoOverrides(data as Trip) })
    }

    load()

    const channel = supabase
      .channel(`trip:${shareCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
          filter: `share_code=eq.${shareCode}`,
        },
        (payload) => {
          if (!active) return
          setState({
            kind: 'ready',
            trip: withDemoOverrides(payload.new as Trip),
          })
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [shareCode])

  return state
}
