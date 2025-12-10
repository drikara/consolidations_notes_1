//lib/db.ts
import postgres from "postgres"

// Configuration PostgreSQL directe
export const sql = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.NODE_ENV === "production" ? "require" : false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

// Types pour PostgreSQL direct
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
  visual_presentation?: number
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

// Fonction de test de connexion
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`
    return { success: true, time: result[0].now }
  } catch (error) {
    console.error('Erreur de connexion:', error)
    return { success: false, error }
  }
}

// Helper functions pour PostgreSQL
export async function getCandidateWithScores(candidateId: number) {
  try {
    const candidate = await sql<Candidate[]>`
      SELECT * FROM candidates WHERE id = ${candidateId}
    `
    
    if (candidate.length === 0) return null

    const scores = await sql<Score[]>`
      SELECT * FROM scores WHERE candidate_id = ${candidateId}
    `

    const faceToFaceScores = await sql<FaceToFaceScore[]>`
      SELECT * FROM face_to_face_scores WHERE candidate_id = ${candidateId}
    `

    return {
      ...candidate[0],
      scores: scores[0] || undefined,
      face_to_face_scores: faceToFaceScores
    }
  } catch (error) {
    console.error('Erreur:', error)
    return null
  }
}

export async function getCandidatesBySession(sessionId: string): Promise<Candidate[]> {
  try {
    return await sql<Candidate[]>`
      SELECT * FROM candidates WHERE session_id = ${sessionId} ORDER BY created_at DESC
    `
  } catch (error) {
    console.error('Erreur:', error)
    return []
  }
}

export async function getJuryMembers(): Promise<JuryMember[]> {
  try {
    return await sql<JuryMember[]>`
      SELECT * FROM jury_members ORDER BY created_at DESC
    `
  } catch (error) {
    console.error('Erreur:', error)
    return []
  }
}

// Export par défaut pour résoudre l'erreur
export default sql