// ============================================================================
// FILE 3: lib/auto-decisions.ts
// ============================================================================
import { Metier, FFDecision, Decision, FinalDecision, Disponibilite } from '@prisma/client'
import { metierConfig } from './metier-config'

export interface AutoDecisionsResult {
  phase1FfDecision: FFDecision | null
  phase1Decision: Decision | null
  decisionTest: FFDecision | null
  finalDecision: FinalDecision | null
}

function isFaceToFaceValid(
  metier: Metier,
  faceToFaceScores: {
    voiceQuality: number
    verbalCommunication: number
    presentationVisuelle?: number
  }
): boolean {
  const config = metierConfig[metier].criteria.faceToFace
  
  if (config.voiceQuality && (faceToFaceScores.voiceQuality || 0) < 3) return false
  if (config.verbalCommunication && (faceToFaceScores.verbalCommunication || 0) < 3) return false
  
  if (config.presentationVisuelle) {
    if (!faceToFaceScores.presentationVisuelle || faceToFaceScores.presentationVisuelle < 3) {
      return false
    }
  }
  
  return true
}

function areTechnicalTestsValid(
  metier: Metier,
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
): boolean {
  const config = metierConfig[metier].criteria
  
  if (config.typing?.required) {
    if (!technicalScores.typingSpeed || technicalScores.typingSpeed < (config.typing.minSpeed || 0)) return false
    if (!technicalScores.typingAccuracy || technicalScores.typingAccuracy < (config.typing.minAccuracy || 0)) return false
  }
  
  if (config.excel?.required) {
    if (!technicalScores.excelTest || technicalScores.excelTest < (config.excel.minScore || 0)) return false
  }
  
  if (config.dictation?.required) {
    if (!technicalScores.dictation || technicalScores.dictation < (config.dictation.minScore || 0)) return false
  }
  
  if (config.simulation?.required) {
    if (!technicalScores.simulationSensNegociation || 
        technicalScores.simulationSensNegociation < (config.simulation.minSensNegociation || 0)) return false
    if (!technicalScores.simulationCapacitePersuasion || 
        technicalScores.simulationCapacitePersuasion < (config.simulation.minCapacitePersuasion || 0)) return false
    if (!technicalScores.simulationSensCombativite || 
        technicalScores.simulationSensCombativite < (config.simulation.minSensCombativite || 0)) return false
  }
  
  if (config.psycho?.required) {
    if (!technicalScores.psychoRaisonnementLogique || 
        technicalScores.psychoRaisonnementLogique < (config.psycho.minRaisonnementLogique || 0)) return false
    if (!technicalScores.psychoAttentionConcentration || 
        technicalScores.psychoAttentionConcentration < (config.psycho.minAttentionConcentration || 0)) return false
  }
  
  if (config.analysis?.required) {
    if (!technicalScores.analysisExercise || 
        technicalScores.analysisExercise < (config.analysis.minScore || 0)) return false
  }
  
  return true
}

export function calculateDecisions(
  metier: Metier,
  availability: Disponibilite,
  faceToFaceScores: {
    voiceQuality: number
    verbalCommunication: number
    presentationVisuelle?: number
  },
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
): AutoDecisionsResult {
  if (availability === 'NON') {
    return {
      phase1FfDecision: 'DEFAVORABLE',
      phase1Decision: 'ELIMINE',
      decisionTest: 'DEFAVORABLE',
      finalDecision: 'NON_RECRUTE'
    }
  }
  
  const faceToFaceValid = isFaceToFaceValid(metier, faceToFaceScores)
  if (!faceToFaceValid) {
    return {
      phase1FfDecision: 'DEFAVORABLE',
      phase1Decision: 'ELIMINE',
      decisionTest: 'DEFAVORABLE',
      finalDecision: 'NON_RECRUTE'
    }
  }
  
  const phase1FfDecision: FFDecision = 'FAVORABLE'
  const phase1Decision: Decision = 'ADMIS'
  
  const technicalTestsValid = areTechnicalTestsValid(metier, technicalScores)
  const decisionTest: FFDecision = technicalTestsValid ? 'FAVORABLE' : 'DEFAVORABLE'
  const finalDecision: FinalDecision = technicalTestsValid ? 'RECRUTE' : 'NON_RECRUTE'
  
  return {
    phase1FfDecision,
    phase1Decision,
    decisionTest,
    finalDecision
  }
}

export function isAutoEliminated(
  availability: Disponibilite,
  faceToFaceValid: boolean
): boolean {
  return availability === 'NON' || !faceToFaceValid
}

export function formatDecision(decision: string | null | undefined): string {
  if (!decision) return 'En attente'
  
  const map: Record<string, string> = {
    'FAVORABLE': '✅ Favorable',
    'DEFAVORABLE': '❌ Défavorable',
    'ADMIS': '✅ Admis',
    'ELIMINE': '❌ Éliminé',
    'RECRUTE': '🎯 Recruté',
    'NON_RECRUTE': '🚫 Non recruté',
    'PRESENT': '✅ Présent',
    'ABSENT': '❌ Absent',
    'OUI': '✅ Oui',
    'NON': '❌ Non'
  }
  
  return map[decision] || decision
}
