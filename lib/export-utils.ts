import { Metier } from '@prisma/client'

// Configuration des colonnes par métier
export const getColumnsByMetier = (metier: Metier) => {
  const baseColumns = {
    "Numéro": "number",
    "Noms et Prénoms": "string",
    "Numéro de Téléphone": "string",
    "Date de naissance": "date",
    "Âge": "number",
    "Diplôme": "string",
    "Établissement fréquenté": "string",
    "Email": "string",
    "Lieu d'habitation": "string",
    "Date d'envoi SMS": "date",
    "Disponibilité candidat": "string",
    "Date de présence entretien": "date",
    "Métier Candidat": "string",
    "Session Métier": "string",
    "Date de Session": "date",
    "Jour de Session": "string",
    "Statut de Session": "string",
    "Lieu de Session": "string",
    "Moyenne FF Phase 1": "number",
    "Détail Jurys Phase 1": "string",
    "Décision FF Phase 1": "string",
    "Moyenne FF Phase 2": "number",
    "Détail Jurys Phase 2": "string",
    "Décision FF Phase 2": "string",
    "Décision Phase 1": "string",
    "Décision Finale": "string",
    "Commentaire": "string",
    "Statut Appel": "string",
    "Tentatives d'Appel": "number",
    "Date Dernier Appel": "date",
    "Notes d'Appel": "string",
  }

  const metierSpecificColumns: Record<Metier, any> = {
    CALL_CENTER: {
      "Test Psychotechnique (/10)": "number",
      "Rapidité de saisie (MPM)": "number",
      "Précision de saisie (%)": "number",
      "Test Excel (/5)": "number",
      "Dictée (/20)": "number",
      "Date de présence Phase 2": "date",
    },
    AGENCES: {
      "Test Psychotechnique (/10)": "number",
      "Rapidité de saisie (MPM)": "number",
      "Précision de saisie (%)": "number",
      "Test Excel (/5)": "number",
      "Dictée (/20)": "number",
      "Simulation de Vente (/5)": "number",
      "Date de présence Phase 2": "date",
    },
    BO_RECLAM: {
      "Test Psychotechnique (/10)": "number",
      "Rapidité de saisie (MPM)": "number",
      "Précision de saisie (%)": "number",
      "Test Excel (/5)": "number",
      "Exercice d'Analyse (/10)": "number",
      "Date de présence Phase 2": "date",
    },
    TELEVENTE: {
      "Test Psychotechnique (/10)": "number",
      "Rapidité de saisie (MPM)": "number",
      "Précision de saisie (%)": "number",
      "Simulation de Vente (/5)": "number",
      "Date de présence Phase 2": "date",
    },
    RESEAUX_SOCIAUX: {
      "Test Psychotechnique (/10)": "number",
      "Rapidité de saisie (MPM)": "number",
      "Précision de saisie (%)": "number",
      "Test Excel (/5)": "number",
      "Exercice d'Analyse (/10)": "number",
      "Date de présence Phase 2": "date",
    },
    SUPERVISION: {
      "Test Psychotechnique (/10)": "number",
      "Rapidité de saisie (MPM)": "number",
      "Précision de saisie (%)": "number",
      "Test Excel (/5)": "number",
      "Exercice d'Analyse (/10)": "number",
      "Dictée (/20)": "number",
      "Date de présence Phase 2": "date",
    },
    BOT_COGNITIVE_TRAINER: {
      "Test Psychotechnique (/10)": "number",
      "Rapidité de saisie (MPM)": "number",
      "Précision de saisie (%)": "number",
      "Test Excel (/5)": "number",
      "Exercice d'Analyse (/10)": "number",
      "Date de présence Phase 2": "date",
    },
    SMC_FIXE: {
      "Test Psychotechnique (/10)": "number",
      "Rapidité de saisie (MPM)": "number",
      "Précision de saisie (%)": "number",
      "Test Excel (/5)": "number",
      "Dictée (/20)": "number",
      "Date de présence Phase 2": "date",
    },
    SMC_MOBILE: {
      "Test Psychotechnique (/10)": "number",
      "Rapidité de saisie (MPM)": "number",
      "Précision de saisie (%)": "number",
      "Test Excel (/5)": "number",
      "Dictée (/20)": "number",
      "Date de présence Phase 2": "date",
    },
  }

  return {
    ...baseColumns,
    ...metierSpecificColumns[metier]
  }
}

// Fonction pour formater les dates en français - CORRIGÉE
function formatDateToFrench(date: Date | string | null): string {
  if (!date) return ""
  
  try {
    // S'assurer que c'est un objet Date valide
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Vérifier si la date est valide
    if (isNaN(dateObj.getTime())) {
      console.warn('Date invalide:', date)
      return ""
    }
    
    // Formater en JJ/MM/AAAA
    const day = String(dateObj.getDate()).padStart(2, '0')
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const year = dateObj.getFullYear()
    
    return `${day}/${month}/${year}`
  } catch (error) {
    console.error('Erreur de formatage de date:', date, error)
    return ""
  }
}

// Fonctions pour générer les noms de fichiers
export function getSessionExportFilename(session: any): string {
  const dateStr = session.date ? formatDateToFrench(session.date).replace(/\//g, '-') : new Date().toISOString().split('T')[0]
  return `metier_${session.metier}_${dateStr}_complet_consolide.csv`
}

export function getConsolidatedExportFilename(): string {
  const dateStr = new Date().toISOString().split('T')[0]
  return `recrutement_consolide_${dateStr}.csv`
}

export function getGlobalExportFilename(): string {
  const dateStr = new Date().toISOString().split('T')[0]
  return `vue_globale_recrutement_${dateStr}.csv`
}

export function generateSessionExport(session: any): { csv: string, filename: string } {
  const results = session.candidates.map((candidate: any, index: number) => {
    const phase1Scores = candidate.faceToFaceScores?.filter((s: any) => s.phase === 1) || []
    const phase2Scores = candidate.faceToFaceScores?.filter((s: any) => s.phase === 2) || []

    const avgPhase1 = phase1Scores.length > 0 
      ? phase1Scores.reduce((sum: number, s: any) => sum + Number(s.score), 0) / phase1Scores.length 
      : null

    const avgPhase2 = phase2Scores.length > 0 
      ? phase2Scores.reduce((sum: number, s: any) => sum + Number(s.score), 0) / phase2Scores.length 
      : null

    const juryDetailsPhase1 = phase1Scores.map((score: any) => 
      `${score.juryMember?.fullName || 'Inconnu'} (${score.juryMember?.roleType || 'INCONNU'}): ${Number(score.score).toFixed(2)}/5`
    ).join('; ')

    const juryDetailsPhase2 = phase2Scores.map((score: any) => 
      `${score.juryMember?.fullName || 'Inconnu'} (${score.juryMember?.roleType || 'INCONNU'}): ${Number(score.score).toFixed(2)}/5`
    ).join('; ')

    const baseData = {
      "Numéro": index + 1,
      "Noms et Prénoms": candidate.fullName || "",
      "Numéro de Téléphone": candidate.phone || "",
      "Date de naissance": formatDateToFrench(candidate.birthDate), // CORRIGÉ
      "Âge": candidate.age || "",
      "Diplôme": candidate.diploma || "",
      "Établissement fréquenté": candidate.institution || "",
      "Email": candidate.email || "",
      "Lieu d'habitation": candidate.location || "",
      "Date d'envoi SMS": formatDateToFrench(candidate.smsSentDate),
      "Disponibilité candidat": candidate.availability || "",
      "Date de présence entretien": formatDateToFrench(candidate.interviewDate),
      "Métier Candidat": candidate.metier || "",
      "Session Métier": session.metier || "",
      "Date de Session": formatDateToFrench(session.date),
      "Jour de Session": session.jour || "",
      "Statut de Session": session.status || "",
      "Lieu de Session": session.location || "",
      "Moyenne FF Phase 1": avgPhase1 !== null ? avgPhase1.toFixed(2) : "",
      "Détail Jurys Phase 1": juryDetailsPhase1,
      "Décision FF Phase 1": candidate.scores?.phase1FfDecision || "",
      "Moyenne FF Phase 2": avgPhase2 !== null ? avgPhase2.toFixed(2) : "",
      "Détail Jurys Phase 2": juryDetailsPhase2,
      "Décision FF Phase 2": candidate.scores?.phase2FfDecision || "",
      "Décision Phase 1": candidate.scores?.phase1Decision || "",
      "Décision Finale": candidate.scores?.finalDecision || "",
      "Commentaire": candidate.scores?.comments || "",
      "Statut Appel": candidate.scores?.callStatus || "",
      "Tentatives d'Appel": candidate.scores?.callAttempts || "",
      "Date Dernier Appel": formatDateToFrench(candidate.scores?.lastCallDate),
      "Notes d'Appel": candidate.scores?.callNotes || "",
    }

    const metierSpecificData = getMetierSpecificData(candidate.metier, candidate.scores)

    return {
      ...baseData,
      ...metierSpecificData
    }
  })

  if (results.length === 0) {
    const headers = Object.keys(getColumnsByMetier(session.metier))
    const bom = "\uFEFF"
    const csv = bom + headers.join(",")
    const filename = getSessionExportFilename(session)
    return { csv, filename }
  }

  const headers_row = Object.keys(results[0]).join(",")
  const data_rows = results.map((row: any) => {
    return Object.values(row)
      .map((value) => {
        if (value === null || value === undefined || value === "") return ""
        const stringValue = String(value)
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n") || stringValue.includes("\r")) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      .join(",")
  })

  const csv = [headers_row, ...data_rows].join("\n")
  const bom = "\uFEFF"
  const finalCsv = bom + csv
  const filename = getSessionExportFilename(session)
  
  return { csv: finalCsv, filename }
}

function getMetierSpecificData(metier: Metier, scores: any) {
  const data: any = {
    "Test Psychotechnique (/10)": "",
    "Rapidité de saisie (MPM)": "",
    "Précision de saisie (%)": "",
    "Test Excel (/5)": "",
    "Dictée (/20)": "",
    "Simulation de Vente (/5)": "",
    "Exercice d'Analyse (/10)": "",
    "Date de présence Phase 2": "",
  }

  if (!scores) return data

  switch (metier) {
    case 'CALL_CENTER':
      data["Test Psychotechnique (/10)"] = scores.psychotechnicalTest ? Number(scores.psychotechnicalTest) : ""
      data["Rapidité de saisie (MPM)"] = scores.typingSpeed || ""
      data["Précision de saisie (%)"] = scores.typingAccuracy ? Number(scores.typingAccuracy) : ""
      data["Test Excel (/5)"] = scores.excelTest ? Number(scores.excelTest) : ""
      data["Dictée (/20)"] = scores.dictation ? Number(scores.dictation) : ""
      data["Date de présence Phase 2"] = formatDateToFrench(scores.phase2Date)
      break

    case 'AGENCES':
      data["Test Psychotechnique (/10)"] = scores.psychotechnicalTest ? Number(scores.psychotechnicalTest) : ""
      data["Rapidité de saisie (MPM)"] = scores.typingSpeed || ""
      data["Précision de saisie (%)"] = scores.typingAccuracy ? Number(scores.typingAccuracy) : ""
      data["Test Excel (/5)"] = scores.excelTest ? Number(scores.excelTest) : ""
      data["Dictée (/20)"] = scores.dictation ? Number(scores.dictation) : ""
      data["Simulation de Vente (/5)"] = scores.salesSimulation ? Number(scores.salesSimulation) : ""
      data["Date de présence Phase 2"] = formatDateToFrench(scores.phase2Date)
      break

    case 'BO_RECLAM':
      data["Test Psychotechnique (/10)"] = scores.psychotechnicalTest ? Number(scores.psychotechnicalTest) : ""
      data["Rapidité de saisie (MPM)"] = scores.typingSpeed || ""
      data["Précision de saisie (%)"] = scores.typingAccuracy ? Number(scores.typingAccuracy) : ""
      data["Test Excel (/5)"] = scores.excelTest ? Number(scores.excelTest) : ""
      data["Exercice d'Analyse (/10)"] = scores.analysisExercise ? Number(scores.analysisExercise) : ""
      data["Date de présence Phase 2"] = formatDateToFrench(scores.phase2Date)
      break

    case 'TELEVENTE':
      data["Test Psychotechnique (/10)"] = scores.psychotechnicalTest ? Number(scores.psychotechnicalTest) : ""
      data["Rapidité de saisie (MPM)"] = scores.typingSpeed || ""
      data["Précision de saisie (%)"] = scores.typingAccuracy ? Number(scores.typingAccuracy) : ""
      data["Simulation de Vente (/5)"] = scores.salesSimulation ? Number(scores.salesSimulation) : ""
      data["Date de présence Phase 2"] = formatDateToFrench(scores.phase2Date)
      break

    case 'RESEAUX_SOCIAUX':
      data["Test Psychotechnique (/10)"] = scores.psychotechnicalTest ? Number(scores.psychotechnicalTest) : ""
      data["Rapidité de saisie (MPM)"] = scores.typingSpeed || ""
      data["Précision de saisie (%)"] = scores.typingAccuracy ? Number(scores.typingAccuracy) : ""
      data["Test Excel (/5)"] = scores.excelTest ? Number(scores.excelTest) : ""
      data["Exercice d'Analyse (/10)"] = scores.analysisExercise ? Number(scores.analysisExercise) : ""
      data["Date de présence Phase 2"] = formatDateToFrench(scores.phase2Date)
      break

    case 'SUPERVISION':
      data["Test Psychotechnique (/10)"] = scores.psychotechnicalTest ? Number(scores.psychotechnicalTest) : ""
      data["Rapidité de saisie (MPM)"] = scores.typingSpeed || ""
      data["Précision de saisie (%)"] = scores.typingAccuracy ? Number(scores.typingAccuracy) : ""
      data["Test Excel (/5)"] = scores.excelTest ? Number(scores.excelTest) : ""
      data["Exercice d'Analyse (/10)"] = scores.analysisExercise ? Number(scores.analysisExercise) : ""
      data["Dictée (/20)"] = scores.dictation ? Number(scores.dictation) : ""
      data["Date de présence Phase 2"] = formatDateToFrench(scores.phase2Date)
      break

    case 'BOT_COGNITIVE_TRAINER':
      data["Test Psychotechnique (/10)"] = scores.psychotechnicalTest ? Number(scores.psychotechnicalTest) : ""
      data["Rapidité de saisie (MPM)"] = scores.typingSpeed || ""
      data["Précision de saisie (%)"] = scores.typingAccuracy ? Number(scores.typingAccuracy) : ""
      data["Test Excel (/5)"] = scores.excelTest ? Number(scores.excelTest) : ""
      data["Exercice d'Analyse (/10)"] = scores.analysisExercise ? Number(scores.analysisExercise) : ""
      data["Date de présence Phase 2"] = formatDateToFrench(scores.phase2Date)
      break

    case 'SMC_FIXE':
      data["Test Psychotechnique (/10)"] = scores.psychotechnicalTest ? Number(scores.psychotechnicalTest) : ""
      data["Rapidité de saisie (MPM)"] = scores.typingSpeed || ""
      data["Précision de saisie (%)"] = scores.typingAccuracy ? Number(scores.typingAccuracy) : ""
      data["Test Excel (/5)"] = scores.excelTest ? Number(scores.excelTest) : ""
      data["Dictée (/20)"] = scores.dictation ? Number(scores.dictation) : ""
      data["Date de présence Phase 2"] = formatDateToFrench(scores.phase2Date)
      break

    case 'SMC_MOBILE':
      data["Test Psychotechnique (/10)"] = scores.psychotechnicalTest ? Number(scores.psychotechnicalTest) : ""
      data["Rapidité de saisie (MPM)"] = scores.typingSpeed || ""
      data["Précision de saisie (%)"] = scores.typingAccuracy ? Number(scores.typingAccuracy) : ""
      data["Test Excel (/5)"] = scores.excelTest ? Number(scores.excelTest) : ""
      data["Dictée (/20)"] = scores.dictation ? Number(scores.dictation) : ""
      data["Date de présence Phase 2"] = formatDateToFrench(scores.phase2Date)
      break
  }

  return data
}

export function generateConsolidatedExport(sessions: any[]): { csv: string, filename: string } {
  const allColumns = getAllPossibleColumns()
  
  const results = sessions.flatMap(session => 
    session.candidates.map((candidate: any, index: number) => {
      const phase1Scores = candidate.faceToFaceScores?.filter((s: any) => s.phase === 1) || []
      const phase2Scores = candidate.faceToFaceScores?.filter((s: any) => s.phase === 2) || []

      const avgPhase1 = phase1Scores.length > 0 
        ? phase1Scores.reduce((sum: number, s: any) => sum + Number(s.score), 0) / phase1Scores.length 
        : null

      const avgPhase2 = phase2Scores.length > 0 
        ? phase2Scores.reduce((sum: number, s: any) => sum + Number(s.score), 0) / phase2Scores.length 
        : null

      const juryDetailsPhase1 = phase1Scores.map((score: any) => 
        `${score.juryMember?.fullName || 'Inconnu'} (${score.juryMember?.roleType || 'INCONNU'}): ${Number(score.score).toFixed(2)}/5`
      ).join('; ')

      const juryDetailsPhase2 = phase2Scores.map((score: any) => 
        `${score.juryMember?.fullName || 'Inconnu'} (${score.juryMember?.roleType || 'INCONNU'}): ${Number(score.score).toFixed(2)}/5`
      ).join('; ')

      const baseData = {
        "Numéro": index + 1,
        "Noms et Prénoms": candidate.fullName || "",
        "Numéro de Téléphone": candidate.phone || "",
        "Date de naissance": formatDateToFrench(candidate.birthDate), // CORRIGÉ
        "Âge": candidate.age || "",
        "Diplôme": candidate.diploma || "",
        "Établissement fréquenté": candidate.institution || "",
        "Email": candidate.email || "",
        "Lieu d'habitation": candidate.location || "",
        "Date d'envoi SMS": formatDateToFrench(candidate.smsSentDate),
        "Disponibilité candidat": candidate.availability || "",
        "Date de présence entretien": formatDateToFrench(candidate.interviewDate),
        "Métier Candidat": candidate.metier || "",
        "Session Métier": session.metier || "",
        "Date de Session": formatDateToFrench(session.date),
        "Jour de Session": session.jour || "",
        "Statut de Session": session.status || "",
        "Lieu de Session": session.location || "",
        "Moyenne FF Phase 1": avgPhase1 !== null ? avgPhase1.toFixed(2) : "",
        "Détail Jurys Phase 1": juryDetailsPhase1,
        "Décision FF Phase 1": candidate.scores?.phase1FfDecision || "",
        "Moyenne FF Phase 2": avgPhase2 !== null ? avgPhase2.toFixed(2) : "",
        "Détail Jurys Phase 2": juryDetailsPhase2,
        "Décision FF Phase 2": candidate.scores?.phase2FfDecision || "",
        "Décision Phase 1": candidate.scores?.phase1Decision || "",
        "Décision Finale": candidate.scores?.finalDecision || "",
        "Commentaire": candidate.scores?.comments || "",
        "Statut Appel": candidate.scores?.callStatus || "",
        "Tentatives d'Appel": candidate.scores?.callAttempts || "",
        "Date Dernier Appel": formatDateToFrench(candidate.scores?.lastCallDate),
        "Notes d'Appel": candidate.scores?.callNotes || "",
      }

      const metierSpecificData = getMetierSpecificData(candidate.metier, candidate.scores)

      return {
        ...baseData,
        ...metierSpecificData
      }
    })
  )

  const headers_row = Object.keys(allColumns).join(",")
  const data_rows = results.map((row: any) => {
    return Object.keys(allColumns).map(key => {
      const value = row[key] !== undefined ? row[key] : ""
      if (value === null || value === undefined || value === "") return ""
      const stringValue = String(value)
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n") || stringValue.includes("\r")) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }).join(",")
  })

  const csv = [headers_row, ...data_rows].join("\n")
  const bom = "\uFEFF"
  const finalCsv = bom + csv
  const filename = getConsolidatedExportFilename()
  
  return { csv: finalCsv, filename }
}

function getAllPossibleColumns() {
  const allMetiers: Metier[] = [
    'CALL_CENTER', 'AGENCES', 'BO_RECLAM', 'TELEVENTE', 'RESEAUX_SOCIAUX',
    'SUPERVISION', 'BOT_COGNITIVE_TRAINER', 'SMC_FIXE', 'SMC_MOBILE'
  ]

  const allColumns: any = {}
  
  const baseColumns = getColumnsByMetier('CALL_CENTER')
  Object.keys(baseColumns).forEach(key => {
    allColumns[key] = baseColumns[key]
  })

  allMetiers.forEach(metier => {
    const metierColumns = getColumnsByMetier(metier)
    Object.keys(metierColumns).forEach(key => {
      allColumns[key] = metierColumns[key]
    })
  })

  return allColumns
}

export function generateGlobalExport(sessions: any[]): { csv: string, filename: string } {
  const headers = [
    'Session', 'Métier Session', 'Date Session', 'Jour Session', 'Statut Session',
    'Candidat', 'Métier Candidat', 'Email', 'Téléphone', 'Moyenne Phase 1', 
    'Moyenne Phase 2', 'Décision Finale', 'Statut Appel'
  ]

  const rows = sessions.flatMap(session => 
    session.candidates.map((candidate: any) => {
      const phase1Scores = candidate.faceToFaceScores?.filter((s: any) => s.phase === 1) || []
      const phase2Scores = candidate.faceToFaceScores?.filter((s: any) => s.phase === 2) || []
      
      const avgPhase1 = phase1Scores.length > 0 
        ? phase1Scores.reduce((sum: number, s: any) => sum + Number(s.score), 0) / phase1Scores.length 
        : null
      
      const avgPhase2 = phase2Scores.length > 0 
        ? phase2Scores.reduce((sum: number, s: any) => sum + Number(s.score), 0) / phase2Scores.length 
        : null

      return [
        `${session.metier} - ${session.jour}`,
        session.metier,
        formatDateToFrench(session.date),
        session.jour,
        session.status,
        candidate.fullName,
        candidate.metier,
        candidate.email,
        candidate.phone,
        avgPhase1 !== null ? avgPhase1.toFixed(2) : '',
        avgPhase2 !== null ? avgPhase2.toFixed(2) : '',
        candidate.scores?.finalDecision || '',
        candidate.scores?.callStatus || ''
      ]
    })
  )

  const csv = [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n')
  const bom = "\uFEFF"
  const finalCsv = bom + csv
  const filename = getGlobalExportFilename()
  
  return { csv: finalCsv, filename }
}