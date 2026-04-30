import jsPDF from 'jspdf'
import type { Trip } from '../types/trip'

const NAVY = { r: 61, g: 64, b: 91 }
const RED = { r: 185, g: 28, b: 28 }
const GREY = { r: 110, g: 110, b: 110 }

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 15
const USABLE_WIDTH = PAGE_WIDTH - MARGIN * 2

interface Cursor {
  y: number
}

function ensureSpace(doc: jsPDF, cursor: Cursor, needed: number) {
  if (cursor.y + needed > PAGE_HEIGHT - 25) {
    doc.addPage()
    cursor.y = MARGIN
  }
}

function setNavy(doc: jsPDF) {
  doc.setTextColor(NAVY.r, NAVY.g, NAVY.b)
}

function setRed(doc: jsPDF) {
  doc.setTextColor(RED.r, RED.g, RED.b)
}

function drawSectionTitle(doc: jsPDF, cursor: Cursor, label: string) {
  ensureSpace(doc, cursor, 12)
  setRed(doc)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(label, MARGIN, cursor.y)
  cursor.y += 2
  doc.setDrawColor(RED.r, RED.g, RED.b)
  doc.line(MARGIN, cursor.y, PAGE_WIDTH - MARGIN, cursor.y)
  cursor.y += 6
}

function drawKeyValue(
  doc: jsPDF,
  cursor: Cursor,
  label: string,
  value: string,
) {
  ensureSpace(doc, cursor, 8)
  setNavy(doc)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(`${label}:`, MARGIN, cursor.y)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(value, USABLE_WIDTH - 50) as string[]
  doc.text(lines, MARGIN + 50, cursor.y)
  cursor.y += Math.max(lines.length * 5, 5) + 2
}

export function generateEmergencyPDF(trip: Trip): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const cursor: Cursor = { y: MARGIN }

  // Red header bar — louder than the safety packet
  doc.setFillColor(RED.r, RED.g, RED.b)
  doc.rect(0, 0, PAGE_WIDTH, 16, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('EMERGENCY — IF I GO MISSING', MARGIN, 10)
  cursor.y = 26

  // TRAVELER
  drawSectionTitle(doc, cursor, 'TRAVELER')
  drawKeyValue(doc, cursor, 'Full name', trip.traveler_name)
  if (trip.traveler_phone) {
    drawKeyValue(doc, cursor, 'Phone', trip.traveler_phone)
  }
  if (trip.traveler_photo_url) {
    drawKeyValue(doc, cursor, 'Photo URL', trip.traveler_photo_url)
  } else {
    drawKeyValue(
      doc,
      cursor,
      'Photo',
      'No photo on file. Request from emergency contacts.',
    )
  }
  cursor.y += 2

  // PASSPORT
  const passport = trip.passport_info
  if (passport && (passport.number || passport.issuing_country)) {
    drawSectionTitle(doc, cursor, 'PASSPORT')
    if (passport.number) drawKeyValue(doc, cursor, 'Number', passport.number)
    if (passport.issuing_country)
      drawKeyValue(doc, cursor, 'Issued by', passport.issuing_country)
    if (passport.expiry_date)
      drawKeyValue(doc, cursor, 'Expires', passport.expiry_date)
    cursor.y += 2
  }

  // MEDICAL
  const medical = trip.medical_info
  const hasMedical =
    medical &&
    (medical.blood_type ||
      (medical.allergies && medical.allergies.length > 0) ||
      (medical.medications && medical.medications.length > 0) ||
      (medical.conditions && medical.conditions.length > 0))
  if (hasMedical) {
    drawSectionTitle(doc, cursor, 'MEDICAL')
    if (medical?.blood_type)
      drawKeyValue(doc, cursor, 'Blood type', medical.blood_type)
    if (medical?.allergies && medical.allergies.length > 0)
      drawKeyValue(doc, cursor, 'Allergies', medical.allergies.join(', '))
    if (medical?.medications && medical.medications.length > 0)
      drawKeyValue(doc, cursor, 'Medications', medical.medications.join(', '))
    if (medical?.conditions && medical.conditions.length > 0)
      drawKeyValue(doc, cursor, 'Conditions', medical.conditions.join(', '))
    cursor.y += 2
  }

  // TRIP
  drawSectionTitle(doc, cursor, 'TRIP')
  drawKeyValue(
    doc,
    cursor,
    'Destination',
    `${trip.destination_city}, ${trip.destination_country}`,
  )
  drawKeyValue(
    doc,
    cursor,
    'Dates',
    `${trip.travel_dates_start} to ${trip.travel_dates_end}`,
  )
  cursor.y += 2

  // LAST KNOWN ACCOMMODATION
  if (trip.hotel_name || trip.hotel_address || trip.hotel_phone) {
    drawSectionTitle(doc, cursor, 'LAST KNOWN ACCOMMODATION')
    if (trip.hotel_name) drawKeyValue(doc, cursor, 'Name', trip.hotel_name)
    if (trip.hotel_address)
      drawKeyValue(doc, cursor, 'Address', trip.hotel_address)
    if (trip.hotel_phone) drawKeyValue(doc, cursor, 'Phone', trip.hotel_phone)
    cursor.y += 2
  }

  // LOCAL EMERGENCY (police + embassy)
  const emergency = trip.briefing_data?.sections?.emergency_contacts
  if (emergency) {
    drawSectionTitle(doc, cursor, 'LOCAL EMERGENCY NUMBERS')
    if (emergency.police) drawKeyValue(doc, cursor, 'Police', emergency.police)
    if (emergency.ambulance)
      drawKeyValue(doc, cursor, 'Ambulance', emergency.ambulance)
    if (emergency.fire) drawKeyValue(doc, cursor, 'Fire', emergency.fire)
    if (emergency.us_embassy)
      drawKeyValue(doc, cursor, 'Embassy', emergency.us_embassy)
    if (
      emergency.womens_crisis_line &&
      emergency.womens_crisis_line.toLowerCase() !== 'not available'
    ) {
      drawKeyValue(doc, cursor, "Women's crisis", emergency.womens_crisis_line)
    }
    cursor.y += 2
  }

  // EMERGENCY CONTACTS
  const contacts = (trip.emergency_contacts ?? []).filter(
    (c) => c?.name && c?.phone,
  )
  if (contacts.length > 0) {
    drawSectionTitle(doc, cursor, 'EMERGENCY CONTACTS — CALL THESE PEOPLE')
    contacts.forEach((c) => {
      ensureSpace(doc, cursor, 12)
      setNavy(doc)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(
        `${c.name}${c.relationship ? ` — ${c.relationship}` : ''}`,
        MARGIN,
        cursor.y,
      )
      cursor.y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(13)
      doc.text(c.phone, MARGIN + 4, cursor.y)
      cursor.y += 8
    })
  }

  // Footer on every page
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    // Action statement — bold red, above the meta footer
    setRed(doc)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    const actionLines = doc.splitTextToSize(
      'Provide this document to local police and the embassy immediately. Also call the emergency contacts listed above.',
      USABLE_WIDTH,
    ) as string[]
    doc.text(actionLines, MARGIN, PAGE_HEIGHT - 24)

    // Meta footer — small grey
    doc.setTextColor(GREY.r, GREY.g, GREY.b)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(
      `Issued ${new Date().toLocaleDateString()} for ${trip.traveler_name} — for emergency use only`,
      MARGIN,
      PAGE_HEIGHT - 9,
    )
    doc.text(
      `Page ${i} of ${totalPages}`,
      PAGE_WIDTH - MARGIN,
      PAGE_HEIGHT - 9,
      { align: 'right' },
    )
  }

  doc.save(
    `shesafe-emergency-${trip.traveler_name.toLowerCase().replace(/\s+/g, '-')}-${trip.share_code}.pdf`,
  )
}
