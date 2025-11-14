// lib/server-utils.ts
import { Decimal } from "@prisma/client/runtime/library"

// Fonction pour convertir les objets Decimal en numbers
function convertDecimal(value: any): any {
  if (value instanceof Decimal) {
    return Number(value)
  }
  if (Array.isArray(value)) {
    return value.map(convertDecimal)
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const result: any = {}
    for (const key in value) {
      result[key] = convertDecimal(value[key])
    }
    return result
  }
  return value
}

// ⭐ CORRECTION: Fonction pour un seul candidat avec gestion des Decimal et tous les champs
export function transformPrismaData(candidate: any): any {
  if (!candidate) return null
  
  // Convertir tous les Decimal en numbers
  const convertedCandidate = convertDecimal(candidate)
  
  // Calcul des moyennes pour les phases face à face
  const phase1Scores = convertedCandidate.faceToFaceScores?.filter((s: any) => s.phase === 1) || []
  const phase2Scores = convertedCandidate.faceToFaceScores?.filter((s: any) => s.phase === 2) || []
  
  // ✅ CORRECTION: Calcul correct de la moyenne Phase 1 basé sur les 3 critères
  const avgPhase1 = phase1Scores.length > 0 
    ? phase1Scores.reduce((sum: number, s: any) => {
        const pres = Number(s.presentationVisuelle) || 0
        const verbal = Number(s.verbalCommunication) || 0
        const voice = Number(s.voiceQuality) || 0
        const juryAvg = (pres + verbal + voice) / 3
        return sum + juryAvg
      }, 0) / phase1Scores.length
    : 0
  
  const avgPhase2 = phase2Scores.length > 0 
    ? phase2Scores.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / phase2Scores.length 
    : 0

  // Transformation des données
  return {
    id: convertedCandidate.id,
    fullName: `${convertedCandidate.prenom || ''} ${convertedCandidate.nom || ''}`.trim(),
    phone: convertedCandidate.telephone || '',
    email: convertedCandidate.email || '',
    metier: convertedCandidate.metier || '',
    age: calculateAge(convertedCandidate.birthDate),
    location: convertedCandidate.location || '',
    availability: convertedCandidate.availability || '',
    interviewDate: convertedCandidate.interviewDate || null,
    diploma: convertedCandidate.diploma || '',
    institution: convertedCandidate.institution || '',
    createdAt: convertedCandidate.createdAt,
    birthDate: convertedCandidate.birthDate,
    smsSentDate: convertedCandidate.smsSentDate || null,
    session: convertedCandidate.session ? {
      id: convertedCandidate.session.id,
      metier: convertedCandidate.session.metier || '',
      date: convertedCandidate.session.date,
      jour: convertedCandidate.session.jour || '',
      status: convertedCandidate.session.status || '' // ✅ AJOUT: status
    } : null,
    scores: convertedCandidate.scores ? {
      callStatus: convertedCandidate.scores.callStatus || 'NON_CONTACTE',
      finalDecision: convertedCandidate.scores.finalDecision || null,
      callAttempts: convertedCandidate.scores.callAttempts || 0,
      lastCallDate: convertedCandidate.scores.lastCallDate || null,
      callNotes: convertedCandidate.scores.callNotes || null,
      // ✅ AJOUT: Tous les scores détaillés Phase 1
      presentationVisuelle: convertedCandidate.scores.presentationVisuelle || null,
      verbalCommunication: convertedCandidate.scores.verbalCommunication || null,
      voiceQuality: convertedCandidate.scores.voiceQuality || null,
      // ✅ AJOUT: Tous les scores Phase 2
      psychotechnicalTest: convertedCandidate.scores.psychotechnicalTest || null,
      typingSpeed: convertedCandidate.scores.typingSpeed || null,
      typingAccuracy: convertedCandidate.scores.typingAccuracy || null,
      excelTest: convertedCandidate.scores.excelTest || null,
      dictation: convertedCandidate.scores.dictation || null,
      salesSimulation: convertedCandidate.scores.salesSimulation || null,
      analysisExercise: convertedCandidate.scores.analysisExercise || null,
      phase2Date: convertedCandidate.scores.phase2Date || null,
      // ✅ AJOUT: Décisions
      phase1Decision: convertedCandidate.scores.phase1Decision || null,
      phase1FfDecision: convertedCandidate.scores.phase1FfDecision || null,
      phase2FfDecision: convertedCandidate.scores.phase2FfDecision || null
    } : null,
    faceToFaceScores: convertedCandidate.faceToFaceScores?.map((score: any) => ({
      id: score.id,
      score: score.score,
      phase: score.phase,
      // ✅ AJOUT: Détails des critères pour chaque jury
      presentationVisuelle: score.presentationVisuelle || null,
      verbalCommunication: score.verbalCommunication || null,
      voiceQuality: score.voiceQuality || null,
      comments: score.comments || null,
      juryMember: {
        fullName: score.juryMember?.fullName || '',
        roleType: score.juryMember?.roleType || '',
        specialite: score.juryMember?.specialite || null
      }
    })) || [],
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