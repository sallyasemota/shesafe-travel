import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Trip } from '../types/trip'

export type RealtimeTripState =
  | { kind: 'loading' }
  | { kind: 'ready'; trip: Trip }
  | { kind: 'not-found' }

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

      setState({ kind: 'ready', trip: data as Trip })
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
          setState({ kind: 'ready', trip: payload.new as Trip })
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
