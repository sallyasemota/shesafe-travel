export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

export interface MedicalInfo {
  blood_type?: string
  allergies?: string[]
  conditions?: string[]
  medications?: string[]
  notes?: string
}

export interface PassportInfo {
  number?: string
  country?: string
  expires_at?: string
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

export type CheckInStatus = 'pending' | 'safe' | 'overdue' | 'alert'

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
  created_at: string
}
