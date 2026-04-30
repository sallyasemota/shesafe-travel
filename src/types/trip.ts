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

export interface BriefingData {
  summary?: string
  safety_notes?: string[]
  embassy?: {
    name?: string
    phone?: string
    address?: string
  }
  emergency_numbers?: Record<string, string>
  [key: string]: unknown
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
