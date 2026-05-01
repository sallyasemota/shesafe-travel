import { Fragment, useState, type FormEventHandler } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { COUNTRY_OPTIONS } from '../lib/countries'
import { supabase } from '../lib/supabase'
import type { EmergencyContact } from '../types/trip'

const inputBase =
  'w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-navy placeholder-navy/40 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30'

const labelBase = 'block text-sm font-medium text-navy mb-1'

const emptyContact: EmergencyContact = { name: '', phone: '', relationship: '' }

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const SHARE_CODE_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function generateShareCode(length = 8): string {
  const buf = new Uint8Array(length)
  crypto.getRandomValues(buf)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += SHARE_CODE_ALPHABET[buf[i] % SHARE_CODE_ALPHABET.length]
  }
  return out
}

function csvToList(s: string): string[] {
  return s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

const STEP_LABELS = ['Trip', 'Contacts', 'Emergency Info'] as const

interface CreatedTripSummary {
  shareCode: string
  travelerName: string
  city: string
  country: string
}

export default function CreateTrip() {
  const navigate = useNavigate()

  const [success, setSuccess] = useState<CreatedTripSummary | null>(null)

  const [travelerName, setTravelerName] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [travelerPhone, setTravelerPhone] = useState('')
  const [homeCountry, setHomeCountry] = useState('')
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { ...emptyContact },
  ])

  const [showOptional, setShowOptional] = useState(false)
  const [passportNumber, setPassportNumber] = useState('')
  const [passportCountry, setPassportCountry] = useState('')
  const [allergies, setAllergies] = useState('')
  const [medications, setMedications] = useState('')
  const [bloodType, setBloodType] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [hotelName, setHotelName] = useState('')
  const [hotelAddress, setHotelAddress] = useState('')
  const [hotelPhone, setHotelPhone] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const goBack = () => {
    setErrorMsg(null)
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))
  }

  const addContact = () => {
    if (contacts.length < 3) setContacts([...contacts, { ...emptyContact }])
  }

  const removeContact = (idx: number) => {
    setContacts(contacts.filter((_, i) => i !== idx))
  }

  const updateContact = (
    idx: number,
    field: keyof EmergencyContact,
    value: string,
  ) => {
    setContacts(
      contacts.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    )
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setErrorMsg(null)

    if (step === 1) {
      if (endDate && startDate && endDate < startDate) {
        setErrorMsg('End date must be on or after the start date.')
        return
      }
      setStep(2)
      return
    }

    if (step === 2) {
      setStep(3)
      return
    }

    setSubmitting(true)

    try {
      const filteredContacts = contacts.filter(
        (c) => c.name.trim() && c.phone.trim(),
      )

      const passportInfo =
        passportNumber.trim() || passportCountry.trim()
          ? {
              number: passportNumber.trim() || undefined,
              issuing_country: passportCountry.trim() || undefined,
            }
          : null

      const allergiesList = csvToList(allergies)
      const medicationsList = csvToList(medications)
      const medicalInfo =
        allergiesList.length || medicationsList.length || bloodType
          ? {
              allergies: allergiesList,
              medications: medicationsList,
              blood_type: bloodType || undefined,
            }
          : null

      const shareCode = generateShareCode()

      const { error } = await supabase.from('trips').insert({
        traveler_name: travelerName.trim(),
        destination_city: city.trim(),
        destination_country: country.trim(),
        travel_dates_start: startDate,
        travel_dates_end: endDate,
        traveler_phone: travelerPhone.trim() || null,
        traveler_home_country: homeCountry.trim() || null,
        emergency_contacts: filteredContacts,
        medical_info: medicalInfo,
        passport_info: passportInfo,
        traveler_photo_url: photoUrl.trim() || null,
        hotel_name: hotelName.trim() || null,
        hotel_address: hotelAddress.trim() || null,
        hotel_phone: hotelPhone.trim() || null,
        share_code: shareCode,
        check_in_status: 'inactive',
      })

      if (error) throw error

      try {
        window.localStorage.setItem(`shesafe:traveler:${shareCode}`, '1')
      } catch {
        // localStorage unavailable — non-fatal
      }

      void fetch('/api/generate-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareCode,
          destinationCity: city.trim(),
          destinationCountry: country.trim(),
          travelDatesStart: startDate,
          travelDatesEnd: endDate,
          travelerHomeCountry: homeCountry.trim() || null,
        }),
      }).catch(() => {})

      setSuccess({
        shareCode,
        travelerName: travelerName.trim(),
        city: city.trim(),
        country: country.trim(),
      })
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Could not create trip. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-full bg-cream text-navy font-sans antialiased">
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

      {success ? (
        <SuccessScreen data={success} onView={() => navigate(`/trip/${success.shareCode}`)} />
      ) : (
        <>
      <section className="px-5 sm:px-8 pt-12 sm:pt-16 pb-8 max-w-2xl mx-auto text-center">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-coral mb-5">
          New trip
        </p>
        <h1 className="font-serif font-medium text-4xl sm:text-5xl leading-[1.1] tracking-[-0.015em]">
          Plan your <span className="italic text-coral">trip</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-navy/75 leading-relaxed max-w-lg mx-auto">
          Three quick steps. Setup takes about 90 seconds.
        </p>
      </section>

      <section className="px-5 sm:px-8 pb-20">
        <div className="max-w-2xl mx-auto">
          <ProgressBar step={step} />

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-gold/30 p-6 md:p-8"
          >
            <div
              key={step}
              className="step-in animate-[step-in_280ms_ease-out] space-y-6"
            >
              {step === 1 && (
                <>
                  <div className="space-y-1.5">
                    <h2 className="font-serif font-medium text-2xl sm:text-[28px] tracking-tight">
                      Your <span className="italic text-coral">trip</span>
                    </h2>
                    <p className="text-sm text-navy/70">
                      Where you're going and when.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={labelBase} htmlFor="travelerName">
                        Your name
                      </label>
                      <input
                        id="travelerName"
                        type="text"
                        required
                        value={travelerName}
                        onChange={(e) => setTravelerName(e.target.value)}
                        placeholder="e.g. Sally"
                        className={inputBase}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelBase} htmlFor="city">
                          Destination city
                        </label>
                        <input
                          id="city"
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Marrakech"
                          className={inputBase}
                        />
                      </div>
                      <div>
                        <label className={labelBase} htmlFor="country">
                          Destination country
                        </label>
                        <input
                          id="country"
                          type="text"
                          required
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="Morocco"
                          className={inputBase}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelBase} htmlFor="startDate">
                          Start date
                        </label>
                        <input
                          id="startDate"
                          type="date"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className={inputBase}
                        />
                      </div>
                      <div>
                        <label className={labelBase} htmlFor="endDate">
                          End date
                        </label>
                        <input
                          id="endDate"
                          type="date"
                          required
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className={inputBase}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-1.5">
                    <h2 className="font-serif font-medium text-2xl sm:text-[28px] tracking-tight">
                      Your{' '}
                      <span className="italic text-coral">safety circle</span>
                    </h2>
                    <p className="text-sm text-navy/70">
                      These are the people who'll have your back.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-base font-semibold text-navy">
                        Emergency contacts
                      </h3>
                      <span className="text-xs text-navy/60">
                        {contacts.length} of 3
                      </span>
                    </div>

                    {contacts.map((c, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-navy/10 bg-cream/50 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-navy/80">
                            Contact {i + 1}
                          </p>
                          {contacts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeContact(i)}
                              className="text-xs text-coral hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="Name"
                            required
                            value={c.name}
                            onChange={(e) =>
                              updateContact(i, 'name', e.target.value)
                            }
                            className={inputBase}
                          />
                          <input
                            type="tel"
                            placeholder="Phone"
                            required
                            value={c.phone}
                            onChange={(e) =>
                              updateContact(i, 'phone', e.target.value)
                            }
                            className={inputBase}
                          />
                          <input
                            type="text"
                            placeholder="Relationship"
                            required
                            value={c.relationship}
                            onChange={(e) =>
                              updateContact(i, 'relationship', e.target.value)
                            }
                            className={inputBase}
                          />
                        </div>
                      </div>
                    ))}

                    {contacts.length < 3 && (
                      <button
                        type="button"
                        onClick={addContact}
                        className="text-sm font-medium text-coral hover:underline"
                      >
                        + Add another contact
                      </button>
                    )}
                  </div>

                  <div>
                    <label className={labelBase} htmlFor="travelerPhone">
                      Your phone number
                    </label>
                    <input
                      id="travelerPhone"
                      type="tel"
                      required
                      value={travelerPhone}
                      onChange={(e) => setTravelerPhone(e.target.value)}
                      placeholder="+1 555 123 4567"
                      className={inputBase}
                    />
                    <p className="mt-1 text-xs text-navy/60">
                      Used by the "Call Her" button on your shared page.
                    </p>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-1.5">
                    <h2 className="font-serif font-medium text-2xl sm:text-[28px] tracking-tight">
                      Emergency info{' '}
                      <span className="italic text-navy/55 text-xl">
                        (optional)
                      </span>
                    </h2>
                    <p className="text-sm text-navy/70">
                      Information that's only revealed to your safety circle if
                      your check-in timer expires.
                    </p>
                  </div>

                  <div>
                    <label className={labelBase} htmlFor="homeCountry">
                      Your passport country
                    </label>
                    <input
                      id="homeCountry"
                      type="text"
                      list="home-country-options"
                      value={homeCountry}
                      onChange={(e) => setHomeCountry(e.target.value)}
                      placeholder="Start typing — e.g. United States, Nigeria, Germany"
                      autoComplete="country-name"
                      className={inputBase}
                    />
                    <datalist id="home-country-options">
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                    <p className="mt-1 text-xs text-navy/60">
                      Drives which embassy appears in your safety briefing.
                      Type any country — the list is a suggestion.
                    </p>
                  </div>

                  <p className="text-xs text-navy/70 leading-relaxed bg-gold/15 border border-gold/40 rounded-md p-3">
                    Your passport and medical info is optional and stored for
                    emergency purposes only. We do not sell or share this data.
                    Sensitive information is only visible to your emergency
                    contacts if your check-in timer expires.
                  </p>

                  <div className="rounded-lg border border-navy/10 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowOptional((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-navy/5 hover:bg-navy/10 transition text-left"
                      aria-expanded={showOptional}
                      aria-controls="optional-emergency-info"
                    >
                      <span className="font-medium">
                        Passport, medical & accommodation
                      </span>
                      <span className="text-coral text-sm font-medium">
                        {showOptional ? 'Hide' : 'Show'}
                      </span>
                    </button>

                    {showOptional && (
                      <div
                        id="optional-emergency-info"
                        className="p-4 md:p-5 space-y-4 bg-white"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label
                              className={labelBase}
                              htmlFor="passportNumber"
                            >
                              Passport number
                            </label>
                            <input
                              id="passportNumber"
                              type="text"
                              autoComplete="off"
                              value={passportNumber}
                              onChange={(e) => setPassportNumber(e.target.value)}
                              className={inputBase}
                            />
                          </div>
                          <div>
                            <label
                              className={labelBase}
                              htmlFor="passportCountry"
                            >
                              Passport issuing country
                            </label>
                            <input
                              id="passportCountry"
                              type="text"
                              value={passportCountry}
                              onChange={(e) =>
                                setPassportCountry(e.target.value)
                              }
                              className={inputBase}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={labelBase} htmlFor="allergies">
                            Medical allergies
                          </label>
                          <input
                            id="allergies"
                            type="text"
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                            placeholder="Comma separated, e.g. peanuts, penicillin"
                            className={inputBase}
                          />
                        </div>

                        <div>
                          <label className={labelBase} htmlFor="medications">
                            Current medications
                          </label>
                          <input
                            id="medications"
                            type="text"
                            value={medications}
                            onChange={(e) => setMedications(e.target.value)}
                            placeholder="Comma separated"
                            className={inputBase}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelBase} htmlFor="bloodType">
                              Blood type
                            </label>
                            <select
                              id="bloodType"
                              value={bloodType}
                              onChange={(e) => setBloodType(e.target.value)}
                              className={inputBase}
                            >
                              <option value="">—</option>
                              {BLOOD_TYPES.map((bt) => (
                                <option key={bt} value={bt}>
                                  {bt}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelBase} htmlFor="photoUrl">
                              Photo URL
                            </label>
                            <input
                              id="photoUrl"
                              type="url"
                              value={photoUrl}
                              onChange={(e) => setPhotoUrl(e.target.value)}
                              placeholder="https://..."
                              className={inputBase}
                            />
                          </div>
                        </div>

                        <div className="border-t border-navy/10 pt-4 mt-2 space-y-4">
                          <p className="text-xs uppercase tracking-wider text-navy/60 font-semibold">
                            Where you're staying
                          </p>

                          <div>
                            <label className={labelBase} htmlFor="hotelName">
                              Hotel / accommodation name
                            </label>
                            <input
                              id="hotelName"
                              type="text"
                              value={hotelName}
                              onChange={(e) => setHotelName(e.target.value)}
                              placeholder="e.g. Riad Yasmine"
                              className={inputBase}
                            />
                          </div>

                          <div>
                            <label
                              className={labelBase}
                              htmlFor="hotelAddress"
                            >
                              Address
                            </label>
                            <input
                              id="hotelAddress"
                              type="text"
                              value={hotelAddress}
                              onChange={(e) => setHotelAddress(e.target.value)}
                              placeholder="Street, neighborhood"
                              className={inputBase}
                            />
                          </div>

                          <div>
                            <label className={labelBase} htmlFor="hotelPhone">
                              Hotel phone
                            </label>
                            <input
                              id="hotelPhone"
                              type="tel"
                              value={hotelPhone}
                              onChange={(e) => setHotelPhone(e.target.value)}
                              placeholder="+212 ..."
                              className={inputBase}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="mt-6 rounded-md border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral"
              >
                {errorMsg}
              </div>
            )}

            <div className="mt-8">
              {step === 1 ? (
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full bg-coral text-cream font-semibold shadow hover:opacity-90 active:scale-[0.99] transition disabled:opacity-50"
                >
                  Next <span aria-hidden className="ml-1">→</span>
                </button>
              ) : (
                <div className="grid grid-cols-[auto_1fr] gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={submitting}
                    className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-white text-navy border border-navy/15 font-semibold hover:bg-navy/5 active:scale-[0.99] transition disabled:opacity-50"
                  >
                    <span aria-hidden className="mr-1">
                      ←
                    </span>{' '}
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center px-4 py-3 rounded-full bg-coral text-cream font-semibold shadow hover:opacity-90 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {step === 3
                      ? submitting
                        ? 'Creating…'
                        : 'Create my plan'
                      : 'Next →'}
                  </button>
                </div>
              )}
            </div>
          </form>

          <p className="mt-4 text-center text-xs text-navy/60">
            Your trip details are encrypted and only visible via your unique
            link.
          </p>
        </div>
      </section>
        </>
      )}

      <footer className="px-5 sm:px-8 pb-10 max-w-2xl mx-auto text-center space-y-1">
        <p className="text-xs text-navy/55">
          Built by{' '}
          <span className="font-semibold text-navy/75">Sally Asemota</span>
          <span className="text-navy/30 mx-1.5" aria-hidden>·</span>
          Built for Women Build AI Build-A-Thon 2026
        </p>
        <p className="text-xs text-navy/45">
          Powered by Claude, Supabase, Firecrawl
        </p>
      </footer>
    </main>
  )
}

function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol
      className="flex items-start justify-between gap-1 max-w-md mx-auto mb-6 px-1"
      aria-label={`Step ${step} of 3`}
    >
      {STEP_LABELS.map((label, i) => {
        const num = (i + 1) as 1 | 2 | 3
        const status = num < step ? 'done' : num === step ? 'current' : 'upcoming'
        const isLast = i === STEP_LABELS.length - 1
        return (
          <Fragment key={label}>
            <li className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-0">
              <span
                aria-current={status === 'current' ? 'step' : undefined}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-200 ${
                  status === 'current'
                    ? 'bg-coral text-cream ring-4 ring-coral/20 scale-105'
                    : status === 'done'
                      ? 'bg-coral text-cream'
                      : 'bg-navy/10 text-navy/50'
                }`}
              >
                {status === 'done' ? (
                  <span aria-hidden>✓</span>
                ) : (
                  num
                )}
              </span>
              <span
                className={`text-[11px] font-medium tracking-wide whitespace-nowrap ${
                  status === 'upcoming' ? 'text-navy/50' : 'text-navy'
                }`}
              >
                {label}
              </span>
            </li>
            {!isLast && (
              <li
                aria-hidden
                className="flex-1 mt-4 min-w-[24px]"
              >
                <div
                  className={`h-0.5 rounded-full transition-colors duration-300 ${
                    num < step ? 'bg-coral' : 'bg-navy/10'
                  }`}
                />
              </li>
            )}
          </Fragment>
        )
      })}
    </ol>
  )
}

function SuccessScreen({
  data,
  onView,
}: {
  data: CreatedTripSummary
  onView: () => void
}) {
  const [copied, setCopied] = useState(false)

  const fullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/trip/${data.shareCode}`
      : `https://shesafe-travel.vercel.app/trip/${data.shareCode}`
  const displayUrl = fullUrl.replace(/^https?:\/\//, '')

  const shareMessage = `I'm using SheSafe Travel for my trip to ${data.city}. You can see my trip status, AI safety briefing, and emergency info here: ${fullUrl}`
  const emailSubject = `My SheSafe Travel trip to ${data.city}`

  const smsHref = `sms:?body=${encodeURIComponent(shareMessage)}`
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`
  const mailHref = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(shareMessage)}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unsupported — silent
    }
  }

  return (
    <section className="px-5 sm:px-8 pt-10 sm:pt-14 pb-16 max-w-2xl mx-auto">
      <div className="text-center space-y-5">
        <div
          aria-hidden
          className="mx-auto inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500 text-white text-4xl shadow-[0_12px_32px_rgba(16,185,129,0.35)] [animation:check-pulse_900ms_ease-out]"
        >
          ✓
        </div>
        <div className="space-y-2">
          <h1 className="font-serif font-medium text-3xl sm:text-4xl leading-[1.1] tracking-[-0.015em]">
            Your safety plan is ready!{' '}
            <span aria-hidden className="text-emerald-600">
              ✓
            </span>
          </h1>
          <p className="text-base sm:text-lg text-navy/75">
            <span className="font-semibold">{data.travelerName}'s</span> trip to{' '}
            <span className="italic text-coral">
              {data.city}, {data.country}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-9 rounded-2xl bg-white border border-gold/40 shadow-sm p-5 sm:p-6 space-y-3">
        <p className="text-xs uppercase tracking-wider text-navy/60 font-semibold">
          Your trip link
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex-1 min-w-0 rounded-xl border border-navy/15 bg-cream/50 px-4 py-3 font-mono text-sm text-navy break-all">
            {displayUrl}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={`shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full font-semibold text-sm px-5 py-3 min-h-[44px] transition-colors ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-coral text-cream hover:opacity-90'
            }`}
          >
            <span aria-hidden>{copied ? '✓' : '📋'}</span>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
        <p className="text-sm text-navy/70 leading-relaxed pt-1">
          Send this link to your safety circle. They'll see your trip status,
          safety briefing, and emergency info — no app needed.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <ShareLinkButton
          href={smsHref}
          icon="📱"
          label="Text"
        />
        <ShareLinkButton
          href={whatsappHref}
          icon="💬"
          label="WhatsApp"
          external
        />
        <ShareLinkButton
          href={mailHref}
          icon="📧"
          label="Email"
        />
      </div>

      <button
        type="button"
        onClick={onView}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-coral text-cream font-semibold text-base shadow-[0_8px_30px_rgba(224,122,95,0.35)] hover:shadow-[0_12px_40px_rgba(224,122,95,0.45)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
      >
        View your trip page <span aria-hidden>→</span>
      </button>

      <p className="mt-6 text-center text-xs text-navy/55 italic">
        Bookmark this page — you'll check in from your trip page during your
        trip.
      </p>
    </section>
  )
}

function ShareLinkButton({
  href,
  icon,
  label,
  external,
}: {
  href: string
  icon: string
  label: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="inline-flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-2xl border border-navy/15 bg-white px-3 py-3 text-sm font-semibold text-navy hover:border-coral hover:text-coral active:scale-[0.99] transition-colors"
    >
      <span aria-hidden className="text-lg">
        {icon}
      </span>
      {label}
    </a>
  )
}
