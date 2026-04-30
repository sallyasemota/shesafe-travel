import { useState } from 'react'
import type { Trip } from '../types/trip'

export function PDFDownloads({ trip }: { trip: Trip }) {
  const briefingReady = !!trip.briefing_data
  const [loading, setLoading] = useState<'safety' | 'emergency' | null>(null)

  const downloadSafety = async () => {
    setLoading('safety')
    try {
      const { generateSafetyPDF } = await import('../lib/generateSafetyPDF')
      generateSafetyPDF(trip)
    } finally {
      setLoading(null)
    }
  }

  const downloadEmergency = async () => {
    setLoading('emergency')
    try {
      const { generateEmergencyPDF } = await import(
        '../lib/generateEmergencyPDF'
      )
      generateEmergencyPDF(trip)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-navy/70">
        Save these to your phone or print them. Useful when you're offline,
        roaming, or in a real emergency.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={downloadSafety}
          disabled={!briefingReady || loading !== null}
          title={
            briefingReady
              ? undefined
              : 'Available once the AI briefing finishes loading.'
          }
          className="flex items-start gap-3 rounded-xl bg-white border border-coral/40 px-4 py-3 text-left hover:bg-coral/5 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="text-2xl shrink-0" aria-hidden>
            📄
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-navy">
              {loading === 'safety'
                ? 'Generating…'
                : 'Offline safety packet'}
            </span>
            <span className="block text-xs text-navy/60">
              Emergency numbers, top tips, key phrases. Pocket-friendly.
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={downloadEmergency}
          disabled={loading !== null}
          className="flex items-start gap-3 rounded-xl bg-white border border-red-300 px-4 py-3 text-left hover:bg-red-50 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="text-2xl shrink-0" aria-hidden>
            🚨
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-red-700">
              {loading === 'emergency' ? 'Generating…' : 'Emergency packet'}
            </span>
            <span className="block text-xs text-navy/60">
              Passport, medical, contacts. Hand to police or embassy.
            </span>
          </span>
        </button>
      </div>
      {!briefingReady && (
        <p className="text-xs text-navy/50 italic">
          The offline safety packet unlocks once the AI briefing finishes.
        </p>
      )}
    </div>
  )
}
