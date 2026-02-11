import { Metier, FFDecision, Decision, FinalDecision, Disponibilite, Statut } from '@prisma/client'
import { metierConfig } from './metier-config'

export interface AutoDecisionsResult {
  phase1FfDecision: FFDecision | null
  phase1Decision: Decision | null
  decisionTest: FFDecision | null
  finalDecision: FinalDecision | null
}

function isFaceToFaceValid(
  metier: Metier,
  juryAverages: {
    voiceQuality: number
    verbalCommunication: number
    presentationVisuelle?: number
    appetenceDigitale?: number
  }
): boolean {
  const config = metierConfig[metier].criteria.faceToFace
  
  if (config.voiceQuality && juryAverages.voiceQuality < 3) return false
  
  if (config.verbalCommunication && juryAverages.verbalCommunication < 3) return false
  
  if (config.appetenceDigitale && juryAverages.appetenceDigitale !== undefined && juryAverages.appetenceDigitale < 3) {
    return false
  }
  
  if (config.presentationVisuelle) {
    if (!juryAverages.presentationVisuelle || juryAverages.presentationVisuelle < 3) {
      return false
    }
  }
  
  return true
}

function isSimulationValid(
  metier: Metier,
  simulationAverages?: {
    sensNegociation: number
    capacitePersuasion: number
    sensCombativite: number
  }
): boolean {
  const config = metierConfig[metier].criteria.simulation
  
  if (!config?.required) return true
  
  if (!simulationAverages) return false
  
  if (simulationAverages.sensNegociation < 3) return false
  if (simulationAverages.capacitePersuasion < 3) return false
  if (simulationAverages.sensCombativite < 3) return false
  
  return true
}

function areTechnicalTestsValid(
  metier: Metier,
  technicalScores: {
    typingSpeed?: number
    typingAccuracy?: number
    excelTest?: number
    dictation?: number
    psychoRaisonnementLogique?: number
    psychoAttentionConcentration?: number
    analysisExercise?: number
  }
): boolean {
  const config = metierConfig[metier].criteria
  
  if (config.typing?.required) {
    if (!technicalScores.typingSpeed || technicalScores.typingSpeed < config.typing.minSpeed) return false
    if (!technicalScores.typingAccuracy || technicalScores.typingAccuracy < config.typing.minAccuracy) return false
  }
  
  if (config.excel?.required) {
    if (!technicalScores.excelTest || technicalScores.excelTest < config.excel.minScore) return false
  }
  
  if (config.dictation?.required) {
    if (!technicalScores.dictation || technicalScores.dictation < config.dictation.minScore) return false
  }
  
  if (config.psycho?.required) {
    if (!technicalScores.psychoRaisonnementLogique || 
        technicalScores.psychoRaisonnementLogique < config.psycho.minRaisonnementLogique) return false
    if (!technicalScores.psychoAttentionConcentration || 
        technicalScores.psychoAttentionConcentration < config.psycho.minAttentionConcentration) return false
  }
  
  if (config.analysis?.required) {
    if (!technicalScores.analysisExercise || 
        technicalScores.analysisExercise < config.analysis.minScore) return false
  }
  
  return true
}

export function calculateDecisions(
  metier: Metier,
  availability: Disponibilite,
  statut: Statut | null,
  juryAverages: {
    voiceQuality: number
    verbalCommunication: number
    presentationVisuelle?: number
    appetenceDigitale?: number
  } | null,
  simulationAverages?: {
    sensNegociation: number
    capacitePersuasion: number
    sensCombativite: number
  },
  technicalScores?: {
    typingSpeed?: number
    typingAccuracy?: number
    excelTest?: number
    dictation?: number
    psychoRaisonnementLogique?: number
    psychoAttentionConcentration?: number
    analysisExercise?: number
  }
): AutoDecisionsResult {
  console.log('📊 calculateDecisions appelée avec:', {
    metier,
    availability,
    statut,
    juryAverages,
    hasSimulation: !!simulationAverages,
    hasTechnicalScores: !!technicalScores
  })

  // ⭐ CORRECTION : Utiliser l'enum Statut au lieu de la chaîne
  if (statut === Statut.ABSENT) {
    console.log('📊 calculateDecisions: Candidat absent → toutes les décisions null')
    return {
      phase1FfDecision: null,
      phase1Decision: null,
      decisionTest: null,
      finalDecision: null
    }
  }

  // ⭐ CORRECTION : Utiliser l'enum Disponibilite au lieu de la chaîne
  if (availability === Disponibilite.NON) {
    console.log('📊 calculateDecisions: Candidat non disponible → NON_RECRUTE')
    return {
      phase1FfDecision: FFDecision.DEFAVORABLE,
      phase1Decision: Decision.ELIMINE,
      decisionTest: FFDecision.DEFAVORABLE,
      finalDecision: FinalDecision.NON_RECRUTE
    }
  }
  
  // ✅ RÈGLE 2: Vérifier Face à Face (Phase 1)
  if (!juryAverages) {
    console.log('📊 calculateDecisions: Pas de notes de jury → en attente')
    return {
      phase1FfDecision: null,
      phase1Decision: null,
      decisionTest: null,
      finalDecision: null
    }
  }

  const faceToFaceValid = isFaceToFaceValid(metier, juryAverages)
  
  if (!faceToFaceValid) {
    console.log('📊 calculateDecisions: Face-à-face non validé → NON_RECRUTE')
    return {
      phase1FfDecision: FFDecision.DEFAVORABLE,
      phase1Decision: Decision.ELIMINE,
      decisionTest: FFDecision.DEFAVORABLE,
      finalDecision: FinalDecision.NON_RECRUTE
    }
  }
  
  const phase1FfDecision: FFDecision = FFDecision.FAVORABLE
  const phase1Decision: Decision = Decision.ADMIS
  
  // ✅ RÈGLE 3: Vérifier Simulation (Phase 2) si nécessaire
  const needsSimulation = metier === Metier.AGENCES || metier === Metier.TELEVENTE
  
  if (needsSimulation) {
    const simulationValid = isSimulationValid(metier, simulationAverages)
    
    if (!simulationValid) {
      console.log('📊 calculateDecisions: Simulation non validée → NON_RECRUTE')
      return {
        phase1FfDecision,
        phase1Decision,
        decisionTest: FFDecision.DEFAVORABLE,
        finalDecision: FinalDecision.NON_RECRUTE
      }
    }
  }
  
  // ✅ RÈGLE 4: Vérifier les tests techniques
  if (!technicalScores) {
    console.log('📊 calculateDecisions: Pas de tests techniques → en attente')
    return {
      phase1FfDecision,
      phase1Decision,
      decisionTest: needsSimulation ? FFDecision.FAVORABLE : null,
      finalDecision: null
    }
  }
  
  const technicalTestsValid = areTechnicalTestsValid(metier, technicalScores)
  const decisionTest: FFDecision = technicalTestsValid ? FFDecision.FAVORABLE : FFDecision.DEFAVORABLE
  const finalDecision: FinalDecision = technicalTestsValid ? FinalDecision.RECRUTE : FinalDecision.NON_RECRUTE
  
  console.log('📊 calculateDecisions: Décision finale:', {
    decisionTest,
    finalDecision,
    technicalTestsValid
  })
  
  return {
    phase1FfDecision,
    phase1Decision,
    decisionTest,
    finalDecision
  }
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