import { useState } from 'react'

export function ShareButton({
  url,
  travelerName,
}: {
  url: string
  travelerName: string
}) {
  const [copied, setCopied] = useState(false)

  const canShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function'

  async function handleClick() {
    if (canShare) {
      try {
        await navigator.share({
          title: `${travelerName}'s SheSafe Travel page`,
          text: `Follow ${travelerName}'s trip in real time on SheSafe Travel.`,
          url,
        })
        return
      } catch {
        // user cancelled the share sheet — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unsupported
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 rounded-full bg-white border border-navy/15 text-navy text-xs sm:text-sm font-medium px-3 py-1.5 hover:bg-navy/5 active:scale-95 transition"
    >
      <span aria-hidden>{copied ? '✓' : '↗'}</span>
      {copied ? 'Link copied' : canShare ? 'Send to contacts' : 'Copy link'}
    </button>
  )
}
