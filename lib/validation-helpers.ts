
//  lib/validation-helpers.ts

import { Metier } from '@prisma/client';
import { metierConfig } from './metier-config';

export function validateFaceToFace(
  metier: Metier,
  scores: {
    voiceQuality: number;
    verbalCommunication: number;
    presentationVisuelle?: number;
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = metierConfig[metier].criteria.faceToFace;

  if (config.voiceQuality && scores.voiceQuality < 3) {
    errors.push('Qualité de la voix doit être ≥ 3/5');
  }

  if (config.verbalCommunication && scores.verbalCommunication < 3) {
    errors.push('Communication verbale doit être ≥ 3/5');
  }

  if (config.presentationVisuelle && (!scores.presentationVisuelle || scores.presentationVisuelle < 3)) {
    errors.push('Présentation visuelle doit être ≥ 3/5 (AGENCES)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateSimulation(
  scores: {
    sensNegociation: number;
    capacitePersuasion: number;
    sensCombativite: number;
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (scores.sensNegociation < 3) errors.push('Sens de la négociation doit être ≥ 3/5');
  if (scores.capacitePersuasion < 3) errors.push('Capacité de persuasion doit être ≥ 3/5');
  if (scores.sensCombativite < 3) errors.push('Sens de la combativité doit être ≥ 3/5');

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validatePsycho(
  scores: {
    raisonnementLogique: number;
    attentionConcentration: number;
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (scores.raisonnementLogique < 3) errors.push('Raisonnement logique doit être ≥ 3/5');
  if (scores.attentionConcentration < 3) errors.push('Attention et concentration doit être ≥ 3/5');

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateAllMetierConditions(
  metier: Metier,
  allScores: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = metierConfig[metier].criteria;

  // Validation Face à Face
  const ffValidation = validateFaceToFace(metier, {
    voiceQuality: allScores.voiceQuality || 0,
    verbalCommunication: allScores.verbalCommunication || 0,
    presentationVisuelle: allScores.presentationVisuelle
  });
  errors.push(...ffValidation.errors);

  // Validation Typing
  if (config.typing?.required) {
    if (!allScores.typingSpeed || allScores.typingSpeed < config.typing.minSpeed) {
      errors.push(`Rapidité de saisie doit être ≥ ${config.typing.minSpeed} MPM`);
    }
    if (!allScores.typingAccuracy || allScores.typingAccuracy < config.typing.minAccuracy) {
      errors.push(`Précision de saisie doit être ≥ ${config.typing.minAccuracy}%`);
    }
  }

  // Validation Excel
  if (config.excel?.required) {
    if (!allScores.excelTest || allScores.excelTest < config.excel.minScore) {
      errors.push(`Test Excel doit être ≥ ${config.excel.minScore}/5`);
    }
  }

  // Validation Dictation
  if (config.dictation?.required) {
    if (!allScores.dictation || allScores.dictation < config.dictation.minScore) {
      errors.push(`Dictée doit être ≥ ${config.dictation.minScore}/20`);
    }
  }

  // Validation Simulation
  if (config.simulation?.required) {
    const simValidation = validateSimulation({
      sensNegociation: allScores.simulationSensNegociation || 0,
      capacitePersuasion: allScores.simulationCapacitePersuasion || 0,
      sensCombativite: allScores.simulationSensCombativite || 0
    });
    errors.push(...simValidation.errors);
  }

  // Validation Psycho
  if (config.psycho?.required) {
    const psychoValidation = validatePsycho({
      raisonnementLogique: allScores.psychoRaisonnementLogique || 0,
      attentionConcentration: allScores.psychoAttentionConcentration || 0
    });
    errors.push(...psychoValidation.errors);
  }

  // Validation Analysis
  if (config.analysis?.required) {
    if (!allScores.analysisExercise || allScores.analysisExercise < config.analysis.minScore) {
      errors.push(`Exercice d'analyse doit être ≥ ${config.analysis.minScore}/5`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function determineFinalDecision(
  metier: Metier,
  availability: string,
  allScores: any
): 'RECRUTE' | 'NON_RECRUTE' {
  if (availability === 'NON') return 'NON_RECRUTE';

  const validation = validateAllMetierConditions(metier, allScores);
  return validation.valid ? 'RECRUTE' : 'NON_RECRUTE';
}