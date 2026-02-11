
//lib/simulation-unlock.ts (LOGIQUE CORRECTE)


import { prisma } from '@/lib/prisma'
import { Metier } from '@prisma/client'

export interface SimulationUnlockStatus {
  unlocked: boolean
  conditions: {
    allJurysEvaluatedPhase1: boolean
    allAveragesAboveThreshold: boolean
    isCorrectMetier: boolean
  }
  phase1Averages: {
    presentationVisuelle: number | null
    verbalCommunication: number
    voiceQuality: number
  }
  phase1Decisions: Array<{
    juryMemberId: number
    juryMemberName: string
    decision: string
  }>
  missingJurys: Array<{
    id: number
    fullName: string
  }>
  missingConditions: string[]
}

/**
 * Vérifie si la simulation (Phase 2) peut être débloquée pour un candidat
 * 
 * CONDITIONS REQUISES:
 * 1. Tous les jurys assignés à la session ont noté la Phase 1
 * 2. Toutes les moyennes Phase 1 sont ≥ 3/5 (CRITÈRE DÉCISIF)
 * 3. Le métier est AGENCES ou TELEVENTE
 * 
 * IMPORTANT : Les décisions individuelles des jurys (FAVORABLE/DÉFAVORABLE)
 * ne sont PAS prises en compte. Seules les MOYENNES comptent.
 * 
 * Exemple : Si 3 jurys donnent FAVORABLE et 1 jury donne DÉFAVORABLE,
 * mais que les moyennes sont ≥ 3/5 → La simulation est DÉBLOQUÉE ✅
 */
export async function checkSimulationUnlockStatus(
  candidateId: number,
  metier: Metier
): Promise<SimulationUnlockStatus> {
  
  console.log(`🔍 [SIMULATION-UNLOCK] Vérification pour Candidat ${candidateId}, Métier: ${metier}`)

  // 📌 CONDITION 1: Vérifier que le métier nécessite une simulation
  const needsSimulation = metier === 'AGENCES' || metier === 'TELEVENTE'
  
  if (!needsSimulation) {
    console.log(`❌ [SIMULATION-UNLOCK] Métier ${metier} ne nécessite pas de simulation`)
    return {
      unlocked: false,
      conditions: {
        allJurysEvaluatedPhase1: false,
        allAveragesAboveThreshold: false,
        isCorrectMetier: false
      },
      phase1Averages: { presentationVisuelle: null, verbalCommunication: 0, voiceQuality: 0 },
      phase1Decisions: [],
      missingJurys: [],
      missingConditions: ['Métier ne nécessite pas de simulation']
    }
  }

  // Récupérer le candidat avec sa session
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      session: {
        include: {
          juryPresences: {
            where: { wasPresent: true },
            include: {
              juryMember: {
                select: {
                  id: true,
                  fullName: true,
                  roleType: true,
                  specialite: true
                }
              }
            }
          }
        }
      },
      faceToFaceScores: {
        where: { phase: 1 },
        include: {
          juryMember: {
            select: {
              id: true,
              fullName: true,
              roleType: true
            }
          }
        }
      }
    }
  })

  if (!candidate || !candidate.session) {
    throw new Error('Candidat ou session non trouvée')
  }

  // 📌 CONDITION 2: Récupérer les jurys qui DOIVENT évaluer ce candidat
  const expectedJurys = candidate.session.juryPresences
    .filter(jp => {
      const jm = jp.juryMember
      // Les représentants métier n'évaluent que leur spécialité
      if (jm.roleType === 'REPRESENTANT_METIER') {
        return jm.specialite === candidate.metier
      }
      // Les autres jurys évaluent tous les candidats
      return true
    })
    .map(jp => jp.juryMember)

  console.log(`📊 [SIMULATION-UNLOCK] Jurys attendus: ${expectedJurys.length}`)
  console.log(`📊 [SIMULATION-UNLOCK] Liste des jurys:`, expectedJurys.map(j => j.fullName))

  // 📌 CONDITION 3: Vérifier qui a déjà noté la Phase 1
  const phase1Scores = candidate.faceToFaceScores
  const evaluatedJuryIds = new Set(phase1Scores.map(s => s.juryMemberId))

  console.log(`📊 [SIMULATION-UNLOCK] Jurys ayant noté Phase 1: ${evaluatedJuryIds.size}/${expectedJurys.length}`)

  // Jurys manquants
  const missingJurys = expectedJurys.filter(j => !evaluatedJuryIds.has(j.id))

  if (missingJurys.length > 0) {
    console.log(`⚠️ [SIMULATION-UNLOCK] Jurys manquants:`, missingJurys.map(j => j.fullName))
  }

  // 📌 CONDITION 4: Tous les jurys ont-ils noté ?
  const allJurysEvaluatedPhase1 = missingJurys.length === 0 && expectedJurys.length > 0

  console.log(`${allJurysEvaluatedPhase1 ? '✅' : '❌'} [SIMULATION-UNLOCK] Tous les jurys ont noté ? ${allJurysEvaluatedPhase1}`)

  // 📌 CONDITION 5: Calculer les moyennes Phase 1
  const isAgences = candidate.metier === 'AGENCES'
  
  let avgPresentation: number | null = null
  let avgVerbal = 0
  let avgVoice = 0

  if (phase1Scores.length > 0) {
    if (isAgences) {
      const presentationScores = phase1Scores
        .map(s => Number(s.presentationVisuelle || 0))
        .filter(score => score > 0)
      
      if (presentationScores.length > 0) {
        avgPresentation = presentationScores.reduce((sum, score) => sum + score, 0) / presentationScores.length
      }
    }
    avgVerbal = phase1Scores.reduce((sum, s) => sum + Number(s.verbalCommunication || 0), 0) / phase1Scores.length
    avgVoice = phase1Scores.reduce((sum, s) => sum + Number(s.voiceQuality || 0), 0) / phase1Scores.length
  }

  console.log(`📊 [SIMULATION-UNLOCK] Moyennes Phase 1:`)
  if (isAgences && avgPresentation !== null) {
    console.log(`   - Présentation visuelle: ${avgPresentation.toFixed(2)}/5 ${avgPresentation >= 3 ? '✅' : '❌'}`)
  }
  console.log(`   - Communication verbale: ${avgVerbal.toFixed(2)}/5 ${avgVerbal >= 3 ? '✅' : '❌'}`)
  console.log(`   - Qualité de la voix: ${avgVoice.toFixed(2)}/5 ${avgVoice >= 3 ? '✅' : '❌'}`)

  // 📌 CONDITION 6: Toutes les moyennes ≥ 3 ?
  // ⭐⭐⭐ C'EST LE SEUL CRITÈRE DÉCISIF POUR LE DÉBLOCAGE ⭐⭐⭐
  const allAveragesAboveThreshold = 
    avgVerbal >= 3 && 
    avgVoice >= 3 && 
    (isAgences ? (avgPresentation || 0) >= 3 : true)

  console.log(`${allAveragesAboveThreshold ? '✅' : '❌'} [SIMULATION-UNLOCK] Toutes les moyennes ≥ 3 ? ${allAveragesAboveThreshold}`)

  // 📊 Récupérer les décisions (uniquement pour information, pas pour le déblocage)
  const phase1Decisions = phase1Scores.map(s => ({
    juryMemberId: s.juryMemberId,
    juryMemberName: s.juryMember.fullName,
    decision: s.decision || 'PENDING'
  }))

  console.log(`📊 [SIMULATION-UNLOCK] Décisions individuelles (informatif uniquement):`)
  phase1Decisions.forEach(d => {
    console.log(`   - ${d.juryMemberName}: ${d.decision}`)
  })

  // 📌 RÉSULTAT FINAL
  // ⚠️ LOGIQUE FINALE : On ignore complètement les décisions individuelles
  // Seules les moyennes comptent !
  const unlocked = 
    allJurysEvaluatedPhase1 && 
    allAveragesAboveThreshold &&
    needsSimulation

  console.log(`${unlocked ? '🔓' : '🔒'} [SIMULATION-UNLOCK] Simulation ${unlocked ? 'DÉBLOQUÉE' : 'BLOQUÉE'}`)

  // Construire la liste des conditions manquantes
  const missingConditions: string[] = []
  
  if (!allJurysEvaluatedPhase1) {
    missingConditions.push(`${missingJurys.length} jury(s) n'ont pas encore noté la Phase 1`)
  }
  
  if (!allAveragesAboveThreshold) {
    const failedCriteria: string[] = []
    if (isAgences && (avgPresentation || 0) < 3) {
      failedCriteria.push(`Présentation visuelle: ${(avgPresentation || 0).toFixed(2)}/5 < 3/5`)
    }
    if (avgVerbal < 3) {
      failedCriteria.push(`Communication verbale: ${avgVerbal.toFixed(2)}/5 < 3/5`)
    }
    if (avgVoice < 3) {
      failedCriteria.push(`Qualité de la voix: ${avgVoice.toFixed(2)}/5 < 3/5`)
    }
    missingConditions.push(`Moyennes insuffisantes: ${failedCriteria.join(', ')}`)
  }

  return {
    unlocked,
    conditions: {
      allJurysEvaluatedPhase1,
      allAveragesAboveThreshold,
      isCorrectMetier: needsSimulation
    },
    phase1Averages: {
      presentationVisuelle: avgPresentation,
      verbalCommunication: avgVerbal,
      voiceQuality: avgVoice
    },
    phase1Decisions, // Gardé pour information uniquement
    missingJurys,
    missingConditions
  }
}

