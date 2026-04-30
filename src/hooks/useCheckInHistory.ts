import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { CheckIn } from '../types/trip'

export function useCheckInHistory(tripId: string | undefined): CheckIn[] {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])

  useEffect(() => {
    if (!tripId) {
      setCheckIns([])
      return
    }

    let active = true

    async function load() {
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
  }, [tripId])

  return checkIns
}
