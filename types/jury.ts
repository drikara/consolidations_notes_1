// types/jury.ts (MISE À JOUR)
import { 
  Metier, 
  Candidate as PrismaCandidate, 
  FaceToFaceScore, 
  Score, 
  RecruitmentSession,
  Statut,
  NiveauEtudes,
  Disponibilite,
  Decision,
  FFDecision,
  FinalDecision
} from "@prisma/client"

export type JuryCandidate = {
  id: number
  nom: string
  prenom: string
  metier: Metier
  age: number
  diploma: string
  niveauEtudes: NiveauEtudes
  institution: string
  location: string
  availability: Disponibilite
  interviewDate: Date | null
  smsSentDate: Date | null
  session: {
    date: Date
    metier: Metier
  } | null
  scores: {
    finalDecision: FinalDecision | null
    statut: Statut | null
    statutCommentaire: string | null
    faceToFacePhase1Average: number | null
  } | null
  myScore: {
    score: number
    phase: number
    evaluatedAt: Date
  } | null
  evaluationStatus: 'not_evaluated' | 'phase1_only' | 'both_phases'
}

export interface ConsolidationData {
  metier: Metier
  availability: Disponibilite
  faceToFaceScores: {
    voiceQuality: number
    verbalCommunication: number
    presentationVisuelle?: number
  }
  technicalScores: {
    typingSpeed?: number
    typingAccuracy?: number
    excelTest?: number
    dictation?: number
    simulationSensNegociation?: number
    simulationCapacitePersuasion?: number
    simulationSensCombativite?: number
    psychoRaisonnementLogique?: number
    psychoAttentionConcentration?: number
    analysisExercise?: number
  }
}

export interface AutoDecisionsResult {
  phase1FfDecision: FFDecision | null
  phase1Decision: Decision | null
  decisionTest: FFDecision | null
  finalDecision: FinalDecision | null
}

// Fonction de conversion
export function formatCandidateForJury(
  candidate: PrismaCandidate & {
    session: { date: Date; metier: Metier } | null
    scores: Score | null
    faceToFaceScores: FaceToFaceScore[]
  },
  juryMemberId: number
): JuryCandidate {
  const myScores = candidate.faceToFaceScores.filter(score => score.juryMemberId === juryMemberId)
  const phase1Score = myScores.find(score => score.phase === 1)
  const phase2Score = myScores.find(score => score.phase === 2)

  const myScore = phase1Score || phase2Score ? {
    score: phase1Score?.score ? Number(phase1Score.score) : 
           phase2Score?.score ? Number(phase2Score.score) : 0,
    phase: phase1Score ? 1 : 2,
    evaluatedAt: phase1Score?.evaluatedAt || phase2Score?.evaluatedAt || new Date()
  } : null

  return {
    id: candidate.id,
    nom: candidate.nom,
    prenom: candidate.prenom,
    metier: candidate.metier,
    age: candidate.age,
    diploma: candidate.diploma,
    niveauEtudes: candidate.niveauEtudes,
    institution: candidate.institution,
    location: candidate.location,
    availability: candidate.availability,
    interviewDate: candidate.interviewDate,
    smsSentDate: candidate.smsSentDate,
    session: candidate.session,
    scores: candidate.scores ? {
      finalDecision: candidate.scores.finalDecision,
      statut: candidate.scores.statut,
      statutCommentaire: candidate.scores.statutCommentaire,
      faceToFacePhase1Average: candidate.scores.faceToFacePhase1Average ? 
        Number(candidate.scores.faceToFacePhase1Average) : null
    } : null,
    myScore,
    evaluationStatus: myScores.length === 0 ? 'not_evaluated' : 
                     myScores.length === 1 ? 'phase1_only' : 
                     'both_phases'
  }
}