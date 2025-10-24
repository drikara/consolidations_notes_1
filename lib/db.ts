import postgres from "postgres"

export const sql = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.NODE_ENV === "production" ? "require" : false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

export type User = {
  id: string
  name: string
  email: string
  role: "WFM" | "JURY"
  created_at: Date
}

export type Candidate = {
  id: number
  full_name: string
  phone: string
  birth_date: string
  age: number
  diploma: string
  institution: string
  email: string
  location: string
  sms_sent_date?: string
  availability: string
  interview_date?: string
  metier: string
  created_at: Date
  updated_at: Date
}

export type JuryMember = {
  id: number
  user_id: string
  full_name: string
  role_type: "DRH" | "EPC" | "Représentant du Métier" | "WFM"
  created_at: Date
}

export type Score = {
  id: number
  candidate_id: number
  voice_quality?: number
  verbal_communication?: number
  psychotechnical_test?: number
  phase1_decision?: string
  typing_speed?: number
  typing_accuracy?: number
  excel_test?: number
  dictation?: number
  sales_simulation?: number
  analysis_exercise?: number
  phase2_date?: string
  phase2_ff_decision?: string
  final_decision?: string
  comments?: string
  created_at: Date
  updated_at: Date
}

export type FaceToFaceScore = {
  id: number
  candidate_id: number
  jury_member_id: number
  phase: 1 | 2
  score: number
  created_at: Date
  updated_at: Date
}
