import type { BriefingData, CheckIn } from '../types/trip'

export const DEMO_SHARE_CODE = 'marrakech-demo'

// Three synthetic check-ins anchored to the moment the page loaded.
// They display as recent daytime check-ins regardless of when the demo
// is opened, instead of inheriting the seed's UTC timestamps which
// rendered as "12:11 AM" etc. for US viewers.
export function buildDemoCheckIns(tripId: string, nowMs: number): CheckIn[] {
  const minute = 60_000
  const hour = 60 * minute
  const seeds: Array<{ deltaMs: number; message: string }> = [
    { deltaMs: 12 * minute, message: 'Just had the best tagine at a rooftop cafe! 🧡' },
    { deltaMs: 4 * hour, message: "Walking through the medina — it's beautiful here." },
    { deltaMs: 6 * hour, message: 'Arrived at the riad, all settled in.' },
  ]
  return seeds.map((s, i) => ({
    id: `demo-checkin-${i}`,
    trip_id: tripId,
    status: 'safe',
    message: s.message,
    created_at: new Date(nowMs - s.deltaMs).toISOString(),
  }))
}

export const DEMO_BRIEFING: BriefingData = {
  overall_risk_level: 'Moderate',
  risk_score: 3,
  last_updated: '2026-05-01',
  data_source: 'demo',
  sections: {
    safety_overview:
      "Marrakech is one of Morocco's most-visited cities and is generally safe for solo women travelers. Persistent street harassment in the medina is the main quality-of-life concern, alongside petty theft (bag-snatching from mopeds) and tourist scams. Violent crime against tourists is rare. Stay alert in the souks and stick to busy streets after dark.",
    cultural_norms_for_women:
      "Modest dress is strongly expected — cover shoulders and knees, especially in the medina. A light scarf is essential for entering mosques. Saying 'la, shukran' (no, thank you) firmly to street vendors is necessary; engaging in conversation is interpreted as interest. Women dining alone may be seated near the back of restaurants — request a different table if you'd prefer.",
    harassment_and_scam_patterns:
      "Catcalling and persistent following are common in the medina, especially after dark. The 'fake guide' scam is widespread — strangers offer to lead you somewhere then demand large fees. Tannery 'guides' will try to pull you into leather shops. Always ask for prices before agreeing to anything; haggle to roughly 30-40% of the opening price.",
    transport_safety:
      "Taxis: insist on the meter ('compteur'); a fair price from the airport to the medina is around 100 MAD. Use Heetch or InDriver apps for app-hailed rides. Avoid driving yourself — the medina is car-free and traffic outside is chaotic. Don't accept rides from unmarked cars.",
    safe_areas:
      'Gueliz (the Ville Nouvelle / new city) is the most comfortable area for solo women — wide boulevards, cafes, and a relaxed atmosphere. The Hivernage district near major hotels is also safe at night. Within the medina, Mouassine and the area around Maison de la Photographie are relatively tourist-friendly. Avoid Bab Doukkala and the tanneries district after dark. Jemaa el-Fna is safe during the day but turns aggressive toward solo women after 9 PM.',
    emergency_contacts: {
      police: '19',
      ambulance: '15',
      fire: '15',
      embassy:
        'US Consulate General Casablanca: +212 522-64-20-00, 8 Boulevard Moulay Youssef, Casablanca — handles consular services for Marrakech.',
      womens_crisis_line: 'Not available',
    },
    health_and_medical:
      'For serious medical needs, go to Polyclinique du Sud (Gueliz) or Clinique Yasmine — both have English-speaking staff. Pharmacies (pharmacies de garde) are open 24/7 on a rotating basis; check signs in any pharmacy window. Tap water is not safe to drink; use bottled water for brushing teeth too.',
    communication:
      'Buy a Maroc Telecom or Orange Maroc SIM at the airport arrivals hall (~100 MAD for data); coverage is strong throughout Marrakech. WhatsApp is the dominant communication app locally. Download offline maps via Maps.me with the Marrakech medina map pre-loaded — Google Maps has gaps in medina alleyways. The emergency tourist police line is +212 (0)524-384-601.',
    what_to_wear:
      'Loose, breathable linen or cotton that covers shoulders and knees is ideal — both culturally respectful and reduces street harassment. A light scarf is essential to cover hair when entering mosques or more conservative neighborhoods. Avoid sleeveless tops and short skirts in the medina; in Gueliz cafes and rooftop restaurants, smart casual is fine. Comfortable closed-toe walking shoes for cobblestone medina streets.',
    solo_dining_and_nightlife:
      "For dinner: Kasbah Cafe, Le Jardin Secret, and Nomad (rooftop terrace) are all comfortable for solo women. Avoid the cheap food stalls in Jemaa el-Fna at night. For drinks: Le Salama and Sky Bar at La Mamounia are safe and tourist-friendly. Ride-hail back to your hotel after 10 PM — don't walk the medina alone.",
  },
  top_3_tips: [
    "Treat 'la, shukran' as a firm magic phrase. Saying it once and walking away ends 90% of street harassment without escalating it.",
    'Always agree on taxi fare or insist on the meter BEFORE getting in. The going rate from the airport to the medina is 100 MAD.',
    "Download Maps.me offline before you arrive — Google Maps regularly fails in medina alleyways and you don't want to be lost there at night.",
  ],
  phrases_to_know: [
    { local: 'Barra', english: 'Leave me alone (firm boundary)' },
    { local: 'La, shukran', english: 'No, thank you (firm)' },
    { local: 'Bshhal hada?', english: 'How much is this?' },
    { local: 'Smahli', english: 'Excuse me / Sorry' },
    { local: 'Mn fadlik', english: 'Please / If you would' },
  ],
}
