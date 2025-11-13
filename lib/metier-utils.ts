import { Metier, FFDecision, Decision, FinalDecision } from '@prisma/client'
import { metierConfig } from './metier-config'

export interface ScoreData {
  presentation_visuelle?: number
  verbal_communication?: number
  voice_quality?: number
  psychotechnical_test?: number
  typing_speed?: number
  typing_accuracy?: number
  excel_test?: number
  dictation?: number
  sales_simulation?: number
  analysis_exercise?: number
}

export interface AutoDecisions {
  phase1FfDecision: FFDecision | null
  phase1Decision: Decision | null
  phase2FfDecision: FFDecision | null
  finalDecision: FinalDecision | null
}

export function calculateAutoDecisions(
  metier: Metier,
  scores: ScoreData,
  faceToFacePhase1Avg: number = 0
): AutoDecisions {
  const config = metierConfig[metier]
  
  let phase1FfDecision: FFDecision | null = null
  let phase1Decision: Decision | null = null
  let phase2FfDecision: FFDecision | null = null
  let finalDecision: FinalDecision | null = null

  // PHASE 1 - Calcul basé sur les 3 critères
  const phase1Scores = [
    scores.presentation_visuelle || 0,
    scores.verbal_communication || 0,
    scores.voice_quality || 0
  ]
  
  const hasPhase1Scores = phase1Scores.some(score => score > 0)
  
  if (hasPhase1Scores) {
    const phase1Avg = phase1Scores.reduce((sum, score) => sum + score, 0) / 3
    
    phase1FfDecision = phase1Avg >= config.criteria.minPhase1 ? 'FAVORABLE' : 'DEFAVORABLE'
    phase1Decision = phase1FfDecision === 'FAVORABLE' ? 'ADMIS' : 'ELIMINE'
  }

  // PHASE 2 - Logique selon le métier
  if (phase1FfDecision === 'FAVORABLE' && config.criteria.requiresPhase2) {
    // Métiers avec jury Phase 2 (tous sauf BO_RECLAM)
    const phase2Tests: boolean[] = []
    
    if (config.requiredTests.typing) {
      const hasTypingScores = (scores.typing_speed || 0) > 0 && (scores.typing_accuracy || 0) > 0
      if (hasTypingScores) {
        const typingPass = (scores.typing_speed || 0) >= (config.criteria.minTypingSpeed || 0) && 
                          (scores.typing_accuracy || 0) >= (config.criteria.minTypingAccuracy || 0)
        phase2Tests.push(typingPass)
      }
    }
    
    if (config.requiredTests.excel) {
      const hasExcelScore = (scores.excel_test || 0) > 0
      if (hasExcelScore) {
        const excelPass = (scores.excel_test || 0) >= (config.criteria.minExcel || 0)
        phase2Tests.push(excelPass)
      }
    }
    
    if (config.requiredTests.dictation) {
      const hasDictationScore = (scores.dictation || 0) > 0
      if (hasDictationScore) {
        const dictationPass = (scores.dictation || 0) >= (config.criteria.minDictation || 0)
        phase2Tests.push(dictationPass)
      }
    }
    
    if (config.requiredTests.salesSimulation) {
      const hasSalesScore = (scores.sales_simulation || 0) > 0
      if (hasSalesScore) {
        const salesPass = (scores.sales_simulation || 0) >= (config.criteria.minSalesSimulation || 0)
        phase2Tests.push(salesPass)
      }
    }
    
    if (config.requiredTests.analysisExercise) {
      const hasAnalysisScore = (scores.analysis_exercise || 0) > 0
      if (hasAnalysisScore) {
        const analysisPass = (scores.analysis_exercise || 0) >= (config.criteria.minAnalysis || 0)
        phase2Tests.push(analysisPass)
      }
    }
    
    if (config.requiredTests.psychotechnical) {
      const hasPsychotechnicalScore = (scores.psychotechnical_test || 0) > 0
      if (hasPsychotechnicalScore) {
        const psychotechnicalPass = (scores.psychotechnical_test || 0) >= (config.criteria.minPsychotechnical || 0)
        phase2Tests.push(psychotechnicalPass)
      }
    }
    
    if (phase2Tests.length > 0) {
      const phase2Pass = phase2Tests.every(test => test === true)
      phase2FfDecision = phase2Pass ? 'FAVORABLE' : 'DEFAVORABLE'
    }
  } else if (phase1FfDecision === 'FAVORABLE' && !config.criteria.requiresPhase2) {
    // CAS BO_RECLAM : Pas de jury Phase 2, mais tests techniques Phase 2
    const phase2Tests: boolean[] = []
    
    if (config.requiredTests.typing) {
      const hasTypingScores = (scores.typing_speed || 0) > 0 && (scores.typing_accuracy || 0) > 0
      if (hasTypingScores) {
        const typingPass = (scores.typing_speed || 0) >= (config.criteria.minTypingSpeed || 0) && 
                          (scores.typing_accuracy || 0) >= (config.criteria.minTypingAccuracy || 0)
        phase2Tests.push(typingPass)
      }
    }
    
    if (config.requiredTests.excel) {
      const hasExcelScore = (scores.excel_test || 0) > 0
      if (hasExcelScore) {
        const excelPass = (scores.excel_test || 0) >= (config.criteria.minExcel || 0)
        phase2Tests.push(excelPass)
      }
    }
    
    if (config.requiredTests.dictation) {
      const hasDictationScore = (scores.dictation || 0) > 0
      if (hasDictationScore) {
        const dictationPass = (scores.dictation || 0) >= (config.criteria.minDictation || 0)
        phase2Tests.push(dictationPass)
      }
    }
    
    if (config.requiredTests.psychotechnical) {
      const hasPsychotechnicalScore = (scores.psychotechnical_test || 0) > 0
      if (hasPsychotechnicalScore) {
        const psychotechnicalPass = (scores.psychotechnical_test || 0) >= (config.criteria.minPsychotechnical || 0)
        phase2Tests.push(psychotechnicalPass)
      }
    }
    
    if (phase2Tests.length > 0) {
      const phase2Pass = phase2Tests.every(test => test === true)
      phase2FfDecision = phase2Pass ? 'FAVORABLE' : 'DEFAVORABLE'
    }
  } else if (phase1FfDecision === 'DEFAVORABLE') {
    phase2FfDecision = 'DEFAVORABLE'
  }

  // DÉCISION FINALE
  if (phase1FfDecision === 'DEFAVORABLE') {
    finalDecision = 'NON_RECRUTE'
  } else if (phase1FfDecision === 'FAVORABLE') {
    if (phase2FfDecision === 'FAVORABLE') {
      finalDecision = 'RECRUTE'
    } else if (phase2FfDecision === 'DEFAVORABLE') {
      finalDecision = 'NON_RECRUTE'
    }
  }

  return {
    phase1FfDecision,
    phase1Decision,
    phase2FfDecision,
    finalDecision
  }
}

export function shouldShowTest(metier: Metier, testName: keyof typeof metierConfig[Metier]['requiredTests']): boolean {
  const config = metierConfig[metier]
  return config.requiredTests[testName] || false
}

export function getMetierTests(metier: Metier): string[] {
  const config = metierConfig[metier]
  const tests: string[] = []
  
  if (config.requiredTests.typing) tests.push('Saisie (17 MPM + 85%)')
  if (config.requiredTests.excel) tests.push('Excel (≥ 3/5)')
  if (config.requiredTests.dictation) tests.push('Dictée (≥ 16/20)')
  if (config.requiredTests.salesSimulation) tests.push('Simulation Vente (≥ 3/5)')
  if (config.requiredTests.psychotechnical) tests.push('Test Psychotechnique (≥ 8/10)')
  if (config.requiredTests.analysisExercise) tests.push('Exercice Analyse (≥ 6/10)')
  
  return tests
}

export function formatDecision(decision: string | null): string {
  if (!decision) return 'Non calculé'
  
  const decisionMap: Record<string, string> = {
    'FAVORABLE': '✅ FAVORABLE',
    'DEFAVORABLE': '❌ DÉFAVORABLE', 
    'ADMIS': '✅ ADMIS',
    'ELIMINE': '❌ ÉLIMINÉ',
    'RECRUTE': '🎯 RECRUTE',
    'NON_RECRUTE': '🚫 NON RECRUTE'
  }
  
  return decisionMap[decision] || decision
}

// NOUVELLES FONCTIONS POUR LA CONSOLIDATION WFM
export function calculateJuryAverages(faceToFaceScores: any[]) {
  const phase1FF = faceToFaceScores.filter((s) => s.phase === 1)
  
  if (phase1FF.length === 0) {
    return {
      presentation_visuelle: 0,
      verbal_communication: 0, 
      voice_quality: 0,
      overall: 0
    }
  }

  const presAvg = phase1FF.reduce((sum, s) => sum + (Number(s.presentation_visuelle) || 0), 0) / phase1FF.length
  const verbalAvg = phase1FF.reduce((sum, s) => sum + (Number(s.verbal_communication) || 0), 0) / phase1FF.length
  const voiceAvg = phase1FF.reduce((sum, s) => sum + (Number(s.voice_quality) || 0), 0) / phase1FF.length
  const overallAvg = phase1FF.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / phase1FF.length

  return {
    presentation_visuelle: Number(presAvg.toFixed(2)),
    verbal_communication: Number(verbalAvg.toFixed(2)),
    voice_quality: Number(voiceAvg.toFixed(2)),
    overall: Number(overallAvg.toFixed(2))
  }
}

export function checkScoreConsistency(wfmScores: any, juryAverages: any, tolerance: number = 0.5) {
  const inconsistencies = []

  if (wfmScores.presentation_visuelle && juryAverages.presentation_visuelle) {
    const diff = Math.abs(Number(wfmScores.presentation_visuelle) - juryAverages.presentation_visuelle)
    if (diff > tolerance) {
      inconsistencies.push({
        criterion: 'Présentation Visuelle',
        wfmScore: wfmScores.presentation_visuelle,
        juryAverage: juryAverages.presentation_visuelle,
        difference: diff.toFixed(2)
      })
    }
  }

  if (wfmScores.verbal_communication && juryAverages.verbal_communication) {
    const diff = Math.abs(Number(wfmScores.verbal_communication) - juryAverages.verbal_communication)
    if (diff > tolerance) {
      inconsistencies.push({
        criterion: 'Communication Verbale',
        wfmScore: wfmScores.verbal_communication,
        juryAverage: juryAverages.verbal_communication,
        difference: diff.toFixed(2)
      })
    }
  }

  if (wfmScores.voice_quality && juryAverages.voice_quality) {
    const diff = Math.abs(Number(wfmScores.voice_quality) - juryAverages.voice_quality)
    if (diff > tolerance) {
      inconsistencies.push({
        criterion: 'Qualité Vocale',
        wfmScore: wfmScores.voice_quality,
        juryAverage: juryAverages.voice_quality,
        difference: diff.toFixed(2)
      })
    }
  }

  return inconsistencies
}