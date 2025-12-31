// lib/export-utils.ts
import { Metier } from '@prisma/client'

// Configuration des colonnes techniques par métier
const metierTechnicalColumns: Record<Metier, string[]> = {
  [Metier.CALL_CENTER]: ['Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Test Excel (/5)', 'Dictée (/20)'],
  [Metier.AGENCES]: ['Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Dictée (/20)', 'Sens Négociation (/5)', 'Capacité Persuasion (/5)', 'Sens Combativité (/5)'],
  [Metier.BO_RECLAM]: ['Raisonnement Logique (/5)', 'Attention Concentration (/5)', 'Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Test Excel (/5)', 'Dictée (/20)'],
  [Metier.TELEVENTE]: ['Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Dictée (/20)', 'Sens Négociation (/5)', 'Capacité Persuasion (/5)', 'Sens Combativité (/5)'],
  [Metier.RESEAUX_SOCIAUX]: ['Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Dictée (/20)'],
  [Metier.SUPERVISION]: ['Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Test Excel (/5)', 'Dictée (/20)'],
  [Metier.BOT_COGNITIVE_TRAINER]: ['Test Excel (/5)', 'Dictée (/20)', 'Capacité d\'Analyse (/10)'],
  [Metier.SMC_FIXE]: ['Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Test Excel (/5)', 'Dictée (/20)'],
  [Metier.SMC_MOBILE]: ['Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Test Excel (/5)', 'Dictée (/20)']
}

function getTechnicalColumnValue(candidate: any, columnName: string): string {
  const scores = candidate.scores
  if (!scores) return ''
  
  const mapping: Record<string, any> = {
    'Raisonnement Logique (/5)': scores.psychoRaisonnementLogique,
    'Attention Concentration (/5)': scores.psychoAttentionConcentration,
    'Rapidité de Saisie (MPM)': scores.typingSpeed,
    'Précision de Saisie (%)': scores.typingAccuracy,
    'Test Excel (/5)': scores.excelTest,
    'Dictée (/20)': scores.dictation,
    'Capacité d\'Analyse (/5)': scores.analysisExercise,
    'Sens Négociation (/5)': scores.simulationSensNegociation,
    'Capacité Persuasion (/5)': scores.simulationCapacitePersuasion,
    'Sens Combativité (/5)': scores.simulationSensCombativite,
  }
  
  return mapping[columnName]?.toString() || ''
}

function calculatePhase1Average(faceToFaceScores: any[], criteria: 'presentationVisuelle' | 'verbalCommunication' | 'voiceQuality'): string {
  const phase1Scores = faceToFaceScores.filter(s => s.phase === 1)
  if (phase1Scores.length === 0) return ''
  
  const validScores = phase1Scores.filter(s => s[criteria] !== null && s[criteria] !== undefined)
  if (validScores.length === 0) return ''
  
  const avg = validScores.reduce((sum, score) => sum + (Number(score[criteria]) || 0), 0) / validScores.length
  return avg.toFixed(2)
}

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// Fonction pour obtenir le nom du créateur de session
function getSessionCreatorName(session: any): string {
  return session.createdBy?.name || 'Non renseigné'
}

// ✅ Export par session (CSV) avec créateur et disponibilité
export function generateSessionExport(session: any): { csv: string, filename: string } {
  const metier = session.metier
  const sessionDate = new Date(session.date).toISOString().split('T')[0]
  const creatorName = getSessionCreatorName(session) 
  
  const exportableCandidates = session.candidates
  
  console.log(`📊 Export session ${metier} par ${creatorName}: ${exportableCandidates.length} candidats`)
  
  // En-têtes avec créateur de session et disponibilité
  const baseHeaders = [
    'N°', 'Nom', 'Prénom', 'Email', 'Téléphone', 'Âge',
    'Diplôme', 'Niveau d\'études', 'Université', 'Lieu d\'habitation', 'Date d\'entretien',
  ]
  // Ajout colonnes: Métier, Créé par, Disponibilité
  const sessionInfoHeaders = ['Métier de Session', 'Créé par', 'Disponibilité'] 
  
  const faceToFaceHeaders = [
    'Présentation Visuelle (moyenne)', 'Communication Verbale (moyenne)', 'Qualité Vocale (moyenne)',
    'Décision Face-à-Face',
  ]
  
  const technicalHeaders = metierTechnicalColumns[metier as Metier] || []
  const decisionHeaders = ['Décision Test', 'Décision Finale']
  const commentHeaders = ['Commentaires Généraux']
  
  const headers = [
    ...baseHeaders,
    ...sessionInfoHeaders,
    ...faceToFaceHeaders,
    ...technicalHeaders,
    ...decisionHeaders,
    ...commentHeaders
  ]
  
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
    
    const sessionInfo = [
      session.metier || '', 
      creatorName,
      candidate.availability || '' // Ajout disponibilité
    ]
    
    const faceToFaceRow = [
      calculatePhase1Average(candidate.faceToFaceScores || [], 'presentationVisuelle'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'verbalCommunication'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'voiceQuality'),
      candidate.scores?.phase1FfDecision || '',
    ]
    
    const technicalRow = technicalHeaders.map(col => getTechnicalColumnValue(candidate, col))
    const decisionRow = [candidate.scores?.decisionTest || '', candidate.scores?.finalDecision || '']
    const commentRow = [candidate.scores?.comments || '']
    
    return [...baseRow, ...sessionInfo, ...faceToFaceRow, ...technicalRow, ...decisionRow, ...commentRow]
  })
  
  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row: string[]) => row.map(escapeCsvValue).join(','))
  ].join('\n')
  
  const filename = `export_${metier}_${sessionDate}_par_${creatorName.replace(/\s+/g, '_')}.csv`
  
  return { csv, filename }
}

// ✅ Export consolidé (CSV) avec créateur et disponibilité
export function generateConsolidatedExport(sessions: any[]): { csv: string, filename: string } {
  const allExportableCandidates = sessions.flatMap(s => 
    s.candidates.map((c: any) => ({ ...c, session: s }))
  )
  
  console.log(`📊 Export consolidé: ${allExportableCandidates.length} candidats`)
  
  const metiersPresent = Array.from(new Set(
    allExportableCandidates.map((c: any) => c.metier)
  )) as Metier[]
  
  const allTechnicalColumns = new Set<string>()
  metiersPresent.forEach(metier => {
    metierTechnicalColumns[metier]?.forEach(col => allTechnicalColumns.add(col))
  })
  
  const baseHeaders = [
    'N°', 'Nom', 'Prénom', 'Email', 'Téléphone', 'Âge',
    'Diplôme', 'Niveau d\'études', 'Université', 'Lieu d\'habitation', 'Date d\'entretien',
  ]
  
  const sessionInfoHeaders = ['Métier', 'Créé par', 'Disponibilité'] // Ajout disponibilité
  
  const faceToFaceHeaders = [
    'Présentation Visuelle (moyenne)', 'Communication Verbale (moyenne)', 'Qualité Vocale (moyenne)',
    'Décision Face-à-Face',
  ]
  
  const decisionHeaders = ['Décision Test', 'Décision Finale']
  const commentHeaders = ['Commentaires Généraux']
  
  const headers = [
    ...baseHeaders,
    ...sessionInfoHeaders,
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
    const creatorName = getSessionCreatorName(session) 
    
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
    
    const sessionInfo = [
      session.metier || '', 
      creatorName,
      candidate.availability || '' // Ajout disponibilité
    ]
    
    const faceToFaceRow = [
      calculatePhase1Average(candidate.faceToFaceScores || [], 'presentationVisuelle'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'verbalCommunication'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'voiceQuality'),
      candidate.scores?.phase1FfDecision || '',
    ]
    
    const technicalRow = Array.from(allTechnicalColumns).map(col => {
      const candidateMetierColumns = metierTechnicalColumns[candidateMetier] || []
      return candidateMetierColumns.includes(col) ? getTechnicalColumnValue(candidate, col) : ''
    })
    
    const decisionRow = [candidate.scores?.decisionTest || '', candidate.scores?.finalDecision || '']
    const commentRow = [candidate.scores?.comments || '']
    
    rows.push([...baseRow, ...sessionInfo, ...faceToFaceRow, ...technicalRow, ...decisionRow, ...commentRow])
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
    const creatorName = getSessionCreatorName(session)
    filename = `export_${session.metier}_${sessionDate}_par_${creatorName.replace(/\s+/g, '_')}`
  } else if (metiersPresent.length === 1) {
    filename = `export_${metiersPresent[0]}_${new Date().toISOString().split('T')[0]}`
  } else {
    filename = `export_tous_metiers_${new Date().toISOString().split('T')[0]}`
  }
  
  filename += '.csv'
  
  return { csv, filename }
}

// ✅ Export XLSX par session avec créateur et disponibilité
export async function generateSessionExportXLSX(session: any): Promise<{ buffer: ArrayBuffer, filename: string }> {
  const XLSX = await import('xlsx')
  
  const metier = session.metier
  const sessionDate = new Date(session.date).toISOString().split('T')[0]
  const creatorName = getSessionCreatorName(session) 
  
  const exportableCandidates = session.candidates
  
  console.log(`📊 Export XLSX session ${metier} par ${creatorName}: ${exportableCandidates.length} candidats`)
  
  const baseHeaders = [
    'N°', 'Nom', 'Prénoms', 'Email', 'Téléphone', 'Âge',
    'Diplôme', 'Niveau d\'études', 'Université', 'Lieu d\'habitation', 'Date d\'entretien',
  ]
  
  const sessionInfoHeaders = ['Métier', 'Créé par', 'Disponibilité'] // Ajout disponibilité
  
  const faceToFaceHeaders = [
    'Présentation Visuelle (moyenne)', 'Communication Verbale (moyenne)', 'Qualité Vocale (moyenne)',
    'Décision Face-à-Face',
  ]
  
  const technicalHeaders = metierTechnicalColumns[metier as Metier] || []
  const decisionHeaders = ['Décision Test', 'Décision Finale']
  const commentHeaders = ['Commentaires Généraux']
  
  const headers = [
    ...baseHeaders,
    ...sessionInfoHeaders,
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
    
    const sessionInfo = [
      session.metier || '', 
      creatorName,
      candidate.availability || '' // Ajout disponibilité
    ]
    
    const faceToFaceRow = [
      calculatePhase1Average(candidate.faceToFaceScores || [], 'presentationVisuelle'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'verbalCommunication'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'voiceQuality'),
      candidate.scores?.phase1FfDecision || '',
    ]
    
    const technicalRow = technicalHeaders.map(col => getTechnicalColumnValue(candidate, col))
    const decisionRow = [candidate.scores?.decisionTest || '', candidate.scores?.finalDecision || '']
    const commentRow = [candidate.scores?.comments || '']
    
    data.push([...baseRow, ...sessionInfo, ...faceToFaceRow, ...technicalRow, ...decisionRow, ...commentRow])
  })
  
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  const colWidths = [
    { wch: 5 }, { wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 6 },
    { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
    { wch: 18 }, { wch: 20 }, { wch: 15 }, // Métier + Créé par + Disponibilité
    { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 18 }
  ]
  
  technicalHeaders.forEach(() => colWidths.push({ wch: 18 }))
  colWidths.push({ wch: 15 }, { wch: 18 }, { wch: 40 })
  
  ws['!cols'] = colWidths
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Candidats')
  
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const filename = `export_${metier}_${sessionDate}_par_${creatorName.replace(/\s+/g, '_')}.xlsx`
  
  return { buffer, filename }
}

// ✅ Export XLSX consolidé avec créateur et disponibilité
export async function generateConsolidatedExportXLSX(sessions: any[]): Promise<{ buffer: ArrayBuffer, filename: string }> {
  const XLSX = await import('xlsx')
  
  const allExportableCandidates = sessions.flatMap(s => 
    s.candidates.map((c: any) => ({ ...c, session: s }))
  )
  
  console.log(`📊 Export XLSX consolidé: ${allExportableCandidates.length} candidats`)
  
  const metiersPresent = Array.from(new Set(
    allExportableCandidates.map((c: any) => c.metier)
  )) as Metier[]
  
  const allTechnicalColumns = new Set<string>()
  metiersPresent.forEach(metier => {
    metierTechnicalColumns[metier]?.forEach(col => allTechnicalColumns.add(col))
  })
  
  const baseHeaders = [
    'N°', 'Nom', 'Prénoms', 'Email', 'Téléphone', 'Âge',
    'Diplôme', 'Niveau d\'études', 'Université', 'Lieu d\'habitation', 'Date d\'entretien',
  ]
  
  const sessionInfoHeaders = ['Métier', 'Créé par', 'Disponibilité'] // Ajout disponibilité
  
  const faceToFaceHeaders = [
    'Présentation Visuelle (moyenne)', 'Communication Verbale (moyenne)', 'Qualité Vocale (moyenne)',
    'Décision Face-à-Face',
  ]
  
  const decisionHeaders = ['Décision Test', 'Décision Finale']
  const commentHeaders = ['Commentaires Généraux']
  
  const headers = [
    ...baseHeaders,
    ...sessionInfoHeaders,
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
    const creatorName = getSessionCreatorName(session) 
    
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
    
    const sessionInfo = [
      session.metier || '', 
      creatorName,
      candidate.availability || '' // Ajout disponibilité
    ]
    
    const faceToFaceRow = [
      calculatePhase1Average(candidate.faceToFaceScores || [], 'presentationVisuelle'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'verbalCommunication'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'voiceQuality'),
      candidate.scores?.phase1FfDecision || '',
    ]
    
    const technicalRow = Array.from(allTechnicalColumns).map(col => {
      const candidateMetierColumns = metierTechnicalColumns[candidateMetier] || []
      return candidateMetierColumns.includes(col) ? getTechnicalColumnValue(candidate, col) : ''
    })
    
    const decisionRow = [candidate.scores?.decisionTest || '', candidate.scores?.finalDecision || '']
    const commentRow = [candidate.scores?.comments || '']
    
    data.push([...baseRow, ...sessionInfo, ...faceToFaceRow, ...technicalRow, ...decisionRow, ...commentRow])
    candidateNumber++
  }
  
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  const colWidths = [
    { wch: 5 }, { wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 6 },
    { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
    { wch: 18 }, { wch: 20 }, { wch: 15 }, // Métier + Créé par + Disponibilité
    { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 18 }
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
    const creatorName = getSessionCreatorName(session)
    filename = `export_${session.metier}_${sessionDate}_par_${creatorName.replace(/\s+/g, '_')}`
  } else if (metiersPresent.length === 1) {
    filename = `export_${metiersPresent[0]}_${new Date().toISOString().split('T')[0]}`
  } else {
    filename = `export_tous_metiers_${new Date().toISOString().split('T')[0]}`
  }
  
  filename += '.xlsx'
  
  return { buffer, filename }
}