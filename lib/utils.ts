// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ⭐ CORRECTION: Fonction pour un seul candidat
export function transformPrismaData(candidate: any): any {
  if (!candidate) return null
  
  // Calcul des moyennes pour les phases face à face
  const phase1Scores = candidate.faceToFaceScores?.filter((s: any) => s.phase === 1) || []
  const phase2Scores = candidate.faceToFaceScores?.filter((s: any) => s.phase === 2) || []
  
  const avgPhase1 = phase1Scores.length > 0 
    ? phase1Scores.reduce((sum: number, s: any) => sum + Number(s.score || 0), 0) / phase1Scores.length 
    : 0
  
  const avgPhase2 = phase2Scores.length > 0 
    ? phase2Scores.reduce((sum: number, s: any) => sum + Number(s.score || 0), 0) / phase2Scores.length 
    : 0

  // Transformation des données
  return {
    id: candidate.id,
    fullName: `${candidate.prenom || ''} ${candidate.nom || ''}`.trim(),
    phone: candidate.telephone || '',
    email: candidate.email || '',
    metier: candidate.metier || '',
    age: calculateAge(candidate.birthDate),
    location: candidate.location || '',
    availability: candidate.availability || '',
    interviewDate: candidate.interviewDate || null,
    diploma: candidate.diploma || '',
    institution: candidate.institution || '',
    createdAt: candidate.createdAt,
    birthDate: candidate.birthDate,
    smsSentDate: candidate.smsSentDate || null,
    session: candidate.session ? {
      metier: candidate.session.metier || '',
      date: candidate.session.date,
      jour: candidate.session.jour || ''
    } : null,
    scores: candidate.scores ? {
      callStatus: candidate.scores.callStatus || 'NON_CONTACTE',
      finalDecision: candidate.scores.finalDecision || null,
      callAttempts: candidate.scores.callAttempts || 0,
      lastCallDate: candidate.scores.lastCallDate || null,
      voiceQuality: candidate.scores.voiceQuality || null,
      verbalCommunication: candidate.scores.verbalCommunication || null,
      psychotechnicalTest: candidate.scores.psychotechnicalTest || null,
      typingSpeed: candidate.scores.typingSpeed || null,
      typingAccuracy: candidate.scores.typingAccuracy || null,
      excelTest: candidate.scores.excelTest || null,
      dictation: candidate.scores.dictation || null,
      salesSimulation: candidate.scores.salesSimulation || null,
      analysisExercise: candidate.scores.analysisExercise || null,
      phase1Decision: candidate.scores.phase1Decision || null,
      phase2FfDecision: candidate.scores.phase2FfDecision || null
    } : null,
    faceToFaceScores: candidate.faceToFaceScores || [],
    // Ajout des moyennes calculées
    avgPhase1,
    avgPhase2
  }
}

// ⭐ CORRECTION: Fonction pour un tableau de candidats
export function transformPrismaDataArray(candidates: any[]): any[] {
  if (!Array.isArray(candidates)) {
    console.error('transformPrismaDataArray: input is not an array', candidates)
    return []
  }
  
  return candidates
    .map(candidate => transformPrismaData(candidate))
    .filter(Boolean) // Retire les valeurs null/undefined
}

// Fonction utilitaire pour calculer l'âge
function calculateAge(birthDate: Date): number {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}