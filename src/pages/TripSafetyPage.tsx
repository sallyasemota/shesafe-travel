import { useParams } from 'react-router-dom'

export default function TripSafetyPage() {
  const { shareCode } = useParams<{ shareCode: string }>()

  return (
    <main className="min-h-full px-6 py-12 bg-cream text-navy">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="border-b border-navy/10 pb-4">
          <p className="text-sm uppercase tracking-widest text-coral font-semibold">
            Trip Safety Page
          </p>
          <h1 className="text-3xl font-semibold mt-1">
            Share code: <span className="text-coral">{shareCode}</span>
          </h1>
        </header>

        <section className="rounded-xl bg-white/60 border border-gold/40 p-6 shadow-sm">
          <p className="text-navy/80">
            This is the placeholder for the shared trip safety page. Briefing,
            emergency contacts, medical info, and check-in status will live here.
          </p>
        </section>
      </div>
    </main>
  )
}
