// lib/consolidation.ts
import { Metier } from "@prisma/client"

export interface ConsolidationInput {
  faceToFaceScores: { score: number }[]
  typingSpeed?: number | any // ⭐ CORRECTION: Utilisez 'any' au lieu de Decimal
  typingAccuracy?: number | any
  excel?: number | any
  dictation?: number | any
  salesSimulation?: number | any
  psychotechnical?: number | any
  analysisExercise?: number | any
}

export interface ConsolidationResultData {
  isAdmitted: boolean
  details: {
    phase1Passed: boolean
    phase2Passed: boolean
    technicalTests: {
      [key: string]: { passed: boolean; value: any; required: any }
    }
  }
  averagePhase1: number
  averagePhase2: number
}

interface Criteria {
  minPhase1: number
  requiresPhase2: boolean
  minPhase2: number
  requiresTyping?: boolean
  minTypingSpeed?: number
  minTypingAccuracy?: number
  requiresExcel?: boolean
  minExcel?: number
  requiresDictation?: boolean
  minDictation?: number
  requiresSalesSimulation?: boolean
  minSalesSimulation?: number
  requiresPsychotechnical?: boolean
  minPsychotechnical?: number
  requiresAnalysis?: boolean
  minAnalysis?: number
}

// ⭐ CORRECTION: Fonction utilitaire simplifiée
function convertToNumber(value: any): number | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number') return value
  if (typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber() // Pour les types Decimal de Prisma
  }
  return Number(value)
}

export function consolidateCandidate(metier: Metier, input: ConsolidationInput): ConsolidationResultData {
  // Conversion des valeurs en number
  const processedInput = {
    faceToFaceScores: input.faceToFaceScores,
    typingSpeed: convertToNumber(input.typingSpeed),
    typingAccuracy: convertToNumber(input.typingAccuracy),
    excel: convertToNumber(input.excel),
    dictation: convertToNumber(input.dictation),
    salesSimulation: convertToNumber(input.salesSimulation),
    psychotechnical: convertToNumber(input.psychotechnical),
    analysisExercise: convertToNumber(input.analysisExercise)
  }

  // Calcul des moyennes face à face
  const phase1Scores = processedInput.faceToFaceScores
  const phase2Scores = processedInput.faceToFaceScores
  
  const averagePhase1 = phase1Scores.length > 0 
    ? phase1Scores.reduce((sum, s) => sum + s.score, 0) / phase1Scores.length 
    : 0
  
  const averagePhase2 = phase2Scores.length > 0 
    ? phase2Scores.reduce((sum, s) => sum + s.score, 0) / phase2Scores.length 
    : 0

  // Application des critères par métier
  const criteria = getCriteriaForMetier(metier)
  
  const result: ConsolidationResultData = {
    isAdmitted: true,
    details: {
      phase1Passed: averagePhase1 >= criteria.minPhase1,
      phase2Passed: !criteria.requiresPhase2 || averagePhase2 >= criteria.minPhase2,
      technicalTests: {}
    },
    averagePhase1,
    averagePhase2
  }

  // Vérification des tests techniques
  if (criteria.requiresTyping && processedInput.typingSpeed !== undefined && processedInput.typingAccuracy !== undefined) {
    const typingPassed = processedInput.typingSpeed >= criteria.minTypingSpeed! && processedInput.typingAccuracy >= criteria.minTypingAccuracy!
    result.details.technicalTests.typing = {
      passed: typingPassed,
      value: `${processedInput.typingSpeed} MPM, ${processedInput.typingAccuracy}%`,
      required: `${criteria.minTypingSpeed} MPM, ${criteria.minTypingAccuracy}%`
    }
    result.isAdmitted = result.isAdmitted && typingPassed
  }

  if (criteria.requiresExcel && processedInput.excel !== undefined) {
    const excelPassed = processedInput.excel >= criteria.minExcel!
    result.details.technicalTests.excel = {
      passed: excelPassed,
      value: processedInput.excel,
      required: criteria.minExcel
    }
    result.isAdmitted = result.isAdmitted && excelPassed
  }

  if (criteria.requiresDictation && processedInput.dictation !== undefined) {
    const dictationPassed = processedInput.dictation >= criteria.minDictation!
    result.details.technicalTests.dictation = {
      passed: dictationPassed,
      value: processedInput.dictation,
      required: criteria.minDictation
    }
    result.isAdmitted = result.isAdmitted && dictationPassed
  }

  if (criteria.requiresSalesSimulation && processedInput.salesSimulation !== undefined) {
    const salesPassed = processedInput.salesSimulation >= criteria.minSalesSimulation!
    result.details.technicalTests.salesSimulation = {
      passed: salesPassed,
      value: processedInput.salesSimulation,
      required: criteria.minSalesSimulation
    }
    result.isAdmitted = result.isAdmitted && salesPassed
  }

  if (criteria.requiresPsychotechnical && processedInput.psychotechnical !== undefined) {
    const psychoPassed = processedInput.psychotechnical >= criteria.minPsychotechnical!
    result.details.technicalTests.psychotechnical = {
      passed: psychoPassed,
      value: processedInput.psychotechnical,
      required: criteria.minPsychotechnical
    }
    result.isAdmitted = result.isAdmitted && psychoPassed
  }

  if (criteria.requiresAnalysis && processedInput.analysisExercise !== undefined) {
    const analysisPassed = processedInput.analysisExercise >= criteria.minAnalysis!
    result.details.technicalTests.analysisExercise = {
      passed: analysisPassed,
      value: processedInput.analysisExercise,
      required: criteria.minAnalysis
    }
    result.isAdmitted = result.isAdmitted && analysisPassed
  }

  // Vérification finale des phases face à face
  result.isAdmitted = result.isAdmitted && 
    result.details.phase1Passed && 
    result.details.phase2Passed

  return result
}

function getCriteriaForMetier(metier: Metier): Criteria {
  const criteria: Record<Metier, Criteria> = {
    [Metier.CALL_CENTER]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresExcel: true,
      minExcel: 3,
      requiresDictation: true,
      minDictation: 16
    },
    [Metier.AGENCES]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresDictation: true,
      minDictation: 16,
      requiresSalesSimulation: true,
      minSalesSimulation: 3
    },
    [Metier.BO_RECLAM]: {
      minPhase1: 3,
      requiresPhase2: false,
      minPhase2: 0,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresExcel: true,
      minExcel: 3,
      requiresDictation: true,
      minDictation: 16,
      requiresPsychotechnical: true,
      minPsychotechnical: 8
    },
    [Metier.TELEVENTE]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresDictation: true,
      minDictation: 16,
      requiresSalesSimulation: true,
      minSalesSimulation: 3
    },
    [Metier.RESEAUX_SOCIAUX]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresDictation: true,
      minDictation: 16
    },
    [Metier.SUPERVISION]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresExcel: true,
      minExcel: 3,
      requiresDictation: true,
      minDictation: 16
    },
    [Metier.BOT_COGNITIVE_TRAINER]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresExcel: true,
      minExcel: 3,
      requiresDictation: true,
      minDictation: 16,
      requiresAnalysis: true,
      minAnalysis: 6
    },
    [Metier.SMC_FIXE]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresExcel: true,
      minExcel: 3,
      requiresDictation: true,
      minDictation: 16
    },
    [Metier.SMC_MOBILE]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresExcel: true,
      minExcel: 3,
      requiresDictation: true,
      minDictation: 16
    }
  }

  return criteria[metier] || criteria[Metier.CALL_CENTER]
}