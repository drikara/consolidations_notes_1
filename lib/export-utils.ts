import { Metier } from '@prisma/client'

// ✅ Définir les colonnes de tests techniques spécifiques à chaque métier
const metierTechnicalColumns: Record<Metier, string[]> = {
  [Metier.CALL_CENTER]: [
    'Rapidité de Saisie (MPM)',
    'Précision de Saisie (%)',
    'Test Excel (/5)',
    'Dictée (/20)',
  ],
  [Metier.AGENCES]: [
    'Rapidité de Saisie (MPM)',
    'Précision de Saisie (%)',
    'Dictée (/20)',
    'Sens Négociation (/5)',
    'Capacité Persuasion (/5)',
    'Sens Combativité (/5)',
  ],
  [Metier.BO_RECLAM]: [
    'Raisonnement Logique (/5)',
    'Attention Concentration (/5)',
    'Rapidité de Saisie (MPM)',
    'Précision de Saisie (%)',
    'Test Excel (/5)',
    'Dictée (/20)',
  ],
  [Metier.TELEVENTE]: [
    'Rapidité de Saisie (MPM)',
    'Précision de Saisie (%)',
    'Dictée (/20)',
    'Sens Négociation (/5)',
    'Capacité Persuasion (/5)',
    'Sens Combativité (/5)',
  ],
  [Metier.RESEAUX_SOCIAUX]: [
    'Rapidité de Saisie (MPM)',
    'Précision de Saisie (%)',
    'Dictée (/20)',
  ],
  [Metier.SUPERVISION]: [
    'Rapidité de Saisie (MPM)',
    'Précision de Saisie (%)',
    'Test Excel (/5)',
    'Dictée (/20)',
  ],
  [Metier.BOT_COGNITIVE_TRAINER]: [
    'Test Excel (/5)',
    'Dictée (/20)',
    'Capacité d\'Analyse (/10)',
  ],
  [Metier.SMC_FIXE]: [
    'Rapidité de Saisie (MPM)',
    'Précision de Saisie (%)',
    'Test Excel (/5)',
    'Dictée (/20)',
  ],
  [Metier.SMC_MOBILE]: [
    'Rapidité de Saisie (MPM)',
    'Précision de Saisie (%)',
    'Test Excel (/5)',
    'Dictée (/20)',
  ]
}

// ✅ Fonction pour obtenir la valeur d'une colonne technique selon le métier
function getTechnicalColumnValue(candidate: any, columnName: string): string {
  const scores = candidate.scores
  
  switch (columnName) {
    // Tests psychotechniques
    case 'Raisonnement Logique (/5)':
      return scores?.psychoRaisonnementLogique?.toString() || ''
    case 'Attention Concentration (/5)':
      return scores?.psychoAttentionConcentration?.toString() || ''
    
    // Tests de saisie
    case 'Rapidité de Saisie (MPM)':
      return scores?.typingSpeed?.toString() || ''
    case 'Précision de Saisie (%)':
      return scores?.typingAccuracy?.toString() || ''
    
    // Tests techniques
    case 'Test Excel (/5)':
      return scores?.excelTest?.toString() || ''
    case 'Dictée (/20)':
      return scores?.dictation?.toString() || ''
    case 'Capacité d\'Analyse (/5)':
      return scores?.analysisExercise?.toString() || ''
    
    // Simulation (AGENCES et TELEVENTE)
    case 'Sens Négociation (/5)':
      return scores?.simulationSensNegociation?.toString() || ''
    case 'Capacité Persuasion (/5)':
      return scores?.simulationCapacitePersuasion?.toString() || ''
    case 'Sens Combativité (/5)':
      return scores?.simulationSensCombativite?.toString() || ''
    
    default:
      return ''
  }
}

// ✅ Fonction pour calculer la moyenne d'un critère Phase 1 (Face-à-Face)
function calculatePhase1Average(faceToFaceScores: any[], criteria: 'presentationVisuelle' | 'verbalCommunication' | 'voiceQuality'): string {
  const phase1Scores = faceToFaceScores.filter(s => s.phase === 1)
  
  if (phase1Scores.length === 0) return ''
  
  const validScores = phase1Scores.filter(s => s[criteria] !== null && s[criteria] !== undefined)
  if (validScores.length === 0) return ''
  
  const avg = validScores.reduce((sum, score) => {
    return sum + (Number(score[criteria]) || 0)
  }, 0) / validScores.length
  
  return avg.toFixed(2)
}

// ✅ Fonction utilitaire pour échapper les valeurs CSV
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// ✅ Export par session (CSV) - TOUS les candidats (incluant disponibilité NON)
export function generateSessionExport(session: any): { csv: string, filename: string } {
  const metier = session.metier
  const sessionDate = new Date(session.date).toISOString().split('T')[0]
  
  // 🎯 TOUS LES CANDIDATS - Aucun filtrage
  const exportableCandidates = session.candidates
  
  console.log(`📊 Export session ${metier}: ${exportableCandidates.length} candidats (tous inclus)`)
  
  // En-têtes de base
  const baseHeaders = [
    'N°',
    'Nom',
    'Prénom',
    'Email',
    'Téléphone',
    'Âge',
    'Diplôme',
    'Niveau d\'études',
    'Université',
    'Lieu d\'habitation',
    'Date d\'entretien',
    
  ]
  
  // En-têtes Face-à-Face (Phase 1) avec décision juste après
  const faceToFaceHeaders = [
    'Présentation Visuelle (moyenne)',
    'Communication Verbale (moyenne)',
    'Qualité Vocale (moyenne)',
    'Décision Face-à-Face',
  ]
  
  // En-têtes Tests Techniques (spécifiques au métier)
  const technicalHeaders = metierTechnicalColumns[metier as Metier] || []
  
  // En-têtes Décisions finales
  const decisionHeaders = [
    'Décision Test',
    'Décision Finale',
  ]
  
  // En-têtes Commentaires
  const commentHeaders = ['Commentaires Généraux']
  
  // Assembler tous les en-têtes
  const headers = [
    ...baseHeaders,
    'Métier de Session',
    ...faceToFaceHeaders,
    ...technicalHeaders,
    ...decisionHeaders,
    ...commentHeaders
  ]
  
  // Générer les lignes
  const rows = exportableCandidates.map((candidate: any, index: number) => {
    const baseRow = [
      (index + 1).toString(),
      candidate.nom || '',
      candidate.prenom || '',
      candidate.email || '',
      candidate.phone || '',
      candidate.age?.toString() || '',
      candidate.diploma || '',
      candidate.niveauEtudes || '',
      candidate.institution || '',
      candidate.location || '',
      candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '',
    
    ]
    
    const sessionInfo = [session.metier || '']
    
    const faceToFaceRow = [
      calculatePhase1Average(candidate.faceToFaceScores || [], 'presentationVisuelle'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'verbalCommunication'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'voiceQuality'),
      candidate.scores?.phase1FfDecision || '',
    ]
    
    const technicalRow = technicalHeaders.map(col => getTechnicalColumnValue(candidate, col))
    
    const decisionRow = [
      candidate.scores?.decisionTest || '',
      candidate.scores?.finalDecision || '',
    ]
    
    const commentRow = [candidate.scores?.comments || '']
    
    return [
      ...baseRow,
      ...sessionInfo,
      ...faceToFaceRow,
      ...technicalRow,
      ...decisionRow,
      ...commentRow
    ]
  })
  
  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row: string[]) => row.map(escapeCsvValue).join(','))
  ].join('\n')
  
  const filename = `export_${metier}_${sessionDate}.csv`
  
  return { csv, filename }
}

// ✅ Export consolidé (CSV) - TOUS les candidats (incluant disponibilité NON)
export function generateConsolidatedExport(sessions: any[]): { csv: string, filename: string } {
  // 🎯 TOUS LES CANDIDATS de toutes les sessions - Aucun filtrage
  const allExportableCandidates = sessions.flatMap(s => 
    s.candidates.map((c: any) => ({ ...c, session: s }))
  )
  
  console.log(`📊 Export consolidé: ${allExportableCandidates.length} candidats (tous inclus)`)
  
  const metiersPresent = Array.from(new Set(
    allExportableCandidates.map((c: any) => c.metier)
  )) as Metier[]
  
  // Collecter toutes les colonnes techniques de tous les métiers présents
  const allTechnicalColumns = new Set<string>()
  metiersPresent.forEach(metier => {
    metierTechnicalColumns[metier]?.forEach(col => allTechnicalColumns.add(col))
  })
  
  // En-têtes de base
  const baseHeaders = [
    'N°',
    'Nom',
    'Prénom',
    'Email',
    'Téléphone',
    'Âge',
    'Diplôme',
    'Niveau d\'études',
    'Université',
    'Lieu d\'habitation',
    'Date d\'entretien',
    
  ]
  
  // En-têtes Face-à-Face avec décision juste après
  const faceToFaceHeaders = [
    'Présentation Visuelle (moyenne)',
    'Communication Verbale (moyenne)',
    'Qualité Vocale (moyenne)',
    'Décision Face-à-Face',
  ]
  
  // En-têtes Décisions finales
  const decisionHeaders = [
    'Décision Test',
    'Décision Finale',
  ]
  
  // En-têtes Commentaires
  const commentHeaders = ['Commentaires Généraux']
  
  // Assembler tous les en-têtes
  const headers = [
    ...baseHeaders,
    'Métier',
    ...faceToFaceHeaders,
    ...Array.from(allTechnicalColumns),
    ...decisionHeaders,
    ...commentHeaders
  ]
  
  let candidateNumber = 1
  const rows: string[][] = []
  
  for (const candidateWithSession of allExportableCandidates) {
    const candidate = candidateWithSession
    const session = candidateWithSession.session
    const candidateMetier = candidate.metier as Metier
    
    const baseRow = [
      candidateNumber.toString(),
      candidate.nom || '',
      candidate.prenom || '',
      candidate.email || '',
      candidate.phone || '',
      candidate.age?.toString() || '',
      candidate.diploma || '',
      candidate.niveauEtudes || '',
      candidate.institution || '',
      candidate.location || '',
      candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '',
     
    ]
    
    const sessionInfo = [session.metier || '']
    
    const faceToFaceRow = [
      calculatePhase1Average(candidate.faceToFaceScores || [], 'presentationVisuelle'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'verbalCommunication'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'voiceQuality'),
      candidate.scores?.phase1FfDecision || '',
    ]
    
    // Pour chaque colonne technique globale, vérifier si elle existe pour ce métier
    const technicalRow = Array.from(allTechnicalColumns).map(col => {
      const candidateMetierColumns = metierTechnicalColumns[candidateMetier] || []
      if (candidateMetierColumns.includes(col)) {
        return getTechnicalColumnValue(candidate, col)
      }
      return '' // Colonne non applicable pour ce métier
    })
    
    const decisionRow = [
      candidate.scores?.decisionTest || '',
      candidate.scores?.finalDecision || '',
    ]
    
    const commentRow = [candidate.scores?.comments || '']
    
    rows.push([
      ...baseRow,
      ...sessionInfo,
      ...faceToFaceRow,
      ...technicalRow,
      ...decisionRow,
      ...commentRow
    ])
    candidateNumber++
  }
  
  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row: string[]) => row.map(escapeCsvValue).join(','))
  ].join('\n')
  
  let filename = 'export_consolide'
  if (sessions.length === 1) {
    const session = sessions[0]
    const sessionDate = new Date(session.date).toISOString().split('T')[0]
    filename = `export_${session.metier}_${sessionDate}`
  } else if (metiersPresent.length === 1) {
    filename = `export_${metiersPresent[0]}_${new Date().toISOString().split('T')[0]}`
  } else {
    filename = `export_tous_metiers_${new Date().toISOString().split('T')[0]}`
  }
  
  filename += '.csv'
  
  return { csv, filename }
}

// 🆕 Export XLSX par session - TOUS les candidats (incluant disponibilité NON)
export async function generateSessionExportXLSX(session: any): Promise<{ buffer: ArrayBuffer, filename: string }> {
  const XLSX = await import('xlsx')
  
  const metier = session.metier
  const sessionDate = new Date(session.date).toISOString().split('T')[0]
  
  // 🎯 TOUS LES CANDIDATS - Aucun filtrage
  const exportableCandidates = session.candidates
  
  console.log(`📊 Export XLSX session ${metier}: ${exportableCandidates.length} candidats (tous inclus)`)
  
  // En-têtes
  const baseHeaders = [
    'N°', 'Nom', 'Prénoms', 'Email', 'Téléphone', 'Âge',
    'Diplôme', 'Niveau d\'études', 'Université', 'Lieu d\'habitation', 'Date d\'entretien',
  ]
  
  const faceToFaceHeaders = [
    'Présentation Visuelle (moyenne)', 'Communication Verbale (moyenne)', 'Qualité Vocale (moyenne)',
    'Décision Face-à-Face',
  ]
  
  const technicalHeaders = metierTechnicalColumns[metier as Metier] || []
  
  const decisionHeaders = ['Décision Test', 'Décision Finale']
  const commentHeaders = ['Commentaires Généraux']
  
  const headers = [
    ...baseHeaders,
    'Métier',
    ...faceToFaceHeaders,
    ...technicalHeaders,
    ...decisionHeaders,
    ...commentHeaders
  ]
  
  const data = [headers]
  
  exportableCandidates.forEach((candidate: any, index: number) => {
    const baseRow = [
      index + 1,
      candidate.nom || '',
      candidate.prenom || '',
      candidate.email || '',
      candidate.phone || '',
      candidate.age || '',
      candidate.diploma || '',
      candidate.niveauEtudes || '',
      candidate.institution || '',
      candidate.location || '',
      candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '',
      
    ]
    
    const sessionInfo = [session.metier || '']
    
    const faceToFaceRow = [
      calculatePhase1Average(candidate.faceToFaceScores || [], 'presentationVisuelle'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'verbalCommunication'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'voiceQuality'),
      candidate.scores?.phase1FfDecision || '',
    ]
    
    const technicalRow = technicalHeaders.map(col => getTechnicalColumnValue(candidate, col))
    
    const decisionRow = [
      candidate.scores?.decisionTest || '',
      candidate.scores?.finalDecision || '',
    ]
    
    const commentRow = [candidate.scores?.comments || '']
    
    data.push([
      ...baseRow,
      ...sessionInfo,
      ...faceToFaceRow,
      ...technicalRow,
      ...decisionRow,
      ...commentRow
    ])
  })
  
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // Largeur des colonnes
  const colWidths = [
    { wch: 5 },  // N°
    { wch: 18 }, // Nom
    { wch: 18 }, // Prénom
    { wch: 25 }, // Email
    { wch: 15 }, // Téléphone
    { wch: 6 },  // Âge
    { wch: 20 }, // Diplôme
    { wch: 15 }, // Niveau
    { wch: 25 }, // Institution
    { wch: 20 }, // Localisation
    { wch: 15 }, // Date entretien
    { wch: 18 }, // Métier Session
    { wch: 18 }, // Présentation
    { wch: 20 }, // Communication
    { wch: 15 }, // Qualité Vocale
    { wch: 18 }, // Décision FF
  ]
  
  // Ajouter largeurs pour colonnes techniques
  technicalHeaders.forEach(() => colWidths.push({ wch: 18 }))
  
  // Largeurs décisions et commentaires
  colWidths.push({ wch: 15 }) // Décision Test
  colWidths.push({ wch: 18 }) // Décision Finale
  colWidths.push({ wch: 40 }) // Commentaires
  
  ws['!cols'] = colWidths
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Candidats')
  
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const filename = `export_${metier}_${sessionDate}.xlsx`
  
  return { buffer, filename }
}

// 🆕 Export XLSX consolidé - TOUS les candidats (incluant disponibilité NON)
export async function generateConsolidatedExportXLSX(sessions: any[]): Promise<{ buffer: ArrayBuffer, filename: string }> {
  const XLSX = await import('xlsx')
  
  // 🎯 TOUS LES CANDIDATS - Aucun filtrage
  const allExportableCandidates = sessions.flatMap(s => 
    s.candidates.map((c: any) => ({ ...c, session: s }))
  )
  
  console.log(`📊 Export XLSX consolidé: ${allExportableCandidates.length} candidats (tous inclus)`)
  
  const metiersPresent = Array.from(new Set(
    allExportableCandidates.map((c: any) => c.metier)
  )) as Metier[]
  
  const allTechnicalColumns = new Set<string>()
  metiersPresent.forEach(metier => {
    metierTechnicalColumns[metier]?.forEach(col => allTechnicalColumns.add(col))
  })
  
  // En-têtes
  const baseHeaders = [
    'N°', 'Nom', 'Prénoms', 'Email', 'Téléphone', 'Âge',
    'Diplôme', 'Niveau d\'études', 'Université', 'Lieu d\'habitation', 'Date d\'entretien', 
  ]
  
  const faceToFaceHeaders = [
    'Présentation Visuelle (moyenne)', 'Communication Verbale (moyenne)', 'Qualité Vocale (moyenne)',
    'Décision Face-à-Face',
  ]
  
  const decisionHeaders = ['Décision Test', 'Décision Finale']
  const commentHeaders = ['Commentaires Généraux']
  
  const headers = [
    ...baseHeaders,
    'Métier',
    ...faceToFaceHeaders,
    ...Array.from(allTechnicalColumns),
    ...decisionHeaders,
    ...commentHeaders
  ]
  
  const data = [headers]
  
  let candidateNumber = 1
  
  for (const candidateWithSession of allExportableCandidates) {
    const candidate = candidateWithSession
    const session = candidateWithSession.session
    const candidateMetier = candidate.metier as Metier
    
    const baseRow = [
      candidateNumber,
      candidate.nom || '',
      candidate.prenom || '',
      candidate.email || '',
      candidate.phone || '',
      candidate.age || '',
      candidate.diploma || '',
      candidate.niveauEtudes || '',
      candidate.institution || '',
      candidate.location || '',
      candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '',
    
    ]
    
    const sessionInfo = [session.metier || '']
    
    const faceToFaceRow = [
      calculatePhase1Average(candidate.faceToFaceScores || [], 'presentationVisuelle'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'verbalCommunication'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'voiceQuality'),
      candidate.scores?.phase1FfDecision || '',
    ]
    
    const technicalRow = Array.from(allTechnicalColumns).map(col => {
      const candidateMetierColumns = metierTechnicalColumns[candidateMetier] || []
      if (candidateMetierColumns.includes(col)) {
        return getTechnicalColumnValue(candidate, col)
      }
      return ''
    })
    
    const decisionRow = [
      candidate.scores?.decisionTest || '',
      candidate.scores?.finalDecision || '',
    ]
    
    const commentRow = [candidate.scores?.comments || '']
    
    data.push([
      ...baseRow,
      ...sessionInfo,
      ...faceToFaceRow,
      ...technicalRow,
      ...decisionRow,
      ...commentRow
    ])
    candidateNumber++
  }
  
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // Largeur des colonnes
  const colWidths = [
    { wch: 5 }, { wch: 18 }, { wch: 18 }, { wch: 25 },
    { wch: 15 }, { wch: 6 }, { wch: 20 }, { wch: 15 }, { wch: 25 },
    { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 18 }
  ]
  
  Array.from(allTechnicalColumns).forEach(() => colWidths.push({ wch: 18 }))
  colWidths.push({ wch: 15 }, { wch: 18 }, { wch: 40 })
  
  ws['!cols'] = colWidths
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Tous les Candidats')
  
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  
  let filename = 'export_consolide'
  if (sessions.length === 1) {
    const session = sessions[0]
    const sessionDate = new Date(session.date).toISOString().split('T')[0]
    filename = `export_${session.metier}_${sessionDate}`
  } else if (metiersPresent.length === 1) {
    filename = `export_${metiersPresent[0]}_${new Date().toISOString().split('T')[0]}`
  } else {
    filename = `export_tous_metiers_${new Date().toISOString().split('T')[0]}`
  }
  
  filename += '.xlsx'
  
  return { buffer, filename }
}