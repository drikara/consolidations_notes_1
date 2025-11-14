// lib/export-utils.ts - VERSION FINALE CORRIGÉE
import { Metier } from '@prisma/client'
import { 
  
  calculateAutoDecisions, 
  formatDecision,
  calculateJuryAverages 
} from './auto-decisions'

import { 
  metierConfig, 
  getMetierConfig,
 
} from './metier-config'
import { transformPrismaDataArray } from './server-utils'

// Fonction pour nettoyer les valeurs CSV (sans guillemets)
function cleanCSVValue(value: any): string {
  if (value === null || value === undefined || value === '') return ''
  return String(value).replace(/,/g, ';') // Remplacer les virgules par des points-virgules
}

// Fonction pour générer l'export par session
export function generateSessionExport(recruitmentSession: any): { csv: string, filename: string } {
  const candidates = transformPrismaDataArray(recruitmentSession.candidates)
  
  // En-têtes de base - SANS ID Candidat
  const baseHeaders = [
    'N°',
    'Nom Complet',
    'Téléphone',
    'Email',
    'Métier',
    'Âge',
    'Localisation',
    'Disponibilité',
    'Date Entretien',
    'Diplôme',
    'Institution'
  ]

  // Récupérer le métier de la session
  const sessionMetier = recruitmentSession.metier as Metier
  const config = getMetierConfig(sessionMetier)

  // PHASE 1 - Colonnes communes
  const phase1Headers = [
    'Présentation Visuelle',
    'Communication Verbale',
    'Qualité Vocale',
    'Moyenne Phase 1',
    'Décision Phase 1 (FF)',
    'Décision Phase 1'
  ]

  // ⭐ CORRECTION: PHASE 2 - UNIQUEMENT les tests requis par le métier
  const phase2Headers: string[] = []

  if (config.requiredTests.psychotechnical) {
    phase2Headers.push('Test Psychotechnique')
  }
  
  if (config.requiredTests.typing) {
    phase2Headers.push('Vitesse Saisie (MPM)', 'Précision Saisie (%)')
  }
  
  if (config.requiredTests.excel) {
    phase2Headers.push('Test Excel')
  }
  
  if (config.requiredTests.dictation) {
    phase2Headers.push('Dictée')
  }
  
  if (config.requiredTests.salesSimulation) {
    phase2Headers.push('Simulation de Vente')
  }
  
  if (config.requiredTests.analysisExercise) {
    phase2Headers.push('Exercice d\'Analyse')
  }

  // Colonnes de décision finale
  const decisionHeaders = [
    'Décision Phase 2 (FF)',
    'Décision Finale'
  ]

  // Combiner tous les en-têtes
  const headers = [
    ...baseHeaders,
    ...phase1Headers,
    ...phase2Headers,
    ...decisionHeaders
  ]

  // Générer les lignes de données
  const rows = candidates.map((candidate, index) => {
    // ⭐ CORRECTION: Calculer les moyennes des jurys AVEC les bons champs
    const juryAverages = calculateJuryAverages(candidate.faceToFaceScores)
    
    // Récupérer les scores
    const scores = candidate.scores || {}

    // ⭐ CORRECTION CRITIQUE: Utiliser les données réelles au lieu de 0
    // Les champs camelCase viennent de Prisma, on les mappe vers snake_case pour calculateAutoDecisions
    const scoreData = {
      presentation_visuelle: scores.presentationVisuelle || juryAverages.presentation_visuelle || 0,
      verbal_communication: scores.verbalCommunication || juryAverages.verbal_communication || 0,
      voice_quality: scores.voiceQuality || juryAverages.voice_quality || 0,
      psychotechnical_test: scores.psychotechnicalTest || 0,
      typing_speed: scores.typingSpeed || 0,
      typing_accuracy: scores.typingAccuracy || 0,
      excel_test: scores.excelTest || 0,
      dictation: scores.dictation || 0,
      sales_simulation: scores.salesSimulation || 0,
      analysis_exercise: scores.analysisExercise || 0
    }

    // ⭐ CORRECTION: Calculer la moyenne Phase 1 basée sur les 3 critères
    const phase1Avg = (
      scoreData.presentation_visuelle + 
      scoreData.verbal_communication + 
      scoreData.voice_quality
    ) / 3

    // ⭐ CORRECTION: Calculer les décisions automatiques avec les VRAIES données
    const autoDecisions = calculateAutoDecisions(
      candidate.metier as Metier,
      scoreData,
      phase1Avg
    )

    // Données de base - AVEC NUMÉRO et SANS ID
    const baseData = [
      index + 1, // N°
      candidate.fullName,
      candidate.phone,
      candidate.email,
      candidate.metier,
      candidate.age,
      candidate.location,
      candidate.availability,
      candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '',
      candidate.diploma,
      candidate.institution
    ]

    // ⭐ CORRECTION: Données Phase 1 avec VRAIES valeurs
    const phase1Data = [
      scoreData.presentation_visuelle || 0,
      scoreData.verbal_communication || 0,
      scoreData.voice_quality || 0,
      phase1Avg.toFixed(2),
      // ⭐ CORRECTION: Nettoyer les emojis et éviter "Non calculé"
      autoDecisions.phase1FfDecision ? formatDecision(autoDecisions.phase1FfDecision).replace(/✅ |❌ |🎯 |🚫 /g, '') : 'NON_CALCULE',
      autoDecisions.phase1Decision ? formatDecision(autoDecisions.phase1Decision).replace(/✅ |❌ |🎯 |🚫 /g, '') : 'NON_CALCULE'
    ]

    // ⭐ CORRECTION: Données Phase 2 - UNIQUEMENT les colonnes du métier
    const phase2Data: any[] = []

    if (config.requiredTests.psychotechnical) {
      phase2Data.push(scores.psychotechnicalTest || '')
    }
    
    if (config.requiredTests.typing) {
      phase2Data.push(scores.typingSpeed || '', scores.typingAccuracy || '')
    }
    
    if (config.requiredTests.excel) {
      phase2Data.push(scores.excelTest || '')
    }
    
    if (config.requiredTests.dictation) {
      phase2Data.push(scores.dictation || '')
    }
    
    if (config.requiredTests.salesSimulation) {
      phase2Data.push(scores.salesSimulation || '')
    }
    
    if (config.requiredTests.analysisExercise) {
      phase2Data.push(scores.analysisExercise || '')
    }

    // Données de décision
    const decisionData = [
      // ⭐ CORRECTION: Éviter "Non calculé"
      autoDecisions.phase2FfDecision ? formatDecision(autoDecisions.phase2FfDecision).replace(/✅ |❌ |🎯 |🚫 /g, '') : 'NON_CALCULE',
      autoDecisions.finalDecision ? formatDecision(autoDecisions.finalDecision).replace(/✅ |❌ |🎯 |🚫 /g, '') : 'NON_CALCULE'
    ]

    return [...baseData, ...phase1Data, ...phase2Data, ...decisionData]
  })

  // ⭐ CORRECTION: Convertir en CSV SANS guillemets
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => cleanCSVValue(field)).join(','))
  ].join('\n')

  const filename = `session_${recruitmentSession.metier}_${recruitmentSession.jour}_${recruitmentSession.date.toISOString().split('T')[0]}.csv`

  return { csv: csvContent, filename }
}

// Fonction pour générer l'export consolidé AVEC TOUTES LES COLONNES
export function generateConsolidatedExport(recruitmentSessions: any[]): { csv: string, filename: string } {
  // Collecter tous les candidats de toutes les sessions
  const allCandidates = recruitmentSessions.flatMap(session => 
    transformPrismaDataArray(session.candidates)
  )

  // ⭐ CORRECTION: En-têtes ADAPTÉS selon le métier de chaque session
  // On va déterminer les colonnes Phase 2 dynamiquement
  const baseHeaders = [
    'N°',
    'Métier Session', 
    'Date Session',
    'Jour Session',
    'Statut Session',
    'Nom Complet',
    'Téléphone',
    'Email',
    'Métier Candidat',
    'Âge',
    'Localisation',
    'Disponibilité',
    'Date Entretien',
    'Diplôme',
    'Institution',
    // PHASE 1 - Scores jury
    'Présentation Visuelle',
    'Communication Verbale',
    'Qualité Vocale',
    'Moyenne Phase 1',
    'Décision Phase 1 (FF)',
    'Décision Phase 1'
  ]

  // ⭐ CORRECTION: Colonnes Phase 2 - TOUS les tests possibles
  const phase2Headers = [
    'Test Psychotechnique',
    'Vitesse Saisie (MPM)',
    'Précision Saisie (%)',
    'Test Excel',
    'Dictée',
    'Simulation de Vente',
    'Exercice d\'Analyse'
  ]

  const decisionHeaders = [
    'Décision Phase 2 (FF)',
    'Décision Finale'
  ]

  const headers = [...baseHeaders, ...phase2Headers, ...decisionHeaders]

  // Générer les lignes de données
  const rows = allCandidates.map((candidate, index) => {
    // Trouver la session du candidat
    const session = recruitmentSessions.find(s => 
      s.candidates.some((c: any) => c.id === candidate.id)
    )

    // ⭐ CORRECTION: Calculer les moyennes des jurys
    const juryAverages = calculateJuryAverages(candidate.faceToFaceScores)
    
    // Récupérer les scores
    const scores = candidate.scores || {}

    // ⭐ CORRECTION CRITIQUE: Utiliser les données réelles
    const scoreData = {
      presentation_visuelle: scores.presentationVisuelle || juryAverages.presentation_visuelle || 0,
      verbal_communication: scores.verbalCommunication || juryAverages.verbal_communication || 0,
      voice_quality: scores.voiceQuality || juryAverages.voice_quality || 0,
      psychotechnical_test: scores.psychotechnicalTest || 0,
      typing_speed: scores.typingSpeed || 0,
      typing_accuracy: scores.typingAccuracy || 0,
      excel_test: scores.excelTest || 0,
      dictation: scores.dictation || 0,
      sales_simulation: scores.salesSimulation || 0,
      analysis_exercise: scores.analysisExercise || 0
    }

    // Calculer la moyenne Phase 1
    const phase1Avg = (
      scoreData.presentation_visuelle + 
      scoreData.verbal_communication + 
      scoreData.voice_quality
    ) / 3

    // ⭐ CORRECTION: Calculer les décisions automatiques
    const autoDecisions = calculateAutoDecisions(
      candidate.metier as Metier,
      scoreData,
      phase1Avg
    )

    return [
      // ⭐ NUMÉRO de ligne
      index + 1,
      // Informations session
      session?.metier || '',
      session?.date ? new Date(session.date).toISOString().split('T')[0] : '',
      session?.jour || '',
      session?.status || '',
      // Informations candidat
      candidate.fullName,
      candidate.phone,
      candidate.email,
      candidate.metier,
      candidate.age,
      candidate.location,
      candidate.availability,
      candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '',
      candidate.diploma,
      candidate.institution,
      // ⭐ CORRECTION: PHASE 1 avec VRAIES valeurs
      scoreData.presentation_visuelle || 0,
      scoreData.verbal_communication || 0,
      scoreData.voice_quality || 0,
      phase1Avg.toFixed(2),
      // ⭐ CORRECTION: Décisions calculées
      autoDecisions.phase1FfDecision ? formatDecision(autoDecisions.phase1FfDecision).replace(/✅ |❌ |🎯 |🚫 /g, '') : 'NON_CALCULE',
      autoDecisions.phase1Decision ? formatDecision(autoDecisions.phase1Decision).replace(/✅ |❌ |🎯 |🚫 /g, '') : 'NON_CALCULE',
      // PHASE 2 - TOUTES les colonnes
      scores.psychotechnicalTest || '',
      scores.typingSpeed || '',
      scores.typingAccuracy || '',
      scores.excelTest || '',
      scores.dictation || '',
      scores.salesSimulation || '',
      scores.analysisExercise || '',
      // Décisions
      autoDecisions.phase2FfDecision ? formatDecision(autoDecisions.phase2FfDecision).replace(/✅ |❌ |🎯 |🚫 /g, '') : 'NON_CALCULE',
      autoDecisions.finalDecision ? formatDecision(autoDecisions.finalDecision).replace(/✅ |❌ |🎯 |🚫 /g, '') : 'NON_CALCULE'
    ]
  })

  // ⭐ CORRECTION: Convertir en CSV SANS guillemets
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => cleanCSVValue(field)).join(','))
  ].join('\n')

  const filename = `export_consolide_${new Date().toISOString().split('T')[0]}.csv`

  return { csv: csvContent, filename }
}