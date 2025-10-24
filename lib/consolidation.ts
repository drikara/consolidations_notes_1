// Consolidation logic for recruitment process

export type MetierCriteria = {
  metier: string
  criteria: {
    faceToFace?: number // minimum average score
    typingSpeed?: number // minimum MPM
    typingAccuracy?: number // minimum percentage
    excel?: number // minimum score
    dictation?: number // minimum score
    salesSimulation?: number // minimum score
    psychotechnical?: number // minimum score
    analysisExercise?: number // minimum score
  }
}

export const METIER_CRITERIA: MetierCriteria[] = [
  {
    metier: "Call Center",
    criteria: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 85,
      excel: 3,
      dictation: 16,
    },
  },
  {
    metier: "Agences",
    criteria: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 85,
      dictation: 16,
      salesSimulation: 3,
    },
  },
  {
    metier: "Bo Réclam",
    criteria: {
      typingSpeed: 17,
      typingAccuracy: 85,
      excel: 3,
      dictation: 16,
      psychotechnical: 8,
    },
  },
  {
    metier: "Télévente",
    criteria: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 85,
      dictation: 16,
      salesSimulation: 3,
    },
  },
  {
    metier: "Réseaux Sociaux",
    criteria: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 85,
      dictation: 16,
    },
  },
  {
    metier: "Supervision",
    criteria: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 85,
      excel: 3,
      dictation: 16,
    },
  },
  {
    metier: "Bot Cognitive Trainer",
    criteria: {
      faceToFace: 3,
      excel: 3,
      dictation: 16,
      analysisExercise: 6,
    },
  },
  {
    metier: "SMC Fixe & Mobile",
    criteria: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 85,
      excel: 3,
      dictation: 16,
    },
  },
]

export type ConsolidationResult = {
  isAdmitted: boolean
  passedCriteria: string[]
  failedCriteria: string[]
  faceToFaceAverage: number | null
  details: {
    criterion: string
    required: number
    actual: number | null
    passed: boolean
  }[]
}

export function calculateFaceToFaceAverage(scores: Array<{ score: number }>): number | null {
  if (scores.length === 0) return null
  const sum = scores.reduce((acc, s) => acc + Number(s.score), 0)
  return sum / scores.length
}

export function consolidateCandidate(
  metier: string,
  scores: {
    faceToFaceScores: Array<{ score: number }>
    typingSpeed?: number
    typingAccuracy?: number
    excel?: number
    dictation?: number
    salesSimulation?: number
    psychotechnical?: number
    analysisExercise?: number
  },
): ConsolidationResult {
  const metierCriteria = METIER_CRITERIA.find((m) => m.metier === metier)

  if (!metierCriteria) {
    return {
      isAdmitted: false,
      passedCriteria: [],
      failedCriteria: ["Métier non reconnu"],
      faceToFaceAverage: null,
      details: [],
    }
  }

  const faceToFaceAvg = calculateFaceToFaceAverage(scores.faceToFaceScores)
  const criteria = metierCriteria.criteria
  const passedCriteria: string[] = []
  const failedCriteria: string[] = []
  const details: ConsolidationResult["details"] = []

  // Check Face to Face
  if (criteria.faceToFace !== undefined) {
    const passed = faceToFaceAvg !== null && faceToFaceAvg >= criteria.faceToFace
    details.push({
      criterion: "Face à Face",
      required: criteria.faceToFace,
      actual: faceToFaceAvg,
      passed,
    })
    if (passed) {
      passedCriteria.push("Face à Face")
    } else {
      failedCriteria.push("Face à Face")
    }
  }

  // Check Typing Speed
  if (criteria.typingSpeed !== undefined) {
    const passed = scores.typingSpeed !== undefined && scores.typingSpeed >= criteria.typingSpeed
    details.push({
      criterion: "Rapidité de Saisie (MPM)",
      required: criteria.typingSpeed,
      actual: scores.typingSpeed ?? null,
      passed,
    })
    if (passed) {
      passedCriteria.push("Rapidité de Saisie")
    } else {
      failedCriteria.push("Rapidité de Saisie")
    }
  }

  // Check Typing Accuracy
  if (criteria.typingAccuracy !== undefined) {
    const passed = scores.typingAccuracy !== undefined && scores.typingAccuracy >= criteria.typingAccuracy
    details.push({
      criterion: "Précision de Saisie (%)",
      required: criteria.typingAccuracy,
      actual: scores.typingAccuracy ?? null,
      passed,
    })
    if (passed) {
      passedCriteria.push("Précision de Saisie")
    } else {
      failedCriteria.push("Précision de Saisie")
    }
  }

  // Check Excel
  if (criteria.excel !== undefined) {
    const passed = scores.excel !== undefined && scores.excel >= criteria.excel
    details.push({
      criterion: "Test Excel",
      required: criteria.excel,
      actual: scores.excel ?? null,
      passed,
    })
    if (passed) {
      passedCriteria.push("Test Excel")
    } else {
      failedCriteria.push("Test Excel")
    }
  }

  // Check Dictation
  if (criteria.dictation !== undefined) {
    const passed = scores.dictation !== undefined && scores.dictation >= criteria.dictation
    details.push({
      criterion: "Dictée",
      required: criteria.dictation,
      actual: scores.dictation ?? null,
      passed,
    })
    if (passed) {
      passedCriteria.push("Dictée")
    } else {
      failedCriteria.push("Dictée")
    }
  }

  // Check Sales Simulation
  if (criteria.salesSimulation !== undefined) {
    const passed = scores.salesSimulation !== undefined && scores.salesSimulation >= criteria.salesSimulation
    details.push({
      criterion: "Simulation Vente",
      required: criteria.salesSimulation,
      actual: scores.salesSimulation ?? null,
      passed,
    })
    if (passed) {
      passedCriteria.push("Simulation Vente")
    } else {
      failedCriteria.push("Simulation Vente")
    }
  }

  // Check Psychotechnical
  if (criteria.psychotechnical !== undefined) {
    const passed = scores.psychotechnical !== undefined && scores.psychotechnical >= criteria.psychotechnical
    details.push({
      criterion: "Test Psychotechnique",
      required: criteria.psychotechnical,
      actual: scores.psychotechnical ?? null,
      passed,
    })
    if (passed) {
      passedCriteria.push("Test Psychotechnique")
    } else {
      failedCriteria.push("Test Psychotechnique")
    }
  }

  // Check Analysis Exercise
  if (criteria.analysisExercise !== undefined) {
    const passed = scores.analysisExercise !== undefined && scores.analysisExercise >= criteria.analysisExercise
    details.push({
      criterion: "Exercice d'Analyse",
      required: criteria.analysisExercise,
      actual: scores.analysisExercise ?? null,
      passed,
    })
    if (passed) {
      passedCriteria.push("Exercice d'Analyse")
    } else {
      failedCriteria.push("Exercice d'Analyse")
    }
  }

  // Candidate is admitted only if ALL criteria are passed
  const isAdmitted = failedCriteria.length === 0 && details.length > 0

  return {
    isAdmitted,
    passedCriteria,
    failedCriteria,
    faceToFaceAverage: faceToFaceAvg,
    details,
  }
}
