export default function LandingPage() {
  return (
    <main className="min-h-full flex flex-col items-center justify-center px-6 py-16 bg-cream text-navy">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-5xl font-semibold tracking-tight">
          SheSafe <span className="text-coral">Travel</span>
        </h1>
        <p className="text-lg text-navy/80">
          Plan your trip, share your safety page, and let the people who love you
          know you've arrived.
        </p>
        <button
          type="button"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-coral text-cream font-medium shadow hover:opacity-90 transition"
        >
          Create a trip
        </button>
      </div>
    </main>
  )
}
