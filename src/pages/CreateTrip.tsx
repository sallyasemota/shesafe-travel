import { useState, type FormEventHandler } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function CreateTrip() {
  const navigate = useNavigate()

  const [travelerName, setTravelerName] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [travelerPhone, setTravelerPhone] = useState('')
  const [contacts, setContacts] = useState<EmergencyContact[]>([{ ...emptyContact }])

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

    if (endDate && startDate && endDate < startDate) {
      setErrorMsg('End date must be on or after the start date.')
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
        }),
      }).catch(() => {})

      navigate(`/trip/${shareCode}`)
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
    <main className="min-h-full bg-cream text-navy">
      <section className="px-6 pt-16 pb-10 text-center">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">
          SheSafe <span className="text-coral">Travel</span>
        </h1>
        <p className="mt-4 text-lg md:text-xl text-navy/80 max-w-xl mx-auto">
          Don't just travel safe.{' '}
          <span className="text-coral font-medium">Travel connected.</span>
        </p>
      </section>

      <section className="px-6 pb-20">
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto space-y-8 bg-white rounded-2xl shadow-sm border border-gold/30 p-6 md:p-8"
        >
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Trip details</h2>

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

          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">Emergency contacts</h2>
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
                    onChange={(e) => updateContact(i, 'name', e.target.value)}
                    className={inputBase}
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    required
                    value={c.phone}
                    onChange={(e) => updateContact(i, 'phone', e.target.value)}
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

          <p className="text-xs text-navy/70 leading-relaxed bg-gold/15 border border-gold/40 rounded-md p-3">
            Your passport and medical info is optional and stored for emergency
            purposes only. We do not sell or share this data. Sensitive
            information is only visible to your emergency contacts if your
            check-in timer expires.
          </p>

          <div className="rounded-lg border border-navy/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowOptional((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-navy/5 hover:bg-navy/10 transition text-left"
              aria-expanded={showOptional}
              aria-controls="optional-emergency-info"
            >
              <span className="font-medium">Emergency info (optional)</span>
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
                    <label className={labelBase} htmlFor="passportNumber">
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
                    <label className={labelBase} htmlFor="passportCountry">
                      Passport issuing country
                    </label>
                    <input
                      id="passportCountry"
                      type="text"
                      value={passportCountry}
                      onChange={(e) => setPassportCountry(e.target.value)}
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
                    <label className={labelBase} htmlFor="hotelAddress">
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

          {errorMsg && (
            <div
              role="alert"
              className="rounded-md border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral"
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full bg-coral text-cream font-semibold shadow hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating your safety plan…' : 'Create My Safety Plan'}
          </button>
        </form>

        <p className="max-w-2xl mx-auto mt-4 text-center text-xs text-navy/60">
          Your trip details are encrypted and only visible via your unique link.
        </p>
      </section>
    </main>
  )
}
