// lib/export-utils.ts
import { Metier } from '@prisma/client'
import { metierConfig } from './metier-config'

// ✅ Définir les colonnes spécifiques à chaque métier
const metierColumns: Record<Metier, string[]> = {
  [Metier.CALL_CENTER]: [
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Test Excel (/5)',
    'Dictée (/20)',
    'Date de présence Phase 2'
  ],
  [Metier.AGENCES]: [
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Dictée (/20)',
    'Date de présence Phase 2',
    'Simulation de Vente (/5)'
  ],
  [Metier.BO_RECLAM]: [
    'Test Psychotechnique (/10)',
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Test Excel (/5)',
    'Dictée (/20)',
    'Date de présence Phase 2'
  ],
  [Metier.TELEVENTE]: [
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Dictée (/20)',
    'Date de présence Phase 2',
    'Simulation de Vente (/5)'
  ],
  [Metier.RESEAUX_SOCIAUX]: [
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Dictée (/20)',
    'Date de présence Phase 2'
  ],
  [Metier.SUPERVISION]: [
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Test Excel (/5)',
    'Dictée (/20)',
    'Date de présence Phase 2'
  ],
  [Metier.BOT_COGNITIVE_TRAINER]: [
    'Test Excel (/5)',
    'Dictée (/20)',
    'Date de présence Phase 2',
    'Exercice d\'Analyse (/10)'
  ],
  [Metier.SMC_FIXE]: [
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Test Excel (/5)',
    'Dictée (/20)',
    'Date de présence Phase 2'
  ],
  [Metier.SMC_MOBILE]: [
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Test Excel (/5)',
    'Dictée (/20)',
    'Date de présence Phase 2'
  ]
}

// ✅ Fonction pour obtenir la valeur d'une colonne selon le métier
function getColumnValue(candidate: any, columnName: string): string {
  const scores = candidate.scores
  
  switch (columnName) {
    case 'Test Psychotechnique (/10)':
      return scores?.psychotechnicalTest?.toString() || ''
    case 'Rapidité de saisie (MPM)':
      return scores?.typingSpeed?.toString() || ''
    case 'Précision de saisie (%)':
      return scores?.typingAccuracy?.toString() || ''
    case 'Test Excel (/5)':
      return scores?.excelTest?.toString() || ''
    case 'Dictée (/20)':
      return scores?.dictation?.toString() || ''
    case 'Date de présence Phase 2':
      return scores?.phase2Date ? new Date(scores.phase2Date).toLocaleDateString('fr-FR') : ''
    case 'Simulation de Vente (/5)':
      return scores?.salesSimulation?.toString() || ''
    case 'Exercice d\'Analyse (/10)':
      return scores?.analysisExercise?.toString() || ''
    default:
      return ''
  }
}

// ✅ Fonction pour calculer la moyenne d'un critère Phase 1 pour tous les jurys
function calculatePhase1CriteriaAverage(faceToFaceScores: any[], criteria: 'presentationVisuelle' | 'verbalCommunication' | 'voiceQuality'): string {
  const phase1Scores = faceToFaceScores.filter(s => s.phase === 1)
  
  if (phase1Scores.length === 0) return ''
  
  const avg = phase1Scores.reduce((sum, score) => {
    return sum + (Number(score[criteria]) || 0)
  }, 0) / phase1Scores.length
  
  return avg.toFixed(2)
}

// ✅ Fonction utilitaire pour échapper les valeurs CSV
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// ✅ Export par session (CSV)
export function generateSessionExport(session: any): { csv: string, filename: string } {
  const metier = session.metier
  const sessionDate = new Date(session.date).toISOString().split('T')[0]
  
  // En-têtes réorganisés selon les demandes
  const baseHeaders = [
    'Numéro',
    'Noms et Prénoms',
    'Numéro de Téléphone',
    'Date de naissance',
    'Âge',
    'Diplôme',
    'Établissement fréquenté',
    'Email',
    'Lieu d\'habitation',
    'Date d\'envoi SMS',
    'Disponibilité candidat',
    'Date de présence entretien',
    'Métier Candidat',
    'Session Métier',
    'Date de Session',
    'Jour de Session',
    'Statut de Session',
    // Phase 1
    'Présentation Visuelle',
    'Communication Verbale',
    'Qualité Vocale',
    'Décision FF Phase 1',
    'Décision Phase 1'
  ]
  
  const metierSpecificColumns = metierColumns[metier as Metier] || []
  
  // Ajouter les colonnes métier après Décision Phase 1, puis le reste
  const headers = [
    ...baseHeaders,
    ...metierSpecificColumns,
    // Phase 2
    'Décision FF Phase 2',
    // Appels
    'Statut Appel',
    // Décision finale et commentaire
    'Décision Finale',
    'Commentaire'
  ]
  
  // Générer les lignes
  const rows = session.candidates.map((candidate: any, index: number) => {
    const baseRow = [
      (index + 1).toString(),
      candidate.fullName || '',
      candidate.phone || '',
      candidate.birthDate ? new Date(candidate.birthDate).toLocaleDateString('fr-FR') : '',
      candidate.age?.toString() || '',
      candidate.diploma || '',
      candidate.institution || '',
      candidate.email || '',
      candidate.location || '',
      candidate.smsSentDate ? new Date(candidate.smsSentDate).toLocaleDateString('fr-FR') : '',
      candidate.availability || '',
      candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '',
      candidate.metier || '',
      session.metier || '',
      sessionDate,
      session.jour || '',
      session.status || '',
      // Phase 1
      calculatePhase1CriteriaAverage(candidate.faceToFaceScores || [], 'presentationVisuelle'),
      calculatePhase1CriteriaAverage(candidate.faceToFaceScores || [], 'verbalCommunication'),
      calculatePhase1CriteriaAverage(candidate.faceToFaceScores || [], 'voiceQuality'),
      candidate.scores?.phase1FfDecision || '',
      candidate.scores?.phase1Decision || ''
    ]
    
    const metierSpecificValues = metierSpecificColumns.map(col => getColumnValue(candidate, col))
    
    // Ajouter les valeurs métier, puis le reste
    return [
      ...baseRow,
      ...metierSpecificValues,
      // Phase 2
      candidate.scores?.phase2FfDecision || '',
      // Appels
      candidate.scores?.callStatus || '',
      // Décision finale et commentaire
      candidate.scores?.finalDecision || '',
      candidate.scores?.comments || ''
    ]
  })
  
  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row: string[]) => row.map(escapeCsvValue).join(','))
  ].join('\n')
  
  const filename = `session_${metier}_${sessionDate}_${session.jour}.csv`
  
  return { csv, filename }
}

// ✅ Export consolidé (CSV)
export function generateConsolidatedExport(sessions: any[]): { csv: string, filename: string } {
  const metiersPresent = Array.from(new Set(
    sessions.flatMap(s => s.candidates.map((c: any) => c.metier))
  )) as Metier[]
  
  // En-têtes réorganisés selon les demandes
  const baseHeaders = [
    'Numéro',
    'Noms et Prénoms',
    'Numéro de Téléphone',
    'Date de naissance',
    'Âge',
    'Diplôme',
    'Établissement fréquenté',
    'Email',
    'Lieu d\'habitation',
    'Date d\'envoi SMS',
    'Disponibilité candidat',
    'Date de présence entretien',
    'Métier Candidat',
    'Session Métier',
    'Date de Session',
    'Jour de Session',
    'Statut de Session',
    'Lieu de Session',
    // Phase 1
    'Présentation Visuelle',
    'Communication Verbale',
    'Qualité Vocale',
    'Décision FF Phase 1',
    'Décision Phase 1'
  ]
  
  const allMetierColumns = new Set<string>()
  metiersPresent.forEach(metier => {
    metierColumns[metier]?.forEach(col => allMetierColumns.add(col))
  })
  
  // Ajouter les colonnes métier après Décision Phase 1, puis le reste
  const headers = [
    ...baseHeaders,
    ...Array.from(allMetierColumns),
    // Phase 2
    'Décision FF Phase 2',
    // Appels
    'Statut Appel',
    // Décision finale et commentaire
    'Décision Finale',
    'Commentaire'
  ]
  
  let candidateNumber = 1
  const rows: string[][] = []
  
  for (const session of sessions) {
    for (const candidate of session.candidates) {
      const candidateMetier = candidate.metier as Metier
      const sessionDate = new Date(session.date).toISOString().split('T')[0]
      
      const baseRow = [
        candidateNumber.toString(),
        candidate.fullName || '',
        candidate.phone || '',
        candidate.birthDate ? new Date(candidate.birthDate).toLocaleDateString('fr-FR') : '',
        candidate.age?.toString() || '',
        candidate.diploma || '',
        candidate.institution || '',
        candidate.email || '',
        candidate.location || '',
        candidate.smsSentDate ? new Date(candidate.smsSentDate).toLocaleDateString('fr-FR') : '',
        candidate.availability || '',
        candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '',
        candidate.metier || '',
        session.metier || '',
        sessionDate,
        session.jour || '',
        session.status || '',
        session.location || '',
        // Phase 1
        calculatePhase1CriteriaAverage(candidate.faceToFaceScores || [], 'presentationVisuelle'),
        calculatePhase1CriteriaAverage(candidate.faceToFaceScores || [], 'verbalCommunication'),
        calculatePhase1CriteriaAverage(candidate.faceToFaceScores || [], 'voiceQuality'),
        candidate.scores?.phase1FfDecision || '',
        candidate.scores?.phase1Decision || ''
      ]
      
      const metierSpecificValues = Array.from(allMetierColumns).map(col => {
        const candidateMetierColumns = metierColumns[candidateMetier] || []
        if (candidateMetierColumns.includes(col)) {
          return getColumnValue(candidate, col)
        }
        return ''
      })
      
      // Ajouter les valeurs métier, puis le reste
      rows.push([
        ...baseRow,
        ...metierSpecificValues,
        // Phase 2
        candidate.scores?.phase2FfDecision || '',
        // Appels
        candidate.scores?.callStatus || '',
        // Décision finale et commentaire
        candidate.scores?.finalDecision || '',
        candidate.scores?.comments || ''
      ])
      candidateNumber++
    }
  }
  
  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row: string[]) => row.map(escapeCsvValue).join(','))
  ].join('\n')
  
  let filename = 'export_consolide'
  if (sessions.length === 1) {
    const session = sessions[0]
    const sessionDate = new Date(session.date).toISOString().split('T')[0]
    filename = `metier_${session.metier}_${sessionDate}_${session.status.toLowerCase()}_consolide`
  } else if (metiersPresent.length === 1) {
    filename = `metier_${metiersPresent[0]}_${new Date().toISOString().split('T')[0]}_consolide`
  } else {
    filename = `export_complet_${new Date().toISOString().split('T')[0]}_consolide`
  }
  
  filename += '.csv'
  
  return { csv, filename }
}

// 🆕 Export XLSX par session
export async function generateSessionExportXLSX(session: any): Promise<{ buffer: ArrayBuffer, filename: string }> {
  const XLSX = await import('xlsx')
  
  const metier = session.metier
  const sessionDate = new Date(session.date).toISOString().split('T')[0]
  
  // En-têtes réorganisés selon les demandes
  const baseHeaders = [
    'Numéro', 'Noms et Prénoms', 'Numéro de Téléphone', 'Date de naissance', 'Âge',
    'Diplôme', 'Établissement fréquenté', 'Email', 'Lieu d\'habitation',
    'Date d\'envoi SMS', 'Disponibilité candidat', 'Date de présence entretien',
    'Métier Candidat', 'Session Métier', 'Date de Session', 'Jour de Session',
    'Statut de Session',
    // Phase 1
    'Présentation Visuelle', 'Communication Verbale', 'Qualité Vocale',
    'Décision FF Phase 1', 'Décision Phase 1'
  ]
  
  const metierSpecificColumns = metierColumns[metier as Metier] || []
  
  // Ajouter les colonnes métier après Décision Phase 1, puis le reste
  const headers = [
    ...baseHeaders,
    ...metierSpecificColumns,
    // Phase 2
    'Décision FF Phase 2',
    // Appels
    'Statut Appel',
    // Décision finale et commentaire
    'Décision Finale', 
    'Commentaire'
  ]
  
  const data = [headers]
  
  session.candidates.forEach((candidate: any, index: number) => {
    const baseRow = [
      index + 1,
      candidate.fullName || '',
      candidate.phone || '',
      candidate.birthDate ? new Date(candidate.birthDate).toLocaleDateString('fr-FR') : '',
      candidate.age || '',
      candidate.diploma || '',
      candidate.institution || '',
      candidate.email || '',
      candidate.location || '',
      candidate.smsSentDate ? new Date(candidate.smsSentDate).toLocaleDateString('fr-FR') : '',
      candidate.availability || '',
      candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '',
      candidate.metier || '',
      session.metier || '',
      sessionDate,
      session.jour || '',
      session.status || '',
      // Phase 1
      calculatePhase1CriteriaAverage(candidate.faceToFaceScores || [], 'presentationVisuelle'),
      calculatePhase1CriteriaAverage(candidate.faceToFaceScores || [], 'verbalCommunication'),
      calculatePhase1CriteriaAverage(candidate.faceToFaceScores || [], 'voiceQuality'),
      candidate.scores?.phase1FfDecision || '',
      candidate.scores?.phase1Decision || ''
    ]
    
    const metierSpecificValues = metierSpecificColumns.map(col => getColumnValue(candidate, col))
    
    // Ajouter les valeurs métier, puis le reste
    data.push([
      ...baseRow,
      ...metierSpecificValues,
      // Phase 2
      candidate.scores?.phase2FfDecision || '',
      // Appels
      candidate.scores?.callStatus || '',
      // Décision finale et commentaire
      candidate.scores?.finalDecision || '',
      candidate.scores?.comments || ''
    ])
  })
  
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // Largeur des colonnes optimisée
  const colWidths = [
    { wch: 8 },  // Numéro
    { wch: 25 }, // Noms et Prénoms
    { wch: 15 }, // Téléphone
    { wch: 15 }, // Date de naissance
    { wch: 8 },  // Âge
    { wch: 20 }, // Diplôme
    { wch: 25 }, // Établissement
    { wch: 25 }, // Email
    { wch: 20 }, // Lieu d'habitation
    { wch: 15 }, // Date SMS
    { wch: 20 }, // Disponibilité
    { wch: 18 }, // Date présence
    { wch: 18 }, // Métier Candidat
    { wch: 18 }, // Session Métier
    { wch: 15 }, // Date Session
    { wch: 12 }, // Jour
    { wch: 15 }, // Statut Session
    // Phase 1
    { wch: 18 }, // Présentation Visuelle
    { wch: 20 }, // Communication Verbale
    { wch: 15 }, // Qualité Vocale
    { wch: 18 }, // Décision FF Phase 1
    { wch: 18 }  // Décision Phase 1
  ]
  
  // Ajouter les largeurs pour les colonnes métier
  metierSpecificColumns.forEach(() => {
    colWidths.push({ wch: 20 })
  })
  
  // Ajouter les largeurs pour le reste
  colWidths.push({ wch: 18 }) // Décision FF Phase 2
  colWidths.push({ wch: 15 }) // Statut Appel
  colWidths.push({ wch: 18 }) // Décision Finale
  colWidths.push({ wch: 40 }) // Commentaire
  
  ws['!cols'] = colWidths
  
  // Figer la première ligne
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Session')
  
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const filename = `session_${metier}_${sessionDate}_${session.jour}.xlsx`
  
  return { buffer, filename }
}

// 🆕 Export XLSX consolidé
export async function generateConsolidatedExportXLSX(sessions: any[]): Promise<{ buffer: ArrayBuffer, filename: string }> {
  const XLSX = await import('xlsx')
  
  const metiersPresent = Array.from(new Set(
    sessions.flatMap(s => s.candidates.map((c: any) => c.metier))
  )) as Metier[]
  
  // En-têtes réorganisés selon les demandes
  const baseHeaders = [
    'Numéro', 'Noms et Prénoms', 'Numéro de Téléphone', 'Date de naissance', 'Âge',
    'Diplôme', 'Établissement fréquenté', 'Email', 'Lieu d\'habitation',
    'Date d\'envoi SMS', 'Disponibilité candidat', 'Date de présence entretien',
    'Métier Candidat', 'Session Métier', 'Date de Session', 'Jour de Session',
    'Statut de Session', 'Lieu de Session',
    // Phase 1
    'Présentation Visuelle', 'Communication Verbale', 'Qualité Vocale',
    'Décision FF Phase 1', 'Décision Phase 1'
  ]
  
  const allMetierColumns = new Set<string>()
  metiersPresent.forEach(metier => {
    metierColumns[metier]?.forEach(col => allMetierColumns.add(col))
  })
  
  // Ajouter les colonnes métier après Décision Phase 1, puis le reste
  const headers = [
    ...baseHeaders,
    ...Array.from(allMetierColumns),
    // Phase 2
    'Décision FF Phase 2',
    // Appels
    'Statut Appel',
    // Décision finale et commentaire
    'Décision Finale',
    'Commentaire'
  ]
  
  const data = [headers]
  
  let candidateNumber = 1
  
  for (const session of sessions) {
    for (const candidate of session.candidates) {
      const candidateMetier = candidate.metier as Metier
      const sessionDate = new Date(session.date).toISOString().split('T')[0]
      
      const baseRow = [
        candidateNumber,
        candidate.fullName || '',
        candidate.phone || '',
        candidate.birthDate ? new Date(candidate.birthDate).toLocaleDateString('fr-FR') : '',
        candidate.age || '',
        candidate.diploma || '',
        candidate.institution || '',
        candidate.email || '',
        candidate.location || '',
        candidate.smsSentDate ? new Date(candidate.smsSentDate).toLocaleDateString('fr-FR') : '',
        candidate.availability || '',
        candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '',
        candidate.metier || '',
        session.metier || '',
        sessionDate,
        session.jour || '',
        session.status || '',
        session.location || '',
        // Phase 1
        calculatePhase1CriteriaAverage(candidate.faceToFaceScores || [], 'presentationVisuelle'),
        calculatePhase1CriteriaAverage(candidate.faceToFaceScores || [], 'verbalCommunication'),
        calculatePhase1CriteriaAverage(candidate.faceToFaceScores || [], 'voiceQuality'),
        candidate.scores?.phase1FfDecision || '',
        candidate.scores?.phase1Decision || ''
      ]
      
      const metierSpecificValues = Array.from(allMetierColumns).map(col => {
        const candidateMetierColumns = metierColumns[candidateMetier] || []
        if (candidateMetierColumns.includes(col)) {
          return getColumnValue(candidate, col)
        }
        return ''
      })
      
      // Ajouter les valeurs métier, puis le reste
      data.push([
        ...baseRow,
        ...metierSpecificValues,
        // Phase 2
        candidate.scores?.phase2FfDecision || '',
        // Appels
        candidate.scores?.callStatus || '',
        // Décision finale et commentaire
        candidate.scores?.finalDecision || '',
        candidate.scores?.comments || ''
      ])
      candidateNumber++
    }
  }
  
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // Largeur des colonnes optimisée
  const colWidths = [
    { wch: 8 },  // Numéro
    { wch: 25 }, // Noms et Prénoms
    { wch: 15 }, // Téléphone
    { wch: 15 }, // Date de naissance
    { wch: 8 },  // Âge
    { wch: 20 }, // Diplôme
    { wch: 25 }, // Établissement
    { wch: 25 }, // Email
    { wch: 20 }, // Lieu d'habitation
    { wch: 15 }, // Date SMS
    { wch: 20 }, // Disponibilité
    { wch: 18 }, // Date présence
    { wch: 18 }, // Métier Candidat
    { wch: 18 }, // Session Métier
    { wch: 15 }, // Date Session
    { wch: 12 }, // Jour
    { wch: 15 }, // Statut Session
    { wch: 18 }, // Lieu de Session
    // Phase 1
    { wch: 18 }, // Présentation Visuelle
    { wch: 20 }, // Communication Verbale
    { wch: 15 }, // Qualité Vocale
    { wch: 18 }, // Décision FF Phase 1
    { wch: 18 }  // Décision Phase 1
  ]
  
  // Ajouter les largeurs pour les colonnes métier
  Array.from(allMetierColumns).forEach(() => {
    colWidths.push({ wch: 20 })
  })
  
  // Ajouter les largeurs pour le reste
  colWidths.push({ wch: 18 }) // Décision FF Phase 2
  colWidths.push({ wch: 15 }) // Statut Appel
  colWidths.push({ wch: 18 }) // Décision Finale
  colWidths.push({ wch: 40 }) // Commentaire
  
  ws['!cols'] = colWidths
  
  // Figer la première ligne
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Consolidé')
  
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  
  let filename = 'export_consolide'
  if (sessions.length === 1) {
    const session = sessions[0]
    const sessionDate = new Date(session.date).toISOString().split('T')[0]
    filename = `metier_${session.metier}_${sessionDate}_${session.status.toLowerCase()}_consolide`
  } else if (metiersPresent.length === 1) {
    filename = `metier_${metiersPresent[0]}_${new Date().toISOString().split('T')[0]}_consolide`
  } else {
    filename = `export_complet_${new Date().toISOString().split('T')[0]}_consolide`
  }
  
  filename += '.xlsx'
  
  return { buffer, filename }
}