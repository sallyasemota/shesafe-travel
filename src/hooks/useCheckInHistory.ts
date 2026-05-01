import { useEffect, useMemo, useState } from 'react'
import { buildDemoCheckIns, DEMO_SHARE_CODE } from '../lib/demoBriefing'
import { supabase } from '../lib/supabase'
import type { CheckIn } from '../types/trip'

export function useCheckInHistory(
  tripId: string | undefined,
  shareCode?: string,
): CheckIn[] {
  const isDemo = shareCode === DEMO_SHARE_CODE
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])

  // Demo baseline anchored to mount-time so the absolute clock labels
  // ("Checked in at 2:34 PM") feel natural for whoever opens the page,
  // not whatever timezone the seed script ran in.
  const demoBaseline = useMemo<CheckIn[]>(
    () => (isDemo && tripId ? buildDemoCheckIns(tripId, Date.now()) : []),
    [isDemo, tripId],
  )

  useEffect(() => {
    if (!tripId) {
      setCheckIns([])
      return
    }

    let active = true

    async function load() {
      // Skip the DB fetch for the demo trip — the seeded rows have stale
      // off-hours timestamps that we don't want to show. Real check-ins
      // added during the session via Realtime INSERT still flow through.
      if (isDemo) return
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      if (!active) return
      if (error || !data) return

      setCheckIns(data as CheckIn[])
    }

    load()

    const channel = supabase
      .channel(`checkins:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'check_ins',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          if (!active) return
          const next = payload.new as CheckIn
          setCheckIns((prev) =>
            prev.some((c) => c.id === next.id) ? prev : [next, ...prev],
          )
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [tripId, isDemo])

  if (isDemo) {
    // checkIns here only ever contains in-session INSERTs from the
    // demo's "I'm Safe" button (the initial DB fetch is skipped above).
    return [...checkIns, ...demoBaseline]
  }
  return checkIns
}
