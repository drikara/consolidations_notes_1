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

// ✅ Fonction pour formater les détails des jurys
function formatJuryDetails(faceToFaceScores: any[], phase: number): string {
  const phaseScores = faceToFaceScores.filter(s => s.phase === phase)
  
  if (phaseScores.length === 0) return ''
  
  return phaseScores.map(score => {
    const juryName = score.juryMember?.fullName || 'Inconnu'
    const roleType = score.juryMember?.roleType || ''
    
    // Pour Phase 1, calculer la moyenne des 3 critères
    if (phase === 1) {
      const pres = Number(score.presentationVisuelle) || 0
      const verbal = Number(score.verbalCommunication) || 0
      const voice = Number(score.voiceQuality) || 0
      const avg = ((pres + verbal + voice) / 3).toFixed(2)
      return `${juryName} (${roleType}): ${avg}/5`
    }
    
    // Pour Phase 2, utiliser le score direct
    return `${juryName} (${roleType}): ${score.score}/5`
  }).join('; ')
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

// ✅ Export par session (inchangé)
export function generateSessionExport(session: any): { csv: string, filename: string } {
  const metier = session.metier
  const sessionDate = new Date(session.date).toISOString().split('T')[0]
  
  // En-têtes de base
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
    'Moyenne FF Phase 1',
    'Détail Jurys Phase 1',
    'Décision FF Phase 1',
    'Moyenne FF Phase 2',
    'Détail Jurys Phase 2',
    'Décision FF Phase 2',
    'Décision Phase 1',
    'Décision Finale',
    'Commentaire',
    'Statut Appel',
    'Tentatives d\'Appel',
    'Date Dernier Appel',
    'Notes d\'Appel'
  ]
  
  // ✅ Ajouter les colonnes spécifiques au métier
  const metierSpecificColumns = metierColumns[metier as Metier] || []
  const headers = [...baseHeaders, ...metierSpecificColumns]
  
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
      calculatePhase1Average(candidate.faceToFaceScores || []),
      formatJuryDetails(candidate.faceToFaceScores || [], 1),
      candidate.scores?.phase1FfDecision || '',
      calculatePhase2Average(candidate.faceToFaceScores || []),
      formatJuryDetails(candidate.faceToFaceScores || [], 2),
      candidate.scores?.phase2FfDecision || '',
      candidate.scores?.phase1Decision || '',
      candidate.scores?.finalDecision || '',
      candidate.scores?.comments || '',
      candidate.scores?.callStatus || '',
      candidate.scores?.callAttempts?.toString() || '',
      candidate.scores?.lastCallDate ? new Date(candidate.scores.lastCallDate).toLocaleDateString('fr-FR') : '',
      candidate.scores?.callNotes || ''
    ]
    
    // ✅ Ajouter les valeurs des colonnes spécifiques au métier
    const metierSpecificValues = metierSpecificColumns.map(col => getColumnValue(candidate, col))
    
    return [...baseRow, ...metierSpecificValues]
  })
  
  // Générer le CSV
  const escapeCsvValue = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }
  
  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row: string[]) => row.map(escapeCsvValue).join(','))
  ].join('\n')
  
  const filename = `session_${metier}_${sessionDate}_${session.jour}.csv`
  
  return { csv, filename }
}

// ✅ Export consolidé avec colonnes par métier
export function generateConsolidatedExport(sessions: any[]): { csv: string, filename: string } {
  // Déterminer tous les métiers présents
  const metiersPresent = Array.from(new Set(
    sessions.flatMap(s => s.candidates.map((c: any) => c.metier))
  )) as Metier[]
  
  // En-têtes de base
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
    'Moyenne FF Phase 1',
    'Détail Jurys Phase 1',
    'Décision FF Phase 1',
    'Moyenne FF Phase 2',
    'Détail Jurys Phase 2',
    'Décision FF Phase 2',
    'Décision Phase 1',
    'Décision Finale',
    'Commentaire',
    'Statut Appel',
    'Tentatives d\'Appel',
    'Date Dernier Appel',
    'Notes d\'Appel'
  ]
  
  // ✅ Collecter toutes les colonnes spécifiques des métiers présents
  const allMetierColumns = new Set<string>()
  metiersPresent.forEach(metier => {
    metierColumns[metier]?.forEach(col => allMetierColumns.add(col))
  })
  
  const headers = [...baseHeaders, ...Array.from(allMetierColumns)]
  
  // Générer les lignes pour tous les candidats
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
        candidate.scores?.callStatus || '',
        candidate.scores?.callAttempts?.toString() || '',
        candidate.scores?.lastCallDate ? new Date(candidate.scores.lastCallDate).toLocaleDateString('fr-FR') : '',
        candidate.scores?.callNotes || ''
      ]
      
      // ✅ Pour chaque colonne métier, ajouter la valeur si elle s'applique à ce candidat
      const metierSpecificValues = Array.from(allMetierColumns).map(col => {
        // Vérifier si cette colonne s'applique au métier du candidat
        const candidateMetierColumns = metierColumns[candidateMetier] || []
        if (candidateMetierColumns.includes(col)) {
          return getColumnValue(candidate, col)
        }
        return '' // Colonne vide si non applicable
      })
      
      rows.push([...baseRow, ...metierSpecificValues])
      candidateNumber++
    }
  }
  
  // Générer le CSV
  const escapeCsvValue = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }
  
  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row: string[]) => row.map(escapeCsvValue).join(','))
  ].join('\n')
  
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
  
  filename += '.csv'
  
  return { csv, filename }
}