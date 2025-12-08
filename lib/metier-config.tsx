import { Metier } from '@prisma/client'

export interface MetierConfig {
  label: string
  requiredTests: {
    typing?: boolean
    excel?: boolean
    dictation?: boolean
    salesSimulation?: boolean
    psychotechnical?: boolean
    analysisExercise?: boolean
  }
  criteria: {
    minPhase1: number
    requiresPhase2: boolean
    minPhase2: number
    minTypingSpeed?: number
    minTypingAccuracy?: number
    minExcel?: number
    minDictation?: number
    minSalesSimulation?: number
    minPsychotechnical?: number
    minAnalysis?: number
    hasPresentationVisuelle?: boolean // NOUVEAU: pour contrôler l'affichage
  }
}

export const metierConfig: Record<Metier, MetierConfig> = {
  [Metier.CALL_CENTER]: {
    label: 'Call Center',
    requiredTests: {
      typing: true,
      excel: true,
      dictation: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minTypingSpeed: 17,
      minTypingAccuracy: 75,
      minExcel: 3,
      minDictation: 14,
      hasPresentationVisuelle: false // Pas de présentation visuelle
    }
  },
  
  [Metier.AGENCES]: {
    label: 'Agences',
    requiredTests: {
      typing: true,
      dictation: true,
      salesSimulation: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minTypingSpeed: 17,
      minTypingAccuracy: 75,
      minDictation: 14,
      minSalesSimulation: 3,
      hasPresentationVisuelle: true // SEUL métier avec présentation visuelle
    }
  },
  
  [Metier.BO_RECLAM]: {
    label: 'Back Office Réclamations',
    requiredTests: {
      typing: true,
      excel: true,
      dictation: true,
      psychotechnical: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: false,
      minPhase2: 0,
      minTypingSpeed: 17,
      minTypingAccuracy: 75,
      minExcel: 3,
      minDictation: 14,
      minPsychotechnical: 8,
      hasPresentationVisuelle: false
    }
  },
  
  [Metier.TELEVENTE]: {
    label: 'Télévente',
    requiredTests: {
      typing: true,
      dictation: true,
      salesSimulation: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minTypingSpeed: 17,
      minTypingAccuracy: 75,
      minDictation: 14,
      minSalesSimulation: 3,
      hasPresentationVisuelle: false
    }
  },
  
  [Metier.RESEAUX_SOCIAUX]: {
    label: 'Réseaux Sociaux',
    requiredTests: {
      typing: true,
      dictation: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minTypingSpeed: 23,
      minTypingAccuracy: 85,
      minDictation: 16,
      hasPresentationVisuelle: false
    }
  },
  
  [Metier.SUPERVISION]: {
    label: 'Supervision',
    requiredTests: {
      typing: true,
      excel: true,
      dictation: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minTypingSpeed: 17,
      minTypingAccuracy: 75,
      minExcel: 3,
      minDictation: 14,
      hasPresentationVisuelle: false
    }
  },
  
  [Metier.BOT_COGNITIVE_TRAINER]: {
    label: 'Bot Cognitive Trainer',
    requiredTests: {
      excel: true,
      dictation: true,
      analysisExercise: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minExcel: 3,
      minDictation: 14,
      minAnalysis: 3,
      hasPresentationVisuelle: false
    }
  },
  
  [Metier.SMC_FIXE]: {
    label: 'SMC Fixe',
    requiredTests: {
      typing: true,
      excel: true,
      dictation: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minTypingSpeed: 17,
      minTypingAccuracy: 75,
      minExcel: 3,
      minDictation: 14,
      hasPresentationVisuelle: false
    }
  },
  
  [Metier.SMC_MOBILE]: {
    label: 'SMC Mobile',
    requiredTests: {
      typing: true,
      excel: true,
      dictation: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minTypingSpeed: 17,
      minTypingAccuracy: 75,
      minExcel: 3,
      minDictation: 14,
      hasPresentationVisuelle: false
    }
  }
}