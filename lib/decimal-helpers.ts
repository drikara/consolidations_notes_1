// lib/decimal-helpers.ts
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Convertit un Decimal en nombre JavaScript
 */
export function toNumber(value: Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  return Number(value)
}

/**
 * Sérialise un Score pour le passer aux composants clients
 */
export function serializeScore(score: any) {
  if (!score) return null
  
  return {
    id: score.id,
    candidateId: score.candidateId,
    
    // Convertir tous les Decimal en number
    voiceQuality: toNumber(score.voiceQuality),
    verbalCommunication: toNumber(score.verbalCommunication),
    presentationVisuelle: toNumber(score.presentationVisuelle),
    
    phase1FfDecision: score.phase1FfDecision,
    
    psychoRaisonnementLogique: toNumber(score.psychoRaisonnementLogique),
    psychoAttentionConcentration: toNumber(score.psychoAttentionConcentration),
    psychotechnicalTest: toNumber(score.psychotechnicalTest),
    
    phase1Decision: score.phase1Decision,
    
    typingSpeed: score.typingSpeed,
    typingAccuracy: toNumber(score.typingAccuracy),
    excelTest: toNumber(score.excelTest),
    dictation: toNumber(score.dictation),
    
    simulationSensNegociation: toNumber(score.simulationSensNegociation),
    simulationCapacitePersuasion: toNumber(score.simulationCapacitePersuasion),
    simulationSensCombativite: toNumber(score.simulationSensCombativite),
    salesSimulation: toNumber(score.salesSimulation),
    
    analysisExercise: toNumber(score.analysisExercise),
    
    phase2Date: score.phase2Date ? score.phase2Date.toISOString() : null,
    decisionTest: score.decisionTest,
    finalDecision: score.finalDecision,
    
    statut: score.statut,
    statutCommentaire: score.statutCommentaire,
    
    faceToFacePhase1Average: toNumber(score.faceToFacePhase1Average),
    faceToFacePhase2Average: toNumber(score.faceToFacePhase2Average),
    
    evaluatedBy: score.evaluatedBy,
    comments: score.comments,
    
    createdAt: score.createdAt.toISOString(),
    updatedAt: score.updatedAt.toISOString(),
  }
}

/**
 * Sérialise un FaceToFaceScore
 */
export function serializeFaceToFaceScore(faceToFaceScore: any) {
  if (!faceToFaceScore) return null
  
  return {
    id: faceToFaceScore.id,
    candidateId: faceToFaceScore.candidateId,
    juryMemberId: faceToFaceScore.juryMemberId,
    phase: faceToFaceScore.phase,
    
    score: toNumber(faceToFaceScore.score),
    presentationVisuelle: toNumber(faceToFaceScore.presentationVisuelle),
    verbalCommunication: toNumber(faceToFaceScore.verbalCommunication),
    voiceQuality: toNumber(faceToFaceScore.voiceQuality),
    
    simulationCapacitePersuasion: toNumber(faceToFaceScore.simulationCapacitePersuasion),
    simulationSensCombativite: toNumber(faceToFaceScore.simulationSensCombativite),
    simulationSensNegociation: toNumber(faceToFaceScore.simulationSensNegociation),
    
    comments: faceToFaceScore.comments,
    decision: faceToFaceScore.decision,
    
    evaluatedAt: faceToFaceScore.evaluatedAt.toISOString(),
    createdAt: faceToFaceScore.createdAt.toISOString(),
    updatedAt: faceToFaceScore.updatedAt.toISOString(),
    
    juryMember: faceToFaceScore.juryMember,
  }
}

/**
 * Sérialise un Candidate avec ses scores
 */
export function serializeCandidate(candidate: any) {
  if (!candidate) return null
  
  return {
    id: candidate.id,
    nom: candidate.nom,
    prenom: candidate.prenom,
    phone: candidate.phone,
    birthDate: candidate.birthDate.toISOString(),
    age: candidate.age,
    diploma: candidate.diploma,
    niveauEtudes: candidate.niveauEtudes,
    institution: candidate.institution,
    email: candidate.email,
    location: candidate.location,
    smsSentDate: candidate.smsSentDate.toISOString(),
    availability: candidate.availability,
    interviewDate: candidate.interviewDate.toISOString(),
    metier: candidate.metier,
    sessionId: candidate.sessionId,
    notes: candidate.notes,
    
    createdAt: candidate.createdAt.toISOString(),
    updatedAt: candidate.updatedAt.toISOString(),
    
    // Sérialiser les relations
    scores: candidate.scores ? serializeScore(candidate.scores) : null,
    faceToFaceScores: candidate.faceToFaceScores?.map(serializeFaceToFaceScore) || [],
    session: candidate.session,
  }
}

/**
 * Sérialise une liste de candidats pour ScoresList
 */
export function serializeCandidatesForList(candidates: any[]) {
  return candidates.map(candidate => ({
    id: candidate.id,
    full_name: `${candidate.prenom} ${candidate.nom}`,
    metier: candidate.metier,
    email: candidate.email,
    phone: candidate.phone,
    final_decision: candidate.scores?.finalDecision || undefined,
    created_at: candidate.createdAt,
    scores: candidate.scores ? {
      voice_quality: toNumber(candidate.scores.voiceQuality),
      verbal_communication: toNumber(candidate.scores.verbalCommunication),
      psychotechnical_test: toNumber(candidate.scores.psychotechnicalTest),
      typing_speed: candidate.scores.typingSpeed,
      typing_accuracy: toNumber(candidate.scores.typingAccuracy),
      excel_test: toNumber(candidate.scores.excelTest),
      dictation: toNumber(candidate.scores.dictation),
      sales_simulation: toNumber(candidate.scores.salesSimulation),
      analysis_exercise: toNumber(candidate.scores.analysisExercise),
      phase1_decision: candidate.scores.phase1Decision,
      phase2_ff_decision: candidate.scores.phase1FfDecision,
    } : null
  }))
}