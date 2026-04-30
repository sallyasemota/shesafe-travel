import jsPDF from 'jspdf'
import type { Trip } from '../types/trip'

const NAVY = { r: 61, g: 64, b: 91 }
const CORAL = { r: 224, g: 122, b: 95 }
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

function drawHeader(doc: jsPDF, title: string) {
  doc.setFillColor(CORAL.r, CORAL.g, CORAL.b)
  doc.rect(0, 0, PAGE_WIDTH, 14, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(title, MARGIN, 9)
}

function drawSectionTitle(doc: jsPDF, cursor: Cursor, label: string) {
  ensureSpace(doc, cursor, 12)
  setNavy(doc)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(label, MARGIN, cursor.y)
  cursor.y += 2
  doc.setDrawColor(NAVY.r, NAVY.g, NAVY.b)
  doc.line(MARGIN, cursor.y, PAGE_WIDTH - MARGIN, cursor.y)
  cursor.y += 6
}

function drawWrappedText(
  doc: jsPDF,
  cursor: Cursor,
  text: string,
  fontSize: number,
  weight: 'normal' | 'bold' = 'normal',
  indent = 0,
) {
  setNavy(doc)
  doc.setFont('helvetica', weight)
  doc.setFontSize(fontSize)
  const lines = doc.splitTextToSize(text, USABLE_WIDTH - indent) as string[]
  ensureSpace(doc, cursor, lines.length * fontSize * 0.45)
  doc.text(lines, MARGIN + indent, cursor.y)
  cursor.y += lines.length * fontSize * 0.45 + 1
}

function drawFooter(doc: jsPDF, line1: string, line2: string) {
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setTextColor(GREY.r, GREY.g, GREY.b)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(line1, MARGIN, PAGE_HEIGHT - 14)
    doc.text(line2, MARGIN, PAGE_HEIGHT - 9)
    doc.text(
      `Page ${i} of ${totalPages}`,
      PAGE_WIDTH - MARGIN,
      PAGE_HEIGHT - 9,
      { align: 'right' },
    )
  }
}

export function generateSafetyPDF(trip: Trip): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const cursor: Cursor = { y: MARGIN }

  drawHeader(doc, 'SHESAFE TRAVEL — OFFLINE SAFETY PACKET')
  cursor.y = 24

  setNavy(doc)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(
    `${trip.destination_city}, ${trip.destination_country}`,
    MARGIN,
    cursor.y,
  )
  cursor.y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(
    `${trip.travel_dates_start} → ${trip.travel_dates_end}`,
    MARGIN,
    cursor.y,
  )
  cursor.y += 5
  doc.text(`Traveler: ${trip.traveler_name}`, MARGIN, cursor.y)
  cursor.y += 10

  // EMERGENCY NUMBERS — large font for 2 AM legibility
  drawSectionTitle(doc, cursor, 'EMERGENCY NUMBERS')

  const emergency = trip.briefing_data?.sections?.emergency_contacts

  if (emergency?.police) {
    setNavy(doc)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(`Police: ${emergency.police}`, MARGIN, cursor.y)
    cursor.y += 10
  }
  if (emergency?.ambulance) {
    doc.setFontSize(18)
    doc.text(`Ambulance: ${emergency.ambulance}`, MARGIN, cursor.y)
    cursor.y += 10
  }
  if (emergency?.fire) {
    doc.setFontSize(18)
    doc.text(`Fire: ${emergency.fire}`, MARGIN, cursor.y)
    cursor.y += 10
  }
  if (emergency?.us_embassy) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('US Embassy:', MARGIN, cursor.y)
    cursor.y += 5
    drawWrappedText(doc, cursor, emergency.us_embassy, 12, 'normal', 4)
  }
  if (
    emergency?.womens_crisis_line &&
    emergency.womens_crisis_line.toLowerCase() !== 'not available'
  ) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(
      `Women's crisis line: ${emergency.womens_crisis_line}`,
      MARGIN,
      cursor.y,
    )
    cursor.y += 8
  }
  cursor.y += 4

  // TOP TIPS
  const tips = trip.briefing_data?.top_3_tips
  if (tips && tips.length > 0) {
    drawSectionTitle(doc, cursor, 'TOP SAFETY TIPS')
    tips.forEach((tip, i) => {
      drawWrappedText(doc, cursor, `${i + 1}. ${tip}`, 11)
      cursor.y += 1
    })
    cursor.y += 4
  }

  // KEY PHRASES
  const phrases = trip.briefing_data?.phrases_to_know
  if (phrases && phrases.length > 0) {
    drawSectionTitle(doc, cursor, 'KEY PHRASES')
    phrases.forEach((p) => {
      ensureSpace(doc, cursor, 7)
      setNavy(doc)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(p.local, MARGIN, cursor.y)
      doc.setFont('helvetica', 'normal')
      const englishLines = doc.splitTextToSize(
        `— ${p.english}`,
        USABLE_WIDTH - 60,
      ) as string[]
      doc.text(englishLines, MARGIN + 60, cursor.y)
      cursor.y += Math.max(englishLines.length * 5, 5) + 1
    })
    cursor.y += 4
  }

  // YOUR EMERGENCY CONTACTS
  const contacts = (trip.emergency_contacts ?? []).filter(
    (c) => c?.name && c?.phone,
  )
  if (contacts.length > 0) {
    drawSectionTitle(doc, cursor, 'YOUR EMERGENCY CONTACTS')
    contacts.forEach((c) => {
      ensureSpace(doc, cursor, 12)
      setNavy(doc)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(`${c.name}${c.relationship ? ` — ${c.relationship}` : ''}`, MARGIN, cursor.y)
      cursor.y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(13)
      doc.text(c.phone, MARGIN + 4, cursor.y)
      cursor.y += 8
    })
    cursor.y += 2
  }

  if (trip.traveler_phone) {
    drawSectionTitle(doc, cursor, 'TRAVELER PHONE')
    setNavy(doc)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(trip.traveler_phone, MARGIN, cursor.y)
    cursor.y += 10
  }

  if (trip.hotel_name || trip.hotel_address || trip.hotel_phone) {
    drawSectionTitle(doc, cursor, "WHERE I'M STAYING")
    setNavy(doc)
    if (trip.hotel_name) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text(trip.hotel_name, MARGIN, cursor.y)
      cursor.y += 6
    }
    if (trip.hotel_address) {
      drawWrappedText(doc, cursor, trip.hotel_address, 12, 'normal')
    }
    if (trip.hotel_phone) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text(trip.hotel_phone, MARGIN, cursor.y)
      cursor.y += 8
    }
  }

  drawFooter(
    doc,
    'If you need help, call these numbers first.',
    `Generated by SheSafe Travel on ${new Date().toLocaleDateString()}`,
  )

  doc.save(
    `shesafe-safety-${trip.destination_city.toLowerCase().replace(/\s+/g, '-')}-${trip.share_code}.pdf`,
  )
}
