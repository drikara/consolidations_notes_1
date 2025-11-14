// lib/export-utils.ts
import { Metier } from '@prisma/client'
import { metierConfig, getMetierConfig } from './metier-config'
import { transformPrismaDataArray } from './server-utils'
import { calculateAutoDecisions, formatDecision, calculateJuryAverages } from './auto-decisions'

// Fonction pour générer l'export par session
export function generateSessionExport(recruitmentSession: any): { csv: string, filename: string } {
  const candidates = transformPrismaDataArray(recruitmentSession.candidates)
  
  // En-têtes de base communs à tous les métiers
  const baseHeaders = [
    'ID Candidat',
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

  // Récupérer le métier de la session pour déterminer les colonnes spécifiques
  const sessionMetier = recruitmentSession.metier as Metier
  const config = getMetierConfig(sessionMetier)

  // Colonnes spécifiques au métier
  const metierSpecificHeaders: string[] = []

  // PHASE 1 - Colonnes communes
  const phase1Headers = [
    'Présentation Visuelle (Moyenne)',
    'Communication Verbale (Moyenne)',
    'Qualité Vocale (Moyenne)',
    'Moyenne Phase 1',
    'Décision Phase 1 (FF)',
    'Décision Phase 1'
  ]

  // PHASE 2 - Colonnes selon les tests requis
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
  const rows = candidates.map(candidate => {
    // Calculer les moyennes des jurys
    const juryAverages = calculateJuryAverages(candidate.faceToFaceScores)
    
    // Récupérer les scores
    const scores = candidate.scores || {}

    // Calculer les décisions automatiques
    const autoDecisions = calculateAutoDecisions(
      candidate.metier as Metier,
      {
        presentation_visuelle: juryAverages.presentation_visuelle,
        verbal_communication: juryAverages.verbal_communication,
        voice_quality: juryAverages.voice_quality,
        psychotechnical_test: scores.psychotechnicalTest,
        typing_speed: scores.typingSpeed,
        typing_accuracy: scores.typingAccuracy,
        excel_test: scores.excelTest,
        dictation: scores.dictation,
        sales_simulation: scores.salesSimulation,
        analysis_exercise: scores.analysisExercise
      },
      juryAverages.overall
    )

    // Données de base
    const baseData = [
      candidate.id,
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

    // Données Phase 1
    const phase1Data = [
      juryAverages.presentation_visuelle,
      juryAverages.verbal_communication,
      juryAverages.voice_quality,
      juryAverages.overall,
      formatDecision(autoDecisions.phase1FfDecision),
      formatDecision(autoDecisions.phase1Decision)
    ]

    // Données Phase 2 - SEULEMENT les colonnes spécifiques au métier
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
      formatDecision(autoDecisions.phase2FfDecision),
      formatDecision(autoDecisions.finalDecision)
    ]

    return [...baseData, ...phase1Data, ...phase2Data, ...decisionData]
  })

  // Convertir en CSV
  const csvContent = [
    headers,
    ...rows
  ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

  const filename = `session_${recruitmentSession.metier}_${recruitmentSession.jour}_${recruitmentSession.date.toISOString().split('T')[0]}.csv`

  return { csv: csvContent, filename }
}

// Fonction pour générer l'export consolidé AVEC TOUTES LES COLONNES
export function generateConsolidatedExport(recruitmentSessions: any[]): { csv: string, filename: string } {
  // Collecter tous les candidats de toutes les sessions
  const allCandidates = recruitmentSessions.flatMap(session => 
    transformPrismaDataArray(session.candidates)
  )

  // En-têtes COMPLETS avec TOUTES les colonnes possibles
  const headers = [
    // Informations session
    'Session ID',
    'Métier Session', 
    'Date Session',
    'Jour Session',
    'Statut Session',
    // Informations candidat
    'ID Candidat',
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
    'Présentation Visuelle (Moyenne)',
    'Communication Verbale (Moyenne)',
    'Qualité Vocale (Moyenne)',
    'Moyenne Phase 1',
    'Décision Phase 1 (FF)',
    'Décision Phase 1',
    // PHASE 2 - TOUS les tests possibles
    'Test Psychotechnique',
    'Vitesse Saisie (MPM)',
    'Précision Saisie (%)',
    'Test Excel',
    'Dictée',
    'Simulation de Vente',
    'Exercice d\'Analyse',
    // Décisions
    'Décision Phase 2 (FF)',
    'Décision Finale'
  ]

  // Générer les lignes de données
  const rows = allCandidates.map(candidate => {
    // Trouver la session du candidat
    const session = recruitmentSessions.find(s => 
      s.candidates.some((c: any) => c.id === candidate.id)
    )

    // Calculer les moyennes des jurys
    const juryAverages = calculateJuryAverages(candidate.faceToFaceScores)
    
    // Récupérer les scores
    const scores = candidate.scores || {}

    // Calculer les décisions automatiques
    const autoDecisions = calculateAutoDecisions(
      candidate.metier as Metier,
      {
        presentation_visuelle: juryAverages.presentation_visuelle,
        verbal_communication: juryAverages.verbal_communication,
        voice_quality: juryAverages.voice_quality,
        psychotechnical_test: scores.psychotechnicalTest,
        typing_speed: scores.typingSpeed,
        typing_accuracy: scores.typingAccuracy,
        excel_test: scores.excelTest,
        dictation: scores.dictation,
        sales_simulation: scores.salesSimulation,
        analysis_exercise: scores.analysisExercise
      },
      juryAverages.overall
    )

    return [
      // Informations session
      session?.id || '',
      session?.metier || '',
      session?.date ? new Date(session.date).toISOString().split('T')[0] : '',
      session?.jour || '',
      session?.status || '',
      // Informations candidat
      candidate.id,
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
      // PHASE 1
      juryAverages.presentation_visuelle,
      juryAverages.verbal_communication,
      juryAverages.voice_quality,
      juryAverages.overall,
      formatDecision(autoDecisions.phase1FfDecision),
      formatDecision(autoDecisions.phase1Decision),
      // PHASE 2 - TOUTES les colonnes (vides si non applicables)
      scores.psychotechnicalTest || '',
      scores.typingSpeed || '',
      scores.typingAccuracy || '',
      scores.excelTest || '',
      scores.dictation || '',
      scores.salesSimulation || '',
      scores.analysisExercise || '',
      // Décisions
      formatDecision(autoDecisions.phase2FfDecision),
      formatDecision(autoDecisions.finalDecision)
    ]
  })

  // Convertir en CSV
  const csvContent = [
    headers,
    ...rows
  ].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n')

  const filename = `export_consolide_${new Date().toISOString().split('T')[0]}.csv`

  return { csv: csvContent, filename }
}

// Fonction utilitaire pour exporter une seule session
export function generateSingleSessionExport(recruitmentSession: any): { csv: string, filename: string } {
  return generateSessionExport(recruitmentSession)
}