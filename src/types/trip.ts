export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export interface MedicalInfo {
  allergies?: string[]
  medications?: string[]
  blood_type?: string
  conditions?: string[]
}

export interface PassportInfo {
  number?: string
  issuing_country?: string
  expiry_date?: string
}

export type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

export interface BriefingEmergencyContacts {
  police?: string
  ambulance?: string
  fire?: string
  us_embassy?: string
  womens_crisis_line?: string
}

export interface BriefingSections {
  safety_overview?: string
  cultural_norms_for_women?: string
  harassment_and_scam_patterns?: string
  transport_safety?: string
  safe_areas?: string
  emergency_contacts?: BriefingEmergencyContacts
  health_and_medical?: string
  communication?: string
  what_to_wear?: string
  solo_dining_and_nightlife?: string
}

export interface BriefingPhrase {
  local: string
  english: string
}

export interface BriefingData {
  overall_risk_level?: RiskLevel
  risk_score?: number
  last_updated?: string
  sections?: BriefingSections
  top_3_tips?: string[]
  phrases_to_know?: BriefingPhrase[]
  data_source?: 'live' | 'ai_knowledge'
}

export type CheckInStatus = 'inactive' | 'active' | 'overdue' | 'alert'

export interface Trip {
  id: string
  traveler_name: string
  destination_city: string
  destination_country: string
  travel_dates_start: string
  travel_dates_end: string
  briefing_data: BriefingData | null
  emergency_contacts: EmergencyContact[]
  medical_info: MedicalInfo | null
  share_code: string
  check_in_status: CheckInStatus
  last_check_in: string | null
  timer_expires_at: string | null
  passport_info: PassportInfo | null
  traveler_photo_url: string | null
  traveler_phone: string | null
  created_at: string
}

export interface CheckIn {
  id: string
  trip_id: string
  status: 'safe' | 'help' | 'custom'
  message: string | null
  created_at: string
}
