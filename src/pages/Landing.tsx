import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <main className="min-h-full bg-cream text-navy font-sans antialiased">
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <FinalCta />
      <SiteFooter />
    </main>
  )
}

function Wordmark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizing = size === 'sm' ? 'text-xl' : 'text-2xl'
  return (
    <span className={`font-serif font-medium tracking-tight ${sizing}`}>
      SheSafe
      <span className="italic text-coral"> Travel</span>
    </span>
  )
}

function Nav() {
  return (
    <header className="border-b border-navy/[0.06]">
      <div className="px-5 sm:px-8 py-5 max-w-6xl mx-auto flex items-center justify-between gap-4">
        <Link
          to="/"
          className="hover:opacity-80 transition-opacity"
          aria-label="SheSafe Travel — home"
        >
          <Wordmark size="md" />
        </Link>
        <Link
          to="/create"
          className="text-sm font-medium text-navy hover:text-coral transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-full px-3 py-1"
        >
          Create a trip{' '}
          <span aria-hidden className="ml-0.5">
            →
          </span>
        </Link>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative px-5 sm:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28 max-w-4xl mx-auto text-center">
      <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-coral mb-7">
        Real-time travel safety, built for women
      </p>
      <h1 className="font-serif font-medium text-5xl sm:text-7xl leading-[1.05] tracking-[-0.02em]">
        Don't just travel safe.
        <br className="hidden sm:block" />{' '}
        <span className="italic text-coral">Travel connected.</span>
      </h1>
      <p className="mt-7 sm:mt-9 text-lg sm:text-xl text-navy/75 leading-relaxed max-w-2xl mx-auto">
        One link keeps everyone who loves you in the loop. AI-powered safety
        briefings, real-time check-ins, and instant emergency coordination —
        through a single shareable URL.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
        <Link
          to="/create"
          className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-coral text-cream font-semibold shadow-[0_8px_30px_rgba(224,122,95,0.35)] hover:shadow-[0_12px_40px_rgba(224,122,95,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          Create a trip
        </Link>
        <Link
          to="/trip/marrakech-demo"
          className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-navy border border-navy/15 font-semibold hover:border-navy/30 hover:bg-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          See a live demo
        </Link>
      </div>
      <p className="mt-9 text-xs text-navy/55 tracking-wide">
        No app to install. No account. Just a link.
      </p>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Plan your trip',
      body: 'Add your destination, travel dates, and the people you want kept in the loop. Optionally include passport, medical, and where you’re staying.',
    },
    {
      n: '02',
      title: 'Share one link',
      body: 'Tap Send to contacts. Mom, your partner, anyone you trust gets a live page — no app to download, no account to create.',
    },
    {
      n: '03',
      title: 'Stay safe together',
      body: 'Set a check-in timer. They watch a live countdown. If you don’t check in, the page escalates and emergency info appears.',
    },
  ]
  return (
    <section className="px-5 sm:px-8 py-20 sm:py-28 max-w-6xl mx-auto">
      <div className="text-center mb-14 sm:mb-16">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-navy/55 mb-4">
          How it works
        </p>
        <h2 className="font-serif font-medium text-4xl sm:text-5xl leading-[1.1] tracking-[-0.015em] max-w-3xl mx-auto">
          Three taps from{' '}
          <span className="italic text-coral">"I'm worried"</span> to{' '}
          <span className="italic">"she's safe"</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
        {steps.map((s) => (
          <article
            key={s.n}
            className="rounded-3xl bg-white border border-navy/[0.06] p-7 sm:p-8 shadow-[0_2px_24px_rgba(61,64,91,0.04)] hover:shadow-[0_8px_32px_rgba(61,64,91,0.08)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <p className="font-serif font-medium text-4xl text-coral leading-none">
              {s.n}
            </p>
            <h3 className="mt-6 font-semibold text-lg tracking-tight">
              {s.title}
            </h3>
            <p className="mt-3 text-sm text-navy/75 leading-relaxed">
              {s.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Features() {
  const items = [
    {
      eyebrow: 'Feature 01',
      title: 'Shareable trip safety page',
      body: 'Every trip lives at one URL. Anyone with the link sees real-time data — no install, no login, no code to enter. Mom keeps the page open; everything updates live.',
    },
    {
      eyebrow: 'Feature 02',
      title: 'AI safety briefing',
      body: 'Claude generates a women-specific briefing for each destination — cultural norms, harassment patterns, transport, safe areas, local emergency numbers, key local-language phrases, and a color-coded risk level. Live State Department advisories when available.',
    },
    {
      eyebrow: 'Feature 03',
      title: 'Check-in timer with escalation',
      body: 'Pick a duration. Status flows green to yellow to orange to red. At yellow, a vibrating overlay reminds you. At red, the page reveals passport and medical info to the people you trust most. All in real time, no refresh.',
    },
    {
      eyebrow: 'Feature 04',
      title: 'Offline & emergency PDFs',
      body: 'Two downloadable packets: a printable safety packet for your pocket and an "If I Go Missing" packet to hand to authorities. Generated client-side so they work offline.',
    },
  ]
  return (
    <section className="bg-white border-y border-navy/[0.06]">
      <div className="px-5 sm:px-8 py-20 sm:py-28 max-w-6xl mx-auto">
        <div className="text-center mb-14 sm:mb-16">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-navy/55 mb-4">
            What's inside
          </p>
          <h2 className="font-serif font-medium text-4xl sm:text-5xl leading-[1.1] tracking-[-0.015em]">
            Four features.{' '}
            <span className="italic text-coral">Nothing extra.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
          {items.map((f, i) => (
            <article
              key={i}
              className="rounded-3xl bg-cream/60 border border-gold/30 p-7 sm:p-9"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral mb-4">
                {f.eyebrow}
              </p>
              <h3 className="font-serif font-medium text-2xl sm:text-[28px] leading-snug tracking-tight">
                {f.title}
              </h3>
              <p className="mt-3 text-sm sm:text-[15px] text-navy/75 leading-relaxed">
                {f.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="px-5 sm:px-8 py-20 sm:py-28 max-w-3xl mx-auto text-center">
      <h2 className="font-serif font-medium text-4xl sm:text-5xl leading-tight tracking-[-0.015em]">
        Ready for your{' '}
        <span className="italic text-coral">next trip?</span>
      </h2>
      <p className="mt-5 text-lg text-navy/75 leading-relaxed">
        Setup takes about 90 seconds. Mom gets one link.
        <br className="hidden sm:block" />
        You get peace of mind.
      </p>
      <Link
        to="/create"
        className="mt-9 inline-flex items-center justify-center px-9 py-4 rounded-full bg-coral text-cream font-semibold shadow-[0_8px_30px_rgba(224,122,95,0.35)] hover:shadow-[0_12px_40px_rgba(224,122,95,0.45)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
      >
        Create your trip
      </Link>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-navy/[0.06]">
      <div className="px-5 sm:px-8 py-10 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
        <Wordmark size="sm" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-navy/55">
          <span>Built for Women Build AI Build-A-Thon 2026</span>
          <span className="hidden sm:inline text-navy/20" aria-hidden>
            ·
          </span>
          <span>Powered by Claude, Supabase, Firecrawl</span>
        </div>
      </div>
    </footer>
  )
}
