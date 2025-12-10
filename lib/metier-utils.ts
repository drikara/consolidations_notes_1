// ============================================================================
// FILE 2: lib/metier-utils.ts
// ============================================================================
import { Metier } from '@prisma/client';
import { metierConfig, getMetierConfig } from './metier-config';

export function shouldShowTest(metier: Metier, testName: string): boolean {
  const config = getMetierConfig(metier);
  
  switch (testName) {
    case 'typing':
      return config.criteria.typing?.required || false;
    case 'excel':
      return config.criteria.excel?.required || false;
    case 'dictation':
      return config.criteria.dictation?.required || false;
    case 'salesSimulation':
      return config.criteria.simulation?.required || false;
    case 'psychotechnical':
      return config.criteria.psycho?.required || false;
    case 'analysisExercise':
      return config.criteria.analysis?.required || false;
    default:
      return false;
  }
}

export { getMetierConfig, metierConfig };

export function calculateAutoDecisions(
  metier: Metier,
  scores: any
) {
  // Implémentation de base - à compléter selon vos besoins
  return {
    phase1FfDecision: null,
    phase1Decision: null,
    decisionTest: null,
    finalDecision: null
  };
}
