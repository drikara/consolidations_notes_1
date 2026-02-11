import { Metier, Disponibilite, FinalDecision } from '@prisma/client'
import { metierConfig } from './metier-config'

export function validateFaceToFace(
  metier: Metier,
  scores: {
    voiceQuality: number
    verbalCommunication: number
    presentationVisuelle?: number
    appetenceDigitale?: number
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const config = metierConfig[metier].criteria.faceToFace

  if (config.voiceQuality && scores.voiceQuality < 3) {
    errors.push('Qualité de la voix doit être ≥ 3/5')
  }

  if (config.verbalCommunication && scores.verbalCommunication < 3) {
    errors.push('Communication verbale doit être ≥ 3/5')
  }

  if (config.presentationVisuelle && (!scores.presentationVisuelle || scores.presentationVisuelle < 3)) {
    errors.push('Présentation visuelle doit être ≥ 3/5 (AGENCES)')
  }
  
  if (config.appetenceDigitale && (!scores.appetenceDigitale || scores.appetenceDigitale < 3)) {
    errors.push('Appétence digitale doit être ≥ 3/5 (RÉSEAUX SOCIAUX)')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateSimulation(
  scores: {
    sensNegociation: number
    capacitePersuasion: number
    sensCombativite: number
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (scores.sensNegociation < 3) errors.push('Sens de la négociation doit être ≥ 3/5')
  if (scores.capacitePersuasion < 3) errors.push('Capacité de persuasion doit être ≥ 3/5')
  if (scores.sensCombativite < 3) errors.push('Sens de la combativité doit être ≥ 3/5')

  return {
    valid: errors.length === 0,
    errors
  }
}

export function validatePsycho(
  scores: {
    raisonnementLogique: number
    attentionConcentration: number
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (scores.raisonnementLogique < 3) errors.push('Raisonnement logique doit être ≥ 3/5')
  if (scores.attentionConcentration < 3) errors.push('Attention et concentration doit être ≥ 3/5')

  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateAllMetierConditions(
  metier: Metier,
  allScores: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const config = metierConfig[metier].criteria

  // Validation Face à Face
  const ffValidation = validateFaceToFace(metier, {
    voiceQuality: allScores.voiceQuality || 0,
    verbalCommunication: allScores.verbalCommunication || 0,
    presentationVisuelle: allScores.presentationVisuelle,
    appetenceDigitale: allScores.appetenceDigitale
  })
  errors.push(...ffValidation.errors)

  // Validation Typing
  if (config.typing?.required) {
    if (!allScores.typingSpeed || allScores.typingSpeed < config.typing.minSpeed) {
      errors.push(`Rapidité de saisie doit être ≥ ${config.typing.minSpeed} MPM`)
    }
    if (!allScores.typingAccuracy || allScores.typingAccuracy < config.typing.minAccuracy) {
      errors.push(`Précision de saisie doit être ≥ ${config.typing.minAccuracy}%`)
    }
  }

  // Validation Excel
  if (config.excel?.required) {
    if (!allScores.excelTest || allScores.excelTest < config.excel.minScore) {
      errors.push(`Test Excel doit être ≥ ${config.excel.minScore}/5`)
    }
  }

  // Validation Dictation
  if (config.dictation?.required) {
    if (!allScores.dictation || allScores.dictation < config.dictation.minScore) {
      errors.push(`Dictée doit être ≥ ${config.dictation.minScore}/20`)
    }
  }

  // Validation Simulation
  if (config.simulation?.required) {
    const simValidation = validateSimulation({
      sensNegociation: allScores.simulationSensNegociation || 0,
      capacitePersuasion: allScores.simulationCapacitePersuasion || 0,
      sensCombativite: allScores.simulationSensCombativite || 0
    })
    errors.push(...simValidation.errors)
  }

  // Validation Psycho
  if (config.psycho?.required) {
    const psychoValidation = validatePsycho({
      raisonnementLogique: allScores.psychoRaisonnementLogique || 0,
      attentionConcentration: allScores.psychoAttentionConcentration || 0
    })
    errors.push(...psychoValidation.errors)
  }

  // Validation Analysis
  if (config.analysis?.required) {
    if (!allScores.analysisExercise || allScores.analysisExercise < config.analysis.minScore) {
      errors.push(`Exercice d'analyse doit être ≥ ${config.analysis.minScore}/5`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ⭐ CORRECTION : Utiliser l'enum Disponibilite et FinalDecision
export function determineFinalDecision(
  metier: Metier,
  availability: Disponibilite,
  allScores: any
): FinalDecision {
  if (availability === Disponibilite.NON) return FinalDecision.NON_RECRUTE

  const validation = validateAllMetierConditions(metier, allScores)
  return validation.valid ? FinalDecision.RECRUTE : FinalDecision.NON_RECRUTE
}