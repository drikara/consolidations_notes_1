// lib/metier-config.tsx (VERSION CORRIGÉE)
import { Metier } from '@prisma/client';

export interface MetierConfig {
  label: string;
  criteria: {
    faceToFace: {
      voiceQuality: boolean; // ≥ 3/5
      verbalCommunication: boolean; // ≥ 3/5
      presentationVisuelle?: boolean; // ≥ 3/5 (AGENCES uniquement)
    };
    typing?: {
      required: boolean;
      minSpeed: number; // MPM
      minAccuracy: number; // %
    };
    excel?: {
      required: boolean;
      minScore: number; // /5 (NOTE: C'EST SUR /5, PAS /20)
    };
    dictation?: {
      required: boolean;
      minScore: number; // /20
    };
    simulation?: {
      required: boolean;
      minSensNegociation: number; // /5
      minCapacitePersuasion: number; // /5
      minSensCombativite: number; // /5
    };
    psycho?: {
      required: boolean;
      minRaisonnementLogique: number; // /5
      minAttentionConcentration: number; // /5
    };
    analysis?: {
      required: boolean;
      minScore: number; // /5
    };
  };
}

export const metierConfig: Record<Metier, MetierConfig> = {
  [Metier.CALL_CENTER]: {
    label: 'Call Center',
    criteria: {
      faceToFace: {
        voiceQuality: true,
        verbalCommunication: true,
      },
      typing: {
        required: true,
        minSpeed: 17,
        minAccuracy: 75,
      },
      excel: {
        required: true,
        minScore: 3, // ✅ CORRECTION: /5 et non /20
      },
      dictation: {
        required: true,
        minScore: 14, // /20
      },
    },
  },
  
  [Metier.AGENCES]: {
    label: 'Agences',
    criteria: {
      faceToFace: {
        voiceQuality: true,
        verbalCommunication: true,
        presentationVisuelle: true,
      },
      typing: {
        required: true,
        minSpeed: 17,
        minAccuracy: 75,
      },
      dictation: {
        required: true,
        minScore: 14,
      },
      simulation: {
        required: true,
        minSensNegociation: 3,
        minCapacitePersuasion: 3,
        minSensCombativite: 3,
      },
    },
  },
  
  [Metier.BO_RECLAM]: {
    label: 'BO Réclam',
    criteria: {
      faceToFace: {
        voiceQuality: true,
        verbalCommunication: true,
      },
      typing: {
        required: true,
        minSpeed: 17,
        minAccuracy: 75,
      },
      excel: {
        required: true,
        minScore: 3, // ✅ /5
      },
      dictation: {
        required: true,
        minScore: 14,
      },
      psycho: {
        required: true,
        minRaisonnementLogique: 3,
        minAttentionConcentration: 3,
      },
    },
  },
  
  [Metier.TELEVENTE]: {
    label: 'Télévente',
    criteria: {
      faceToFace: {
        voiceQuality: true,
        verbalCommunication: true,
      },
      typing: {
        required: true,
        minSpeed: 17,
        minAccuracy: 75,
      },
      dictation: {
        required: true,
        minScore: 14,
      },
      simulation: {
        required: true,
        minSensNegociation: 3,
        minCapacitePersuasion: 3,
        minSensCombativite: 3,
      },
    },
  },
  
  [Metier.RESEAUX_SOCIAUX]: {
    label: 'Réseaux Sociaux',
    criteria: {
      faceToFace: {
        voiceQuality: true,
        verbalCommunication: true,
      },
      typing: {
        required: true,
        minSpeed: 23, // ✅ Plus élevé pour Réseaux Sociaux
        minAccuracy: 85, // ✅ Plus élevé pour Réseaux Sociaux
      },
      dictation: {
        required: true,
        minScore: 16, // ✅ Plus élevé pour Réseaux Sociaux
      },
    },
  },
  
  [Metier.SUPERVISION]: {
    label: 'Supervision',
    criteria: {
      faceToFace: {
        voiceQuality: true,
        verbalCommunication: true,
      },
      typing: {
        required: true,
        minSpeed: 17,
        minAccuracy: 75,
      },
      excel: {
        required: true,
        minScore: 3, // ✅ /5
      },
      dictation: {
        required: true,
        minScore: 14,
      },
    },
  },
  
  [Metier.BOT_COGNITIVE_TRAINER]: {
    label: 'Bot Cognitive Trainer',
    criteria: {
      faceToFace: {
        voiceQuality: true,
        verbalCommunication: true,
      },
      excel: {
        required: true,
        minScore: 3, // ✅ /5
      },
      dictation: {
        required: true,
        minScore: 14,
      },
      analysis: {
        required: true,
        minScore: 3, // /5
      },
    },
  },
  
  [Metier.SMC_FIXE]: {
    label: 'SMC Fixe',
    criteria: {
      faceToFace: {
        voiceQuality: true,
        verbalCommunication: true,
      },
      typing: {
        required: true,
        minSpeed: 17,
        minAccuracy: 75,
      },
      excel: {
        required: true,
        minScore: 3, // ✅ /5
      },
      dictation: {
        required: true,
        minScore: 14,
      },
    },
  },
  
  [Metier.SMC_MOBILE]: {
    label: 'SMC Mobile',
    criteria: {
      faceToFace: {
        voiceQuality: true,
        verbalCommunication: true,
      },
      typing: {
        required: true,
        minSpeed: 17,
        minAccuracy: 85, // ✅ Précision plus élevée pour SMC Mobile
      },
      excel: {
        required: true,
        minScore: 3, // ✅ /5
      },
      dictation: {
        required: true,
        minScore: 14,
      },
    },
  },
};

// Helper pour obtenir la config d'un métier
export function getMetierConfig(metier: Metier): MetierConfig {
  return metierConfig[metier];
}

// Helper pour vérifier si un test est requis
export function isTestRequired(metier: Metier, testType: keyof MetierConfig['criteria']): boolean {
  const config = metierConfig[metier];
  const test = config.criteria[testType];
  
  if (typeof test === 'object' && test !== null && 'required' in test) {
    return test.required;
  }
  
  return false;
}

// Helper pour obtenir les seuils minimums
export function getMinimumThresholds(metier: Metier) {
  const config = metierConfig[metier];
  
  return {
    faceToFace: {
      voiceQuality: 3,
      verbalCommunication: 3,
      presentationVisuelle: config.criteria.faceToFace.presentationVisuelle ? 3 : undefined
    },
    typing: config.criteria.typing,
    excel: config.criteria.excel,
    dictation: config.criteria.dictation,
    simulation: config.criteria.simulation,
    psycho: config.criteria.psycho,
    analysis: config.criteria.analysis
  };
}