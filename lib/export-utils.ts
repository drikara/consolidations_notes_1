// lib/export-utils.ts
import { Metier } from '@prisma/client'
import ExcelJS from 'exceljs'

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

// ✅ Fonction pour formater les détails des jurys
function formatJuryDetails(faceToFaceScores: any[], phase: number): string {
  const phaseScores = faceToFaceScores.filter(s => s.phase === phase)
  
  if (phaseScores.length === 0) return ''
  
  return phaseScores.map(score => {
    const juryName = score.juryMember?.fullName || 'Inconnu'
    const roleType = score.juryMember?.roleType || ''
    
    if (phase === 1) {
      const pres = Number(score.presentationVisuelle) || 0
      const verbal = Number(score.verbalCommunication) || 0
      const voice = Number(score.voiceQuality) || 0
      const avg = ((pres + verbal + voice) / 3).toFixed(2)
      return `${juryName} (${roleType}): ${avg}/5`
    }
    
    return `${juryName} (${roleType}): ${score.score}/5`
  }).join('\n')
}

// ✅ Fonction pour calculer la moyenne Phase 1
function calculatePhase1Average(faceToFaceScores: any[]): string {
  const phase1Scores = faceToFaceScores.filter(s => s.phase === 1)
  
  if (phase1Scores.length === 0) return ''
  
  const avg = phase1Scores.reduce((sum, score) => {
    const pres = Number(score.presentationVisuelle) || 0
    const verbal = Number(score.verbalCommunication) || 0
    const voice = Number(score.voiceQuality) || 0
    return sum + ((pres + verbal + voice) / 3)
  }, 0) / phase1Scores.length
  
  return avg.toFixed(2)
}

// ✅ Fonction pour calculer la moyenne Phase 2
function calculatePhase2Average(faceToFaceScores: any[]): string {
  const phase2Scores = faceToFaceScores.filter(s => s.phase === 2)
  
  if (phase2Scores.length === 0) return ''
  
  const avg = phase2Scores.reduce((sum, score) => sum + (Number(score.score) || 0), 0) / phase2Scores.length
  
  return avg.toFixed(2)
}

// ✅ Styles pour Excel
const getExcelStyles = () => ({
  headerStyle: {
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FF2E75B6' } // Bleu Office
    },
    font: {
      name: 'Arial',
      color: { argb: 'FFFFFFFF' },
      bold: true,
      size: 11
    },
    border: {
      top: { style: 'thin' as const, color: { argb: 'FF000000' } },
      left: { style: 'thin' as const, color: { argb: 'FF000000' } },
      bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
      right: { style: 'thin' as const, color: { argb: 'FF000000' } }
    },
    alignment: {
      vertical: 'middle' as const,
      horizontal: 'center' as const,
      wrapText: true
    }
  },
  titleStyle: {
    font: {
      name: 'Arial',
      color: { argb: 'FF2E75B6' },
      bold: true,
      size: 16
    },
    alignment: {
      vertical: 'middle' as const,
      horizontal: 'center' as const
    }
  },
  subTitleStyle: {
    font: {
      name: 'Arial',
      color: { argb: 'FF2E75B6' },
      bold: true,
      size: 12
    }
  },
  cellStyle: {
    font: {
      name: 'Arial',
      size: 10
    },
    border: {
      top: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } },
      left: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } },
      bottom: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } },
      right: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } }
    },
    alignment: {
      vertical: 'middle' as const,
      wrapText: true
    }
  },
  evenRowStyle: {
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFF2F2F2' } // Gris très clair
    }
  },
  decisionStyle: (decision: string) => {
    let color = 'FFFFFFFF'
    if (decision === 'ADMIS' || decision === 'RECRUTE' || decision === 'FAVORABLE') {
      color = 'FF00B050' // Vert
    } else if (decision === 'NON_RECRUTE' || decision === 'DEFAVORABLE' || decision === 'REFUS') {
      color = 'FFFF0000' // Rouge
    } else if (decision === 'EN_ATTENTE') {
      color = 'FFFFFF00' // Jaune
    }
    return {
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: color }
      }
    }
  }
})

// ✅ Export par session en Excel
export async function generateSessionExport(session: any): Promise<{ buffer: Buffer, filename: string }> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Candidats')
  const styles = getExcelStyles()
  
  const metier = session.metier
  const sessionDate = new Date(session.date).toISOString().split('T')[0]
  
  // Titre principal
  worksheet.mergeCells('A1:AB1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = `LISTE DES CANDIDATS - ${metier} - ${sessionDate}`
  titleCell.style = styles.titleStyle

  // En-têtes de base (sans les colonnes d'appel)
  const baseHeaders = [
    'Numéro', 'Noms et Prénoms', 'Numéro de Téléphone', 'Date de naissance', 'Âge',
    'Diplôme', 'Établissement fréquenté', 'Email', 'Lieu d\'habitation', 'Date d\'envoi SMS',
    'Disponibilité candidat', 'Date de présence entretien', 'Métier Candidat', 'Session Métier',
    'Date de Session', 'Jour de Session', 'Statut de Session','Détail Jurys Phase 1', 'Moyenne FF Phase 1',
    'Décision FF Phase 1', 'Détail Jurys Phase 2',, 'Moyenne FF Phase 2', 'Décision Phase 1',
    'Décision FF Phase 2','Statut Appel','Décision Finale','Commentaire',
  ]
  
  // Ajouter les colonnes spécifiques au métier
  const metierSpecificColumns = metierColumns[metier as Metier] || []
  const headers = [...baseHeaders, ...metierSpecificColumns]
  
  // Ajouter les en-têtes
  const headerRow = worksheet.addRow(headers)
  headerRow.eachCell((cell) => {
    cell.style = styles.headerStyle
  })
  
  // Générer les lignes de données
  session.candidates.forEach((candidate: any, index: number) => {
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
      calculatePhase1Average(candidate.faceToFaceScores || []),
      formatJuryDetails(candidate.faceToFaceScores || [], 1),
      candidate.scores?.phase1FfDecision || '',
      candidate.scores?.phase1Decision || '',
      calculatePhase2Average(candidate.faceToFaceScores || []),
      formatJuryDetails(candidate.faceToFaceScores || [], 2),
      candidate.scores?.phase2FfDecision || '',
      candidate.scores?.callStatus || '' ,
      candidate.scores?.finalDecision || '',
      candidate.scores?.comments || '',
    ]
    
    // Ajouter les valeurs des colonnes spécifiques au métier
    const metierSpecificValues = metierSpecificColumns.map(col => getColumnValue(candidate, col))
    const rowData = [...baseRow, ...metierSpecificValues]
    
    const row = worksheet.addRow(rowData)
    
    // Appliquer les styles aux cellules
    row.eachCell((cell, colNumber) => {
      cell.style = {
        ...styles.cellStyle,
        alignment: {
          ...styles.cellStyle.alignment,
          horizontal: colNumber <= 2 ? 'center' as const : 'left' as const
        }
      }
      
      // Style pour les lignes paires
      if (index % 2 === 0) {
        cell.style = { ...cell.style, ...styles.evenRowStyle }
      }
      
      // Style coloré pour les décisions
      const decisionColumns = [18, 21, 22, 23, 25] // Index ajustés des colonnes de décision
      if (decisionColumns.includes(colNumber) && cell.value) {
        const decisionStyle = styles.decisionStyle(cell.value.toString())
        cell.style = { ...cell.style, ...decisionStyle }
      }

      // Style coloré pour le statut d'appel
      if (colNumber === 26 && cell.value) { // Colonne Statut Appel
        const decisionStyle = styles.decisionStyle(cell.value.toString())
        cell.style = { ...cell.style, ...decisionStyle }
      }
    })
  })
  
  // Ajuster la largeur des colonnes
  worksheet.columns.forEach((column) => {
    if (column) {
      let maxLength = 0
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10
        if (columnLength > maxLength) {
          maxLength = columnLength
        }
      })
      column.width = Math.min(Math.max(maxLength + 2, 10), 50)
    }
  })
  
  // Geler la première ligne (en-têtes)
  worksheet.views = [
    { state: 'frozen', ySplit: 1, xSplit: 0, activeCell: 'A2' }
  ]
  
  // Générer le buffer
  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `session_${metier}_${sessionDate}_${session.jour}.xlsx`
  
  return { buffer: Buffer.from(buffer), filename }
}

// ✅ Export consolidé en Excel
export async function generateConsolidatedExport(sessions: any[]): Promise<{ buffer: Buffer, filename: string }> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Candidats Consolidés')
  const styles = getExcelStyles()
  
  // Déterminer tous les métiers présents
  const metiersPresent = Array.from(new Set(
    sessions.flatMap(s => s.candidates.map((c: any) => c.metier))
  )) as Metier[]
  
  // Titre principal
  worksheet.mergeCells('A1:AC1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = `EXPORT CONSOLIDÉ DES CANDIDATS - ${metiersPresent.join(', ')}`
  titleCell.style = styles.titleStyle

  // En-têtes de base (sans les colonnes d'appel)
  const baseHeaders = [
    'Numéro', 'Noms et Prénoms', 'Numéro de Téléphone', 'Date de naissance', 'Âge',
    'Diplôme', 'Établissement fréquenté', 'Email', 'Lieu d\'habitation', 'Date d\'envoi SMS',
    'Disponibilité candidat', 'Date de présence entretien', 'Métier Candidat', 'Session Métier',
    'Date de Session', 'Jour de Session', 'Statut de Session', 'Lieu de Session', 'Moyenne FF Phase 1',
    'Détail Jurys Phase 1', 'Décision FF Phase 1', 'Moyenne FF Phase 2', 'Détail Jurys Phase 2',
    'Décision FF Phase 2', 'Décision Phase 1','Statut Appel', 'Décision Finale', 'Commentaire', 
  ]
  
  // Collecter toutes les colonnes spécifiques des métiers présents
  const allMetierColumns = new Set<string>()
  metiersPresent.forEach(metier => {
    const columns = metierColumns[metier]
    if (columns) {
      columns.forEach(col => allMetierColumns.add(col))
    }
  })
  
  const headers = [...baseHeaders, ...Array.from(allMetierColumns)]
  
  // Ajouter les en-têtes
  const headerRow = worksheet.addRow(headers)
  headerRow.eachCell((cell) => {
    cell.style = styles.headerStyle
  })
  
  // Générer les lignes pour tous les candidats
  let candidateNumber = 1
  
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
        calculatePhase1Average(candidate.faceToFaceScores || []),
        formatJuryDetails(candidate.faceToFaceScores || [], 1),
        candidate.scores?.phase1FfDecision || '',
        calculatePhase2Average(candidate.faceToFaceScores || []),
        formatJuryDetails(candidate.faceToFaceScores || [], 2),
        candidate.scores?.phase2FfDecision || '',
        candidate.scores?.phase1Decision || '',
        candidate.scores?.finalDecision || '',
        candidate.scores?.comments || '',
        candidate.scores?.callStatus || '' // Seule colonne d'appel conservée
      ]
      
      // Pour chaque colonne métier, ajouter la valeur si elle s'applique à ce candidat
      const metierSpecificValues = Array.from(allMetierColumns).map(col => {
        const candidateMetierColumns = metierColumns[candidateMetier] || []
        if (candidateMetierColumns.includes(col)) {
          return getColumnValue(candidate, col)
        }
        return '' // Colonne vide si non applicable
      })
      
      const rowData = [...baseRow, ...metierSpecificValues]
      const row = worksheet.addRow(rowData)
      
      // Appliquer les styles
      row.eachCell((cell, colNumber) => {
        cell.style = {
          ...styles.cellStyle,
          alignment: {
            ...styles.cellStyle.alignment,
            horizontal: colNumber <= 2 ? 'center' as const : 'left' as const
          }
        }
        
        // Style pour les lignes paires
        if (candidateNumber % 2 === 0) {
          cell.style = { ...cell.style, ...styles.evenRowStyle }
        }
        
        // Style coloré pour les décisions
        const decisionColumns = [19, 22, 23, 24, 26] // Index ajustés des colonnes de décision
        if (decisionColumns.includes(colNumber) && cell.value) {
          const decisionStyle = styles.decisionStyle(cell.value.toString())
          cell.style = { ...cell.style, ...decisionStyle }
        }

        // Style coloré pour le statut d'appel
        if (colNumber === 27 && cell.value) { // Colonne Statut Appel
          const decisionStyle = styles.decisionStyle(cell.value.toString())
          cell.style = { ...cell.style, ...decisionStyle }
        }
      })
      
      candidateNumber++
    }
  }
  
  // Ajuster la largeur des colonnes
  worksheet.columns.forEach((column) => {
    if (column) {
      let maxLength = 0
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10
        if (columnLength > maxLength) {
          maxLength = columnLength
        }
      })
      column.width = Math.min(Math.max(maxLength + 2, 10), 50)
    }
  })
  
  // Geler la première ligne
  worksheet.views = [
    { state: 'frozen', ySplit: 1, xSplit: 0, activeCell: 'A2' }
  ]
  
  // Générer le buffer
  const buffer = await workbook.xlsx.writeBuffer()
  
  // Générer le nom de fichier
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
  
  return { buffer: Buffer.from(buffer), filename }
}

// ✅ Fonctions CSV maintenues pour compatibilité (version simplifiée sans colonnes d'appel)
export function generateSessionExportCSV(session: any): { csv: string, filename: string } {
  const metier = session.metier
  const sessionDate = new Date(session.date).toISOString().split('T')[0]
  
  // En-têtes de base sans colonnes d'appel
    const baseHeaders = [
      'Numéro', 'Noms et Prénoms', 'Numéro de Téléphone', 'Date de naissance', 'Âge',
      'Diplôme', 'Établissement fréquenté', 'Email', 'Lieu d\'habitation', 'Date d\'envoi SMS',
      'Disponibilité candidat', 'Date de présence entretien', 'Métier Candidat', 'Session Métier',
      'Date de Session', 'Jour de Session', 'Statut de Session', 'Détail Jurys Phase 1', 'Moyenne FF Phase 1',
      'Décision FF Phase 1', 'Décision Phase 1', 'Détail Jurys Phase 2', 'Moyenne FF Phase 2',
      'Décision FF Phase 2', 'Décision Finale', 'Statut Appel', 'Commentaire'
    ]
  
  const metierSpecificColumns = metierColumns[metier as Metier] || []
  const headers = [...baseHeaders, ...metierSpecificColumns]
  
  const escapeCsvValue = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }
  
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
      formatJuryDetails(candidate.faceToFaceScores || [], 1),
      calculatePhase1Average(candidate.faceToFaceScores || []),
      
      candidate.scores?.phase1FfDecision || '',
      candidate.scores?.phase1Decision || '',
       formatJuryDetails(candidate.faceToFaceScores || [], 2),
      calculatePhase2Average(candidate.faceToFaceScores || []),
     
      candidate.scores?.phase2FfDecision || '',
      
      candidate.scores?.finalDecision || '',
     
      candidate.scores?.callStatus || '',
       candidate.scores?.comments || '',
    ]
    
    const metierSpecificValues = metierSpecificColumns.map(col => getColumnValue(candidate, col))
    return [...baseRow, ...metierSpecificValues]
  })
  
  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row: string[]) => row.map(escapeCsvValue).join(','))
  ].join('\n')
  
  const filename = `session_${metier}_${sessionDate}_${session.jour}.csv`
  
  return { csv, filename }
}

export function generateConsolidatedExportCSV(sessions: any[]): { csv: string, filename: string } {
  const metiersPresent = Array.from(new Set(
    sessions.flatMap(s => s.candidates.map((c: any) => c.metier))
  )) as Metier[]
  
  // En-têtes de base sans colonnes d'appel
  const baseHeaders = [
    'Numéro', 'Noms et Prénoms', 'Numéro de Téléphone', 'Date de naissance', 'Âge',
    'Diplôme', 'Établissement fréquenté', 'Email', 'Lieu d\'habitation', 'Date d\'envoi SMS',
    'Disponibilité candidat', 'Date de présence entretien', 'Métier Candidat', 'Session Métier',
    'Date de Session', 'Jour de Session', 'Statut de Session', 'Lieu de Session', 'Moyenne FF Phase 1',
    'Détail Jurys Phase 1', 'Décision FF Phase 1', 'Moyenne FF Phase 2', 'Détail Jurys Phase 2',
    'Décision FF Phase 2', 'Décision Phase 1', 'Décision Finale', 'Commentaire', 'Statut Appel'
  ]
  
  const allMetierColumns = new Set<string>()
  metiersPresent.forEach(metier => {
    const columns = metierColumns[metier]
    if (columns) {
      columns.forEach(col => allMetierColumns.add(col))
    }
  })
  
  const headers = [...baseHeaders, ...Array.from(allMetierColumns)]
  
  const escapeCsvValue = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }
  
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
        calculatePhase1Average(candidate.faceToFaceScores || []),
        formatJuryDetails(candidate.faceToFaceScores || [], 1),
        candidate.scores?.phase1FfDecision || '',
        calculatePhase2Average(candidate.faceToFaceScores || []),
        formatJuryDetails(candidate.faceToFaceScores || [], 2),
        candidate.scores?.phase2FfDecision || '',
        candidate.scores?.phase1Decision || '',
        candidate.scores?.finalDecision || '',
        candidate.scores?.comments || '',
        candidate.scores?.callStatus || ''
      ]
      
      const metierSpecificValues = Array.from(allMetierColumns).map(col => {
        const candidateMetierColumns = metierColumns[candidateMetier] || []
        if (candidateMetierColumns.includes(col)) {
          return getColumnValue(candidate, col)
        }
        return ''
      })
      
      rows.push([...baseRow, ...metierSpecificValues])
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