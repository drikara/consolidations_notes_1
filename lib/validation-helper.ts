import { Metier, FFDecision, FinalDecision } from '@prisma/client'
import { getMetierConfig } from './metier-config'

export interface FaceToFaceValidation {
  isValid: boolean
  errors: string[]
  presentationVisuelle?: number
  voiceQuality?: number
  verbalCommunication?: number
}

export interface SimulationValidation {
  isValid: boolean
  errors: string[]
  sensNegociation?: number
  capacitePersuasion?: number
  sensCombativite?: number
}

export interface PsychoValidation {
  isValid: boolean
  errors: string[]
  raisonnementLogique?: number
  attentionConcentration?: number
}

/**
 * Valide les scores Face à Face selon le métier
 */
export function validateFaceToFace(
  metier: Metier,
  voiceQuality?: number,
  verbalCommunication?: number,
  presentationVisuelle?: number
): FaceToFaceValidation {
  const config = getMetierConfig(metier)
  const criteria = config.faceToFaceCriteria
  const errors: string[] = []

  // Validation Qualité de la voix (obligatoire pour tous)
  if (!voiceQuality || voiceQuality < criteria.minVoiceQuality) {
    errors.push(`Qualité de la voix doit être >= ${criteria.minVoiceQuality}/5`)
  }

  // Validation Communication verbale (obligatoire pour tous)
  if (!verbalCommunication || verbalCommunication < criteria.minVerbalCommunication) {
    errors.push(`Communication verbale doit être >= ${criteria.minVerbalCommunication}/5`)
  }

  // Validation Présentation visuelle (UNIQUEMENT pour AGENCES)
  if (metier === Metier.AGENCES) {
    if (criteria.presentationVisuelle && criteria.minPresentationVisuelle) {
      if (!presentationVisuelle || presentationVisuelle < criteria.minPresentationVisuelle) {
        errors.push(`Présentation visuelle doit être >= ${criteria.minPresentationVisuelle}/5`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    voiceQuality,
    verbalCommunication,
    presentationVisuelle
  }
}

/**
 * Valide les scores de Simulation avec sous-critères
 */
export function validateSimulation(
  sensNegociation?: number,
  capacitePersuasion?: number,
  sensCombativite?: number
): SimulationValidation {
  const errors: string[] = []

  if (!sensNegociation || sensNegociation < 3) {
    errors.push(`Sens de la négociation doit être >= 3/5`)
  }

  if (!capacitePersuasion || capacitePersuasion < 3) {
    errors.push(`Capacité de persuasion doit être >= 3/5`)
  }

  if (!sensCombativite || sensCombativite < 3) {
    errors.push(`Sens de la combativité doit être >= 3/5`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    sensNegociation,
    capacitePersuasion,
    sensCombativite
  }
}

/**
 * Valide les scores Psychotechniques avec sous-critères
 */
export function validatePsycho(
  raisonnementLogique?: number,
  attentionConcentration?: number
): PsychoValidation {
  const errors: string[] = []

  if (!raisonnementLogique || raisonnementLogique < 3) {
    errors.push(`Raisonnement logique doit être >= 3/5`)
  }

  if (!attentionConcentration || attentionConcentration < 3) {
    errors.push(`Attention et concentration doit être >= 3/5`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    raisonnementLogique,
    attentionConcentration
  }
}

/**
 * Valide toutes les conditions métier pour un candidat
 */
export function validateAllMetierConditions(
  metier: Metier,
  scores: {
    voiceQuality?: number
    verbalCommunication?: number
    presentationVisuelle?: number
    simulation?: {
      sensNegociation?: number
      capacitePersuasion?: number
      sensCombativite?: number
    }
    psychotechnical?: {
      raisonnementLogique?: number
      attentionConcentration?: number
    }
  },
  availability: 'OUI' | 'NON'
): {
  isValid: boolean
  errors: string[]
  canContinue: boolean
} {
  const errors: string[] = []

  // 1. Vérifier disponibilité
  if (availability === 'NON') {
    errors.push('Candidat non disponible')
    return {
      isValid: false,
      errors,
      canContinue: false
    }
  }

  // 2. Valider Face à Face
  const faceValidation = validateFaceToFace(
    metier,
    scores.voiceQuality,
    scores.verbalCommunication,
    scores.presentationVisuelle
  )

  if (!faceValidation.isValid) {
    errors.push(...faceValidation.errors)
  }

  // 3. Valider Simulation si applicable (AGENCES et TELEVENTE)
  if ((metier === Metier.AGENCES || metier === Metier.TELEVENTE) && scores.simulation) {
    const simValidation = validateSimulation(
      scores.simulation.sensNegociation,
      scores.simulation.capacitePersuasion,
      scores.simulation.sensCombativite
    )
    if (!simValidation.isValid) {
      errors.push(...simValidation.errors)
    }
  }

  // 4. Valider Psychotechnique si applicable (BO_RECLAM)
  if (metier === Metier.BO_RECLAM && scores.psychotechnical) {
    const psychoValidation = validatePsycho(
      scores.psychotechnical.raisonnementLogique,
      scores.psychotechnical.attentionConcentration
    )
    if (!psychoValidation.isValid) {
      errors.push(...psychoValidation.errors)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    canContinue: faceValidation.isValid // Peut continuer seulement si Face à Face validé
  }
}

/**
 * Détermine automatiquement la décision finale basée sur les règles métier
 */
export function determineFinalDecision(
  metier: Metier,
  availability: 'OUI' | 'NON',
  faceToFaceValidation: FaceToFaceValidation,
  simulationValidation: SimulationValidation,
  psychoValidation: PsychoValidation
): FinalDecision {
  // Règle 1: Si disponibilité = NON → NON_RECRUTE
  if (availability === 'NON') {
    return FinalDecision.NON_RECRUTE
  }

  // Règle 2: Si Face à Face non validé → NON_RECRUTE
  if (!faceToFaceValidation.isValid) {
    return FinalDecision.NON_RECRUTE
  }

  // Règle 3: Pour AGENCES et TELEVENTE, valider simulation
  if ((metier === Metier.AGENCES || metier === Metier.TELEVENTE) && !simulationValidation.isValid) {
    return FinalDecision.NON_RECRUTE
  }

  // Règle 4: Pour BO_RECLAM, valider test psycho
  if (metier === Metier.BO_RECLAM && !psychoValidation.isValid) {
    return FinalDecision.NON_RECRUTE
  }

  // Si toutes les conditions sont remplies → RECRUTE
  return FinalDecision.RECRUTE
}

/**
 * Vérifie si le candidat peut continuer après Face à Face
 */
export function canContinueAfterFaceToFace(
  metier: Metier,
  voiceQuality?: number,
  verbalCommunication?: number,
  presentationVisuelle?: number
): boolean {
  const validation = validateFaceToFace(metier, voiceQuality, verbalCommunication, presentationVisuelle)
  return validation.isValid
}

/**
 * Vérifie si un candidat est automatiquement éliminé
 */
export function isAutoEliminated(
  availability: 'OUI' | 'NON',
  faceToFaceValid: boolean
): boolean {
  return availability === 'NON' || !faceToFaceValid
}

/**
 * Valide les conditions de simulation pour les métiers concernés
 */
export function validateSimulationConditions(
  sensNegociation: number,
  capacitePersuasion: number,
  sensCombativite: number
): boolean {
  return sensNegociation >= 3 && capacitePersuasion >= 3 && sensCombativite >= 3
}

/**
 * Valide les conditions du test psychotechnique
 */
export function validatePsychoConditions(
  raisonnementLogique: number,
  attentionConcentration: number
): boolean {
  return raisonnementLogique >= 3 && attentionConcentration >= 3
}