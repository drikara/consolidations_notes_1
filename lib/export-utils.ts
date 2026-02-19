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
  [Metier.SMC_MOBILE]: ['Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Test Excel (/5)', 'Dictée (/20)'],
  [Metier.RECOUVREMENT]:["Rapidité de saisie (MPM)", "Précision de saisie (%)", "Test Excel (/5)", "Dictée (/20)"],
}

// Mapping des colonnes techniques vers les champs du score
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
    'Capacité d\'Analyse (/10)': scores.analysisExercise,
    'Sens Négociation (/5)': scores.simulationSensNegociation,
    'Capacité Persuasion (/5)': scores.simulationCapacitePersuasion,
    'Sens Combativité (/5)': scores.simulationSensCombativite,
  }
  
  const value = mapping[columnName]
  // ✅ Retourner '0' si la valeur est 0, sinon convertir en string ou retourner ''
  return value !== null && value !== undefined ? value.toString() : ''
}

// Calcul des moyennes pour les critères du face-à-face (phase 1)
function calculatePhase1Average(faceToFaceScores: any[], criteria: 'presentationVisuelle' | 'verbalCommunication' | 'voiceQuality' | 'appetenceDigitale'): string {
  const phase1Scores = faceToFaceScores.filter(s => s.phase === 1)
  if (phase1Scores.length === 0) return ''
  
  const validScores = phase1Scores.filter(s => s[criteria] !== null && s[criteria] !== undefined)
  if (validScores.length === 0) return ''
  
  const avg = validScores.reduce((sum, score) => sum + (Number(score[criteria]) || 0), 0) / validScores.length
  return avg.toFixed(2)
}

// Échappement CSV
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// Utilitaires pour les informations de session/candidat
function getSessionCreatorName(session: any): string {
  return session.createdBy?.name || 'Non renseigné'
}

function getSessionWave(session: any): string {
  return session.description || ''
}

function getEvaluatorName(scores: any): string {
  return scores?.evaluatedBy || ''
}

function getPresenceStatus(scores: any): string {
  if (!scores || !scores.statut) return ''
  return scores.statut === 'PRESENT' ? 'Présent' : 'Absent'
}

// ----------------------------------------------------------------------
// EXPORT SESSION (CSV)
// ----------------------------------------------------------------------
export function generateSessionExport(session: any): { csv: string; filename: string } {
  const metier = session.metier
  const sessionDate = new Date(session.date).toISOString().split('T')[0]
  const creatorName = getSessionCreatorName(session)
  const waveInfo = getSessionWave(session)
  const agenceType = session.agenceType || ''
  
  const exportableCandidates = session.candidates || []
  
  console.log(`Export CSV session ${metier} par ${creatorName}: ${exportableCandidates.length} candidats`)
  
  // ----- En-têtes (NOUVELLE ORGANISATION) -----
  const baseHeaders = [
    'N°',
    'Vague',
    'Disponibilité',               // ✅ Déplacé après Vague
    'Date d\'entretien',          // ✅ Déplacé après Disponibilité
    'Date de signature contrat',   // ✅ Déplacé après Date d'entretien
    'Métier',
    'Type d\'agence',
    'Nom',
    'Prénom',
    'Email',
    'Téléphone',
    'Âge',
    'Diplôme',
    'Niveau d\'études',
    'Université',
    'Lieu d\'habitation',
  ]
  
  const sessionInfoHeaders = [
    'Session créée par',
    'Statut de Recrutement',
    'Présence',
    'Motif d\'absence',
    'Évalué par',
  ]
  
  const faceToFaceHeaders =
    metier === 'RESEAUX_SOCIAUX'
      ? [
          'Communication Verbale (moyenne)',
          'Qualité Vocale (moyenne)',
          'Appétence Digitale (moyenne)',
          'Décision Face-à-Face',
        ]
      : [
          'Présentation Visuelle (moyenne)',
          'Communication Verbale (moyenne)',
          'Qualité Vocale (moyenne)',
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
    ...commentHeaders,
  ]
  
  // ----- Lignes de données -----
  const rows = exportableCandidates.map((candidate: any, index: number) => {
    const baseRow = [
      (index + 1).toString(),
      waveInfo,
      candidate.availability || '',                        // ✅ Disponibilité
      candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '', // ✅ Date d'entretien
      candidate.signingDate ? new Date(candidate.signingDate).toLocaleDateString('fr-FR') : '',     // ✅ Date signature
      session.metier || '',
      agenceType,
      candidate.nom || '',
      candidate.prenom || '',
      candidate.email || '',
      candidate.phone || '',
      candidate.age?.toString() || '',
      candidate.diploma || '',
      candidate.niveauEtudes || '',
      candidate.institution || '',
      candidate.location || '',
    ]
    
    const sessionInfo = [
      creatorName,
      candidate.statutRecruitment || '',
      getPresenceStatus(candidate.scores),
      candidate.scores?.statutCommentaire || '',
      getEvaluatorName(candidate.scores),
    ]
    
    const faceToFaceRow =
      metier === 'RESEAUX_SOCIAUX'
        ? [
            calculatePhase1Average(candidate.faceToFaceScores || [], 'verbalCommunication'),
            calculatePhase1Average(candidate.faceToFaceScores || [], 'voiceQuality'),
            calculatePhase1Average(candidate.faceToFaceScores || [], 'appetenceDigitale'),
            candidate.scores?.phase1FfDecision || '',
          ]
        : [
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
    ...rows.map((row: string[]) => row.map(escapeCsvValue).join(',')),
  ].join('\n')
  
  const filename = `export_${metier}_${sessionDate}_par_${creatorName.replace(/\s+/g, '_')}.csv`
  
  return { csv, filename }
}

// ----------------------------------------------------------------------
// EXPORT SESSION (XLSX)
// ----------------------------------------------------------------------
export async function generateSessionExportXLSX(session: any): Promise<{ buffer: ArrayBuffer; filename: string }> {
  const XLSX = await import('xlsx')
  
  const metier = session.metier
  const sessionDate = new Date(session.date).toISOString().split('T')[0]
  const creatorName = getSessionCreatorName(session)
  const waveInfo = getSessionWave(session)
  const agenceType = session.agenceType || ''
  
  const exportableCandidates = session.candidates || []
  
  console.log(`📊 Export XLSX session ${metier} par ${creatorName}: ${exportableCandidates.length} candidats`)
  
  // ----- En-têtes (NOUVELLE ORGANISATION) -----
  const baseHeaders = [
    'N°',
    'Vague',
    'Disponibilité',               // ✅ Déplacé après Vague
    'Date d\'entretien',          // ✅ Déplacé après Disponibilité
    'Date de signature contrat',   // ✅ Déplacé après Date d'entretien
    'Métier',
    'Type d\'agence',
    'Nom',
    'Prénoms',
    'Email',
    'Téléphone',
    'Âge',
    'Diplôme',
    'Niveau d\'études',
    'Université',
    'Lieu d\'habitation',
  ]
  
  const sessionInfoHeaders = [
    'Session créée par',
    'Statut de Recrutement',
    'Présence',
    'Motif d\'absence',
    'Évalué par',
  ]
  
  const faceToFaceHeaders =
    metier === 'RESEAUX_SOCIAUX'
      ? [
          'Communication Verbale (moyenne)',
          'Qualité Vocale (moyenne)',
          'Appétence Digitale (moyenne)',
          'Décision Face-à-Face',
        ]
      : [
          'Présentation Visuelle (moyenne)',
          'Communication Verbale (moyenne)',
          'Qualité Vocale (moyenne)',
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
    ...commentHeaders,
  ]
  
  // ----- Lignes de données -----
  const data = [headers]
  
  exportableCandidates.forEach((candidate: any, index: number) => {
    const baseRow = [
      index + 1,
      waveInfo,
      candidate.availability || '',                        // ✅ Disponibilité
      candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '', // ✅ Date d'entretien
      candidate.signingDate ? new Date(candidate.signingDate).toLocaleDateString('fr-FR') : '',     // ✅ Date signature
      session.metier || '',
      agenceType,
      candidate.nom || '',
      candidate.prenom || '',
      candidate.email || '',
      candidate.phone || '',
      candidate.age || '',
      candidate.diploma || '',
      candidate.niveauEtudes || '',
      candidate.institution || '',
      candidate.location || '',
    ]
    
    const sessionInfo = [
      creatorName,
      candidate.statutRecruitment || '',
      getPresenceStatus(candidate.scores),
      candidate.scores?.statutCommentaire || '',
      getEvaluatorName(candidate.scores),
    ]
    
    const faceToFaceRow =
      metier === 'RESEAUX_SOCIAUX'
        ? [
            calculatePhase1Average(candidate.faceToFaceScores || [], 'verbalCommunication'),
            calculatePhase1Average(candidate.faceToFaceScores || [], 'voiceQuality'),
            calculatePhase1Average(candidate.faceToFaceScores || [], 'appetenceDigitale'),
            candidate.scores?.phase1FfDecision || '',
          ]
        : [
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
  
  // ----- Largeurs de colonnes (AJUSTÉES) -----
  const colWidths = [
    { wch: 5 },   // N°
    { wch: 20 },  // Vague
    { wch: 15 },  // ✅ Disponibilité
    { wch: 15 },  // ✅ Date d'entretien
    { wch: 15 },  // ✅ Date signature contrat
    { wch: 18 },  // Métier
    { wch: 15 },  // Type d'agence
    { wch: 18 },  // Nom
    { wch: 18 },  // Prénoms
    { wch: 25 },  // Email
    { wch: 15 },  // Téléphone
    { wch: 6 },   // Âge
    { wch: 20 },  // Diplôme
    { wch: 15 },  // Niveau d'études
    { wch: 25 },  // Université
    { wch: 20 },  // Lieu d'habitation
    { wch: 20 },  // Session créée par
    { wch: 20 },  // Statut Recrutement
    { wch: 12 },  // Présence
    { wch: 25 },  // Motif d'absence
    { wch: 20 },  // Évalué par
    { wch: 18 },  // Présentation Visuelle / Communication Verbale
    { wch: 20 },  // Communication Verbale / Qualité Vocale
    { wch: 15 },  // Qualité Vocale / Appétence Digitale
    { wch: 18 },  // Décision Face-à-Face
  ]
  
  // Colonnes techniques
  technicalHeaders.forEach(() => colWidths.push({ wch: 18 }))
  
  // Décision Test, Décision Finale, Commentaires
  colWidths.push({ wch: 15 }, { wch: 18 }, { wch: 40 })
  
  ws['!cols'] = colWidths
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Candidats')
  
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const filename = `export_${metier}_${sessionDate}_par_${creatorName.replace(/\s+/g, '_')}.xlsx`
  
  return { buffer, filename }
}

// ----------------------------------------------------------------------
// EXPORT CONSOLIDÉ (CSV)
// ----------------------------------------------------------------------
export function generateConsolidatedExport(sessions: any[]): { csv: string; filename: string } {
  const allExportableCandidates = sessions.flatMap(s =>
    s.candidates.map((c: any) => ({ ...c, session: s }))
  )
  
  console.log(`📊 Export CSV consolidé: ${allExportableCandidates.length} candidats`)
  
  const metiersPresent = Array.from(new Set(allExportableCandidates.map((c: any) => c.metier))) as Metier[]
  
  const allTechnicalColumns = new Set<string>()
  metiersPresent.forEach(metier => {
    metierTechnicalColumns[metier]?.forEach(col => allTechnicalColumns.add(col))
  })
  
  // ----- En-têtes (NOUVELLE ORGANISATION) -----
  const baseHeaders = [
    'N°',
    'Vague',
    'Disponibilité',               // ✅ Déplacé après Vague
    'Date d\'entretien',          // ✅ Déplacé après Disponibilité
    'Date de signature contrat',   // ✅ Déplacé après Date d'entretien
    'Métier',
    'Type d\'agence',
    'Nom',
    'Prénom',
    'Email',
    'Téléphone',
    'Âge',
    'Diplôme',
    'Niveau d\'études',
    'Université',
    'Lieu d\'habitation',
  ]
  
  const sessionInfoHeaders = [
    'Session Créée par',
    'Statut de Recrutement',
    'Présence',
    'Motif d\'absence',
    'Évalué par',
  ]
  
  const faceToFaceHeaders = [
    'Présentation Visuelle (moyenne)',
    'Communication Verbale (moyenne)',
    'Qualité Vocale (moyenne)',
    'Appétence Digitale (moyenne)',
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
    ...commentHeaders,
  ]
  
  // ----- Lignes de données -----
  let candidateNumber = 1
  const rows: string[][] = []
  
  for (const candidateWithSession of allExportableCandidates) {
    const candidate = candidateWithSession
    const session = candidateWithSession.session
    const candidateMetier = candidate.metier as Metier
    const creatorName = getSessionCreatorName(session)
    const waveInfo = getSessionWave(session)
    const agenceType = session.agenceType || ''
    
    const baseRow = [
      candidateNumber.toString(),
      waveInfo,
      candidate.availability || '',                        // ✅ Disponibilité
      candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '', // ✅ Date d'entretien
      candidate.signingDate ? new Date(candidate.signingDate).toLocaleDateString('fr-FR') : '',     // ✅ Date signature
      candidate.metier || '',
      agenceType,
      candidate.nom || '',
      candidate.prenom || '',
      candidate.email || '',
      candidate.phone || '',
      candidate.age?.toString() || '',
      candidate.diploma || '',
      candidate.niveauEtudes || '',
      candidate.institution || '',
      candidate.location || '',
    ]
    
    const sessionInfo = [
      creatorName,
      candidate.statutRecruitment || '',
      getPresenceStatus(candidate.scores),
      candidate.scores?.statutCommentaire || '',
      getEvaluatorName(candidate.scores),
    ]
    
    const faceToFaceRow = [
      calculatePhase1Average(candidate.faceToFaceScores || [], 'presentationVisuelle'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'verbalCommunication'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'voiceQuality'),
      candidateMetier === 'RESEAUX_SOCIAUX'
        ? calculatePhase1Average(candidate.faceToFaceScores || [], 'appetenceDigitale')
        : '',
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
    ...rows.map((row: string[]) => row.map(escapeCsvValue).join(',')),
  ].join('\n')
  
  // Nom du fichier
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

// ----------------------------------------------------------------------
// EXPORT CONSOLIDÉ (XLSX)
// ----------------------------------------------------------------------
export async function generateConsolidatedExportXLSX(sessions: any[]): Promise<{ buffer: ArrayBuffer; filename: string }> {
  const XLSX = await import('xlsx')
  
  const allExportableCandidates = sessions.flatMap(s =>
    s.candidates.map((c: any) => ({ ...c, session: s }))
  )
  
  console.log(`📊 Export XLSX consolidé: ${allExportableCandidates.length} candidats`)
  
  const metiersPresent = Array.from(new Set(allExportableCandidates.map((c: any) => c.metier))) as Metier[]
  
  const allTechnicalColumns = new Set<string>()
  metiersPresent.forEach(metier => {
    metierTechnicalColumns[metier]?.forEach(col => allTechnicalColumns.add(col))
  })
  
  // ----- En-têtes (NOUVELLE ORGANISATION) -----
  const baseHeaders = [
    'N°',
    'Vague',
    'Disponibilité',               // ✅ Déplacé après Vague
    'Date d\'entretien',          // ✅ Déplacé après Disponibilité
    'Date de signature contrat',   // ✅ Déplacé après Date d'entretien
    'Métier',
    'Type d\'agence',
    'Nom',
    'Prénoms',
    'Email',
    'Téléphone',
    'Âge',
    'Diplôme',
    'Niveau d\'études',
    'Université',
    'Lieu d\'habitation',
  ]
  
  const sessionInfoHeaders = [
    'Session Créée par',
    'Statut de Recrutement',
    'Présence',
    'Motif d\'absence',
    'Évalué par',
  ]
  
  const faceToFaceHeaders = [
    'Présentation Visuelle (moyenne)',
    'Communication Verbale (moyenne)',
    'Qualité Vocale (moyenne)',
    'Appétence Digitale (moyenne)',
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
    ...commentHeaders,
  ]
  
  // ----- Lignes de données -----
  const data = [headers]
  let candidateNumber = 1
  
  for (const candidateWithSession of allExportableCandidates) {
    const candidate = candidateWithSession
    const session = candidateWithSession.session
    const candidateMetier = candidate.metier as Metier
    const creatorName = getSessionCreatorName(session)
    const waveInfo = getSessionWave(session)
    const agenceType = session.agenceType || ''
    
    const baseRow = [
      candidateNumber,
      waveInfo,
      candidate.availability || '',                        // ✅ Disponibilité
      candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '', // ✅ Date d'entretien
      candidate.signingDate ? new Date(candidate.signingDate).toLocaleDateString('fr-FR') : '',     // ✅ Date signature
      candidate.metier || '',
      agenceType,
      candidate.nom || '',
      candidate.prenom || '',
      candidate.email || '',
      candidate.phone || '',
      candidate.age || '',
      candidate.diploma || '',
      candidate.niveauEtudes || '',
      candidate.institution || '',
      candidate.location || '',
    ]
    
    const sessionInfo = [
      creatorName,
      candidate.statutRecruitment || '',
      getPresenceStatus(candidate.scores),
      candidate.scores?.statutCommentaire || '',
      getEvaluatorName(candidate.scores),
    ]
    
    const faceToFaceRow = [
      calculatePhase1Average(candidate.faceToFaceScores || [], 'presentationVisuelle'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'verbalCommunication'),
      calculatePhase1Average(candidate.faceToFaceScores || [], 'voiceQuality'),
      candidateMetier === 'RESEAUX_SOCIAUX'
        ? calculatePhase1Average(candidate.faceToFaceScores || [], 'appetenceDigitale')
        : '',
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
  
  // ----- Largeurs de colonnes (AJUSTÉES) -----
  const colWidths = [
    { wch: 5 },   // N°
    { wch: 20 },  // Vague
    { wch: 15 },  // ✅ Disponibilité
    { wch: 15 },  // ✅ Date d'entretien
    { wch: 15 },  // ✅ Date signature contrat
    { wch: 18 },  // Métier
    { wch: 15 },  // Type d'agence
    { wch: 18 },  // Nom
    { wch: 18 },  // Prénoms
    { wch: 25 },  // Email
    { wch: 15 },  // Téléphone
    { wch: 6 },   // Âge
    { wch: 20 },  // Diplôme
    { wch: 15 },  // Niveau d'études
    { wch: 25 },  // Université
    { wch: 20 },  // Lieu d'habitation
    { wch: 20 },  // Session Créée par
    { wch: 20 },  // Statut Recrutement
    { wch: 12 },  // Présence
    { wch: 25 },  // Motif d'absence
    { wch: 20 },  // Évalué par
    { wch: 18 },  // Présentation Visuelle
    { wch: 20 },  // Communication Verbale
    { wch: 15 },  // Qualité Vocale
    { wch: 18 },  // Appétence Digitale
    { wch: 18 },  // Décision Face-à-Face
  ]
  
  // Colonnes techniques
  Array.from(allTechnicalColumns).forEach(() => colWidths.push({ wch: 18 }))
  
  // Décision Test, Décision Finale, Commentaires
  colWidths.push({ wch: 15 }, { wch: 18 }, { wch: 40 })
  
  ws['!cols'] = colWidths
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Tous les Candidats')
  
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  
  // Nom du fichier
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