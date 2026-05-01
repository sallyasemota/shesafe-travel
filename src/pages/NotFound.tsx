import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="min-h-full bg-cream text-navy font-sans antialiased flex flex-col">
      <header className="border-b border-navy/[0.06]">
        <div className="px-5 sm:px-8 py-5 max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy/70 hover:text-coral transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-full px-2 py-1"
          >
            <span aria-hidden>←</span> Home
          </Link>
          <Link
            to="/"
            aria-label="SheSafe Travel — home"
            className="font-serif font-medium text-xl tracking-tight hover:opacity-80 transition-opacity"
          >
            SheSafe<span className="italic text-coral"> Travel</span>
          </Link>
        </div>
      </header>

      <section className="flex-1 px-5 sm:px-8 py-16 sm:py-24 max-w-2xl mx-auto w-full text-center flex flex-col items-center justify-center">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-coral mb-5">
          404
        </p>
        <h1 className="font-serif font-medium text-4xl sm:text-5xl leading-[1.1] tracking-[-0.015em]">
          Page <span className="italic text-coral">not found</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-navy/75 leading-relaxed max-w-md mx-auto">
          This page doesn't exist, but your safety plan can.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-coral font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            <span aria-hidden className="mr-1">
              ←
            </span>
            Back to home
          </Link>
          <Link
            to="/create"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-coral text-cream font-semibold shadow-[0_8px_30px_rgba(224,122,95,0.35)] hover:shadow-[0_12px_40px_rgba(224,122,95,0.45)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Create a trip <span aria-hidden className="ml-1">→</span>
          </Link>
        </div>
      </section>

      <footer className="px-5 sm:px-8 pb-10 max-w-2xl mx-auto w-full text-center space-y-1">
        <p className="text-xs text-navy/55">
          Built by{' '}
          <span className="font-semibold text-navy/75">Sally Asemota</span>
          <span className="text-navy/30 mx-1.5" aria-hidden>
            ·
          </span>
          Built for Women Build AI Build-A-Thon 2026
        </p>
        <p className="text-xs text-navy/45">
          Powered by Claude, Supabase, Firecrawl
        </p>
      </footer>
    </main>
  )
}
