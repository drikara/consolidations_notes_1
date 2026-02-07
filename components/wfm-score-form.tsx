'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getMetierConfig } from '@/lib/metier-config'
import { checkSimulationUnlockStatus } from '@/lib/simulation-unlock'
import { CheckCircle, XCircle, AlertTriangle, Users, Lock, Unlock, AlertCircle } from 'lucide-react'

interface WFMScoreFormProps {
  candidate: {
    id: number
    fullName: string
    nom: string
    prenom: string
    metier: string
    availability: string
  }
  existingScores: any
}

interface JuryScore {
  id: number
  phase: number
  juryMemberId: number
  juryMember: {
    fullName: string
    roleType: string
  }
  presentationVisuelle: any | null
  verbalCommunication: any | null
  voiceQuality: any | null
  appetenceDigitale: any | null
  simulationSensNegociation: any | null
  simulationCapacitePersuasion: any | null
  simulationSensCombativite: any | null
  decision: 'FAVORABLE' | 'DEFAVORABLE' | null
  evaluatedAt: Date
}

export function WFMScoreForm({ candidate, existingScores }: WFMScoreFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [juryScores, setJuryScores] = useState<JuryScore[]>([])
  const [unlockStatus, setUnlockStatus] = useState<any>(null)
  const [loadingUnlock, setLoadingUnlock] = useState(false)
  
  const [technicalScores, setTechnicalScores] = useState({
    typing_speed: existingScores?.typingSpeed?.toString() || '',
    typing_accuracy: existingScores?.typingAccuracy?.toString() || '',
    excel_test: existingScores?.excelTest?.toString() || '',
    dictation: existingScores?.dictation?.toString() || '',
    psycho_raisonnement: existingScores?.psychoRaisonnementLogique?.toString() || '',
    psycho_attention: existingScores?.psychoAttentionConcentration?.toString() || '',
    analysis_exercise: existingScores?.analysisExercise?.toString() || '',
    statut: existingScores?.statut || 'ABSENT',
    statut_commentaire: existingScores?.statutCommentaire || '',
    comments: existingScores?.comments || '',
  })

  const config = getMetierConfig(candidate.metier as any)
  const isAgences = candidate.metier === 'AGENCES'
  const isReseauxSociaux = candidate.metier === 'RESEAUX_SOCIAUX'
  const needsSimulation = candidate.metier === 'AGENCES' || candidate.metier === 'TELEVENTE'

  // Charger les scores des jurys et le statut de déblocage
  useEffect(() => {
    if (candidate.availability === 'NON') {
      console.log('📊 Candidat non disponible - Pas de chargement des scores jurys')
      return
    }

    const fetchJuryScores = async () => {
      try {
        const response = await fetch(`/api/candidates/${candidate.id}/jury-scores`)
        if (response.ok) {
          const scores = await response.json()
          setJuryScores(scores)
          console.log('📊 Scores jurys chargés:', scores)
          
          // ✅ LOG DÉTAILLÉ pour debug
          if (candidate.metier === 'RESEAUX_SOCIAUX') {
            console.log('📊 Scores RESEAUX_SOCIAUX détaillés:', 
              scores.filter((s: any) => s.phase === 1).map((s: any) => ({
                juryId: s.juryMemberId,
                juryName: s.juryMember?.fullName,
                appetenceDigitale: s.appetenceDigitale,
                type: typeof s.appetenceDigitale,
                raw: s.appetenceDigitale
              }))
            )
          }
        }
      } catch (error) {
        console.error('Erreur chargement scores jurys:', error)
      }
    }

    const fetchUnlockStatus = async () => {
      if (needsSimulation) {
        setLoadingUnlock(true)
        try {
          const response = await fetch(`/api/candidates/${candidate.id}/simulation-unlock`)
          if (response.ok) {
            const status = await response.json()
            setUnlockStatus(status)
          }
        } catch (error) {
          console.error('Erreur chargement statut déblocage:', error)
        } finally {
          setLoadingUnlock(false)
        }
      }
    }

    // ✅ Charger immédiatement
    fetchJuryScores()
    fetchUnlockStatus()
    
    // ✅ Rafraîchir toutes les 5 secondes (pour voir les mises à jour en temps réel)
    const interval = setInterval(() => {
      fetchJuryScores()
      if (needsSimulation) {
        fetchUnlockStatus()
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [candidate.id, candidate.metier, candidate.availability, needsSimulation])

  // ✅ FONCTION CORRIGÉE : Calculer la moyenne d'appétence digitale
  const calculateAppetenceDigitaleAverage = () => {
    if (candidate.availability === 'NON') return 0
    
    const phase1Scores = juryScores.filter(s => s.phase === 1)
    
    console.log('📊 Calcul appétence digitale - scores Phase 1:', {
      count: phase1Scores.length,
      scores: phase1Scores.map(s => ({
        juryId: s.juryMemberId,
        juryName: s.juryMember?.fullName,
        appetence: s.appetenceDigitale != null ? String(s.appetenceDigitale) : null
      }))
    })
    
    if (phase1Scores.length === 0) {
      console.log('⚠️ Aucun score Phase 1 trouvé')
      return null
    }
    
    // Filtrer les scores qui ont une appétence digitale NON NULL
    const scoresWithAppetence = phase1Scores.filter(s => s.appetenceDigitale !== null && s.appetenceDigitale !== undefined)
    
    console.log('📊 Scores avec appétence digitale:', {
      count: scoresWithAppetence.length,
      values: scoresWithAppetence.map(s => s.appetenceDigitale != null ? String(s.appetenceDigitale) : null)
    })
    
    if (scoresWithAppetence.length === 0) {
      console.log('⚠️ Aucun score avec appétence digitale')
      return null
    }
    
    const total = scoresWithAppetence.reduce((sum, s) => {
      // ✅ Gérer le type Decimal de Prisma
      const value = typeof s.appetenceDigitale === 'number' 
        ? s.appetenceDigitale 
        : parseFloat(String(s.appetenceDigitale || '0'))
      
      console.log('  - Score jury:', value)
      return sum + value
    }, 0)
    
    const average = total / scoresWithAppetence.length
    console.log('✅ Moyenne appétence digitale calculée:', average)
    
    return average
  }

  //  CALCUL DES MOYENNES PHASE FACE-À-FACE
  const calculatePhase1Averages = () => {
    if (candidate.availability === 'NON') {
      return {
        presentationVisuelle: isAgences ? 0 : null,
        verbalCommunication: 0,
        voiceQuality: 0,
        count: 0,
        allFavorable: false
      }
    }

    const phase1Scores = juryScores.filter(s => s.phase === 1)
    
    if (phase1Scores.length === 0) {
      return {
        presentationVisuelle: null,
        verbalCommunication: null,
        voiceQuality: null,
        count: 0,
        allFavorable: false
      }
    }

    if (isAgences) {
      const avgPresentation = phase1Scores.reduce((sum, s) => {
        const val = typeof s.presentationVisuelle === 'number' ? s.presentationVisuelle : parseFloat(String(s.presentationVisuelle || 0))
        return sum + val
      }, 0) / phase1Scores.length
      
      const avgVerbal = phase1Scores.reduce((sum, s) => {
        const val = typeof s.verbalCommunication === 'number' ? s.verbalCommunication : parseFloat(String(s.verbalCommunication || 0))
        return sum + val
      }, 0) / phase1Scores.length
      
      const avgVoice = phase1Scores.reduce((sum, s) => {
        const val = typeof s.voiceQuality === 'number' ? s.voiceQuality : parseFloat(String(s.voiceQuality || 0))
        return sum + val
      }, 0) / phase1Scores.length

      const allFavorable = phase1Scores.every(s => s.decision === 'FAVORABLE')

      return {
        presentationVisuelle: avgPresentation,
        verbalCommunication: avgVerbal,
        voiceQuality: avgVoice,
        count: phase1Scores.length,
        allFavorable
      }
    } else if (isReseauxSociaux) {
      // ✅ Pour RESEAUX_SOCIAUX, calculer seulement les moyennes des critères WFM
      const avgVerbal = phase1Scores.reduce((sum, s) => {
        const val = typeof s.verbalCommunication === 'number' ? s.verbalCommunication : parseFloat(String(s.verbalCommunication || 0))
        return sum + val
      }, 0) / phase1Scores.length
      
      const avgVoice = phase1Scores.reduce((sum, s) => {
        const val = typeof s.voiceQuality === 'number' ? s.voiceQuality : parseFloat(String(s.voiceQuality || 0))
        return sum + val
      }, 0) / phase1Scores.length

      const allFavorable = phase1Scores.every(s => s.decision === 'FAVORABLE')

      return {
        verbalCommunication: avgVerbal,
        voiceQuality: avgVoice,
        presentationVisuelle: null,
        count: phase1Scores.length,
        allFavorable
      }
    } else {
      // Pour TELEVENTE et CALL_CENTER
      const avgVerbal = phase1Scores.reduce((sum, s) => {
        const val = typeof s.verbalCommunication === 'number' ? s.verbalCommunication : parseFloat(String(s.verbalCommunication || 0))
        return sum + val
      }, 0) / phase1Scores.length
      
      const avgVoice = phase1Scores.reduce((sum, s) => {
        const val = typeof s.voiceQuality === 'number' ? s.voiceQuality : parseFloat(String(s.voiceQuality || 0))
        return sum + val
      }, 0) / phase1Scores.length

      const allFavorable = phase1Scores.every(s => s.decision === 'FAVORABLE')

      return {
        verbalCommunication: avgVerbal,
        voiceQuality: avgVoice,
        presentationVisuelle: null,
        count: phase1Scores.length,
        allFavorable
      }
    }
  }

  //  CALCUL DES MOYENNES PHASE SIMULATION
  const calculatePhase2Averages = () => {
    if (candidate.availability === 'NON') {
      return {
        sensNegociation: 0,
        capacitePersuasion: 0,
        sensCombativite: 0,
        count: 0,
        allFavorable: false
      }
    }

    const phase2Scores = juryScores.filter(s => s.phase === 2)
    
    if (phase2Scores.length === 0) {
      return {
        sensNegociation: null,
        capacitePersuasion: null,
        sensCombativite: null,
        count: 0,
        allFavorable: false
      }
    }

    const avgNegociation = phase2Scores.reduce((sum, s) => {
      const val = typeof s.simulationSensNegociation === 'number' ? s.simulationSensNegociation : parseFloat(String(s.simulationSensNegociation || 0))
      return sum + val
    }, 0) / phase2Scores.length
    
    const avgPersuasion = phase2Scores.reduce((sum, s) => {
      const val = typeof s.simulationCapacitePersuasion === 'number' ? s.simulationCapacitePersuasion : parseFloat(String(s.simulationCapacitePersuasion || 0))
      return sum + val
    }, 0) / phase2Scores.length
    
    const avgCombativite = phase2Scores.reduce((sum, s) => {
      const val = typeof s.simulationSensCombativite === 'number' ? s.simulationSensCombativite : parseFloat(String(s.simulationSensCombativite || 0))
      return sum + val
    }, 0) / phase2Scores.length

    const allFavorable = phase2Scores.every(s => s.decision === 'FAVORABLE')

    return {
      sensNegociation: avgNegociation,
      capacitePersuasion: avgPersuasion,
      sensCombativite: avgCombativite,
      count: phase2Scores.length,
      allFavorable
    }
  }

  const phase1Avg = calculatePhase1Averages()
  const phase2Avg = calculatePhase2Averages()

  //  VALIDATION PHASE FACE-À-FACE
  const validatePhase1 = () => {
    if (candidate.availability === 'NON') return false

    if (phase1Avg.count === 0) return null

    if (isAgences) {
      return (phase1Avg.presentationVisuelle || 0) >= 3 && 
             (phase1Avg.verbalCommunication || 0) >= 3 && 
             (phase1Avg.voiceQuality || 0) >= 3
    }
    
    if (isReseauxSociaux) {
      // ✅ Pour RESEAUX_SOCIAUX, vérifier aussi l'appétence digitale des jurys
      const appetenceAvg = calculateAppetenceDigitaleAverage()
      console.log('🔍 Validation Phase 1 RESEAUX_SOCIAUX:', {
        voiceQuality: phase1Avg.voiceQuality,
        verbalCommunication: phase1Avg.verbalCommunication,
        appetenceAvg
      })
      
      return (phase1Avg.voiceQuality || 0) >= 3 && 
             (phase1Avg.verbalCommunication || 0) >= 3 &&
             (appetenceAvg || 0) >= 3
    }

    return (phase1Avg.verbalCommunication || 0) >= 3 && 
           (phase1Avg.voiceQuality || 0) >= 3
  }

  //  VALIDATION PHASE SIMULATION
  const validatePhase2 = () => {
    if (candidate.availability === 'NON') return false
    if (!needsSimulation || phase2Avg.count === 0) return null

    return (phase2Avg.sensNegociation || 0) >= 3 && 
           (phase2Avg.capacitePersuasion || 0) >= 3 && 
           (phase2Avg.sensCombativite || 0) >= 3
  }

  //  VALIDATION TESTS TECHNIQUES
  const validateTechnicalTests = () => {
    const failures: string[] = []

    if (candidate.availability === 'NON') {
      return ['Candidat non disponible - tous les tests échoués']
    }

    // Typing
    if (config.criteria.typing?.required) {
      const speed = parseInt(technicalScores.typing_speed)
      const accuracy = parseFloat(technicalScores.typing_accuracy)
      
      if (isNaN(speed) || speed < config.criteria.typing.minSpeed) {
        failures.push(`Vitesse saisie: ${speed || 0} < ${config.criteria.typing.minSpeed}`)
      }
      if (isNaN(accuracy) || accuracy < config.criteria.typing.minAccuracy) {
        failures.push(`Précision: ${accuracy || 0}% < ${config.criteria.typing.minAccuracy}%`)
      }
    }

    // Excel
    if (config.criteria.excel?.required) {
      const excel = parseFloat(technicalScores.excel_test)
      if (isNaN(excel) || excel < config.criteria.excel.minScore) {
        failures.push(`Excel: ${excel || 0} < ${config.criteria.excel.minScore}`)
      }
    }

    // Dictation
    if (config.criteria.dictation?.required) {
      const dictation = parseFloat(technicalScores.dictation)
      if (isNaN(dictation) || dictation < config.criteria.dictation.minScore) {
        failures.push(`Dictée: ${dictation || 0} < ${config.criteria.dictation.minScore}`)
      }
    }

    // Psycho
    if (config.criteria.psycho?.required) {
      const raisonnement = parseFloat(technicalScores.psycho_raisonnement)
      const attention = parseFloat(technicalScores.psycho_attention)
      
      if (isNaN(raisonnement) || raisonnement < config.criteria.psycho.minRaisonnementLogique) {
        failures.push('Raisonnement logique insuffisant')
      }
      if (isNaN(attention) || attention < config.criteria.psycho.minAttentionConcentration) {
        failures.push('Attention/concentration insuffisante')
      }
    }

    // Analysis
    if (config.criteria.analysis?.required) {
      const analysis = parseFloat(technicalScores.analysis_exercise)
      if (isNaN(analysis) || analysis < config.criteria.analysis.minScore) {
        failures.push(`Analyse: ${analysis || 0} < ${config.criteria.analysis.minScore}`)
      }
    }

    return failures
  }

  //  DÉCISION FINALE AUTOMATIQUE
  const calculateFinalDecision = () => {
    if (candidate.availability === 'NON') {
      return { 
        decision: 'NON_RECRUTE' as const, 
        reason: 'Candidat non disponible - Évaluation automatique avec toutes les notes à 0' 
      }
    }

    if (technicalScores.statut === 'ABSENT') {
      return { decision: 'ABSENT' as const, reason: 'Candidat absent' }
    }

    const phase1Valid = validatePhase1()
    if (phase1Valid === false) {
      return { decision: 'NON_RECRUTE' as const, reason: 'Face-à-face non validé' }
    }

    if (phase1Valid === null) {
      return { decision: null, reason: 'En attente des évaluations jurys (Phase 1)' }
    }

    if (needsSimulation) {
      const phase2Valid = validatePhase2()
      if (phase2Valid === false) {
        return { decision: 'NON_RECRUTE' as const, reason: 'Simulation non validée' }
      }
      if (phase2Valid === null) {
        return { decision: null, reason: 'En attente des évaluations jurys (Phase 2)' }
      }
    }

    const technicalFailures = validateTechnicalTests()
    if (technicalFailures.length > 0) {
      return { decision: 'NON_RECRUTE' as const, reason: technicalFailures.join(', ') }
    }

    return { decision: 'RECRUTE' as const, reason: 'Tous les critères validés' }
  }

  const finalDecision = calculateFinalDecision()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      //  Préparer les données en snake_case pour l'API POST
      const scoreData: any = {
        candidateId: candidate.id,
        
        // Phase 1 - TOUJOURS enregistrer (en snake_case)
        voice_quality: candidate.availability === 'NON' ? 0 : (phase1Avg.voiceQuality || 0),
        verbal_communication: candidate.availability === 'NON' ? 0 : (phase1Avg.verbalCommunication || 0),
        presentation_visuelle: candidate.availability === 'NON' && isAgences ? 0 : (phase1Avg.presentationVisuelle || null),
        
        // Phase 2 - TOUJOURS enregistrer si applicable
        ...(needsSimulation && {
          simulation_sens_negociation: candidate.availability === 'NON' ? 0 : (phase2Avg.sensNegociation || 0),
          simulation_capacite_persuasion: candidate.availability === 'NON' ? 0 : (phase2Avg.capacitePersuasion || 0),
          simulation_sens_combativite: candidate.availability === 'NON' ? 0 : (phase2Avg.sensCombativite || 0),
        }),
        
        // Statut et commentaires
        statut: candidate.availability === 'NON' ? 'ABSENT' : technicalScores.statut,
        statut_commentaire: candidate.availability === 'NON' ? 'Candidat non disponible - évaluation automatique' : technicalScores.statut_commentaire || null,
        comments: technicalScores.comments || null,
      }

      //  Déterminer si le candidat peut passer les tests techniques
      const canTakeTechnicalTests = technicalScores.statut === 'PRESENT' && 
                                   candidate.availability === 'OUI' &&
                                   validatePhase1() === true &&
                                   (!needsSimulation || validatePhase2() === true)

      if (canTakeTechnicalTests) {
        // Ajouter les tests techniques (en snake_case)
        if (config.criteria.typing?.required) {
          scoreData.typing_speed = parseInt(technicalScores.typing_speed) || null
          scoreData.typing_accuracy = parseFloat(technicalScores.typing_accuracy) || null
        }
        
        if (config.criteria.excel?.required) {
          scoreData.excel_test = parseFloat(technicalScores.excel_test) || null
        }
        
        if (config.criteria.dictation?.required) {
          scoreData.dictation = parseFloat(technicalScores.dictation) || null
        }
        
        if (config.criteria.psycho?.required) {
          scoreData.psycho_raisonnement_logique = parseFloat(technicalScores.psycho_raisonnement) || null
          scoreData.psycho_attention_concentration = parseFloat(technicalScores.psycho_attention) || null
        }
        
        if (config.criteria.analysis?.required) {
          scoreData.analysis_exercise = parseFloat(technicalScores.analysis_exercise) || null
        }
      } else {
        // Si le candidat ne peut pas passer les tests techniques, mettre les notes à null
        scoreData.typing_speed = null
        scoreData.typing_accuracy = null
        scoreData.excel_test = null
        scoreData.dictation = null
        scoreData.psycho_raisonnement_logique = null
        scoreData.psycho_attention_concentration = null
        scoreData.analysis_exercise = null
      }

      console.log('📤 Envoi données WFM (POST):', scoreData)

      const response = await fetch(`/api/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData),
      })

      if (response.ok) {
        const result = await response.json()
        
        let message = 'Scores enregistrés avec succès!'
        if (candidate.availability === 'NON') {
          message = 'Candidat non disponible - Évaluation automatique enregistrée'
        } else if (finalDecision.decision === 'NON_RECRUTE') {
          message = 'Candidat non recruté - Évaluation enregistrée'
        } else if (!canTakeTechnicalTests) {
          message = 'Phase(s) non validée(s) - Candidat éliminé avant les tests techniques'
        }
        
        alert(message)
        router.refresh()
        router.push('/wfm/scores')
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/*  ALERTE DISPONIBILITÉ */}
      {candidate.availability === 'NON' && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-bold text-red-900">Candidat Non Disponible</h3>
              <p className="text-red-700">
                Ce candidat est automatiquement NON RECRUTÉ.
                Toutes les notes (face-à-face, simulation) seront à 0.
              </p>
              <p className="text-red-700 mt-2 font-medium">
                ⚠️ Décision finale automatique : NON_RECRUTE
              </p>
            </div>
          </div>
        </div>
      )}

      {/*  PHASE FACE-À-FACE */}
      <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Phase Face à Face</h2>
          {candidate.availability === 'NON' && (
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
              Notes: 0 (automatique)
            </span>
          )}
        </div>

        {candidate.availability === 'NON' ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-3">
                Candidat non disponible - Évaluation automatique
              </h3>
              <div className={`grid ${isAgences ? 'grid-cols-3' : isReseauxSociaux ? 'grid-cols-2' : 'grid-cols-2'} gap-4`}>
                {isAgences && (
                  <div className="bg-white rounded-lg p-3 border border-gray-300">
                    <p className="text-sm text-gray-600">Présentation Visuelle</p>
                    <p className="text-2xl font-bold text-red-600">0/5</p>
                    <p className="text-xs text-gray-500">Seuil non atteint</p>
                  </div>
                )}
                <div className="bg-white rounded-lg p-3 border border-gray-300">
                  <p className="text-sm text-gray-600">Communication Verbale</p>
                  <p className="text-2xl font-bold text-red-600">0/5</p>
                  <p className="text-xs text-gray-500">Seuil non atteint</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-300">
                  <p className="text-sm text-gray-600">Qualité de la Voix</p>
                  <p className="text-2xl font-bold text-red-600">0/5</p>
                  <p className="text-xs text-gray-500">Seuil non atteint</p>
                </div>
              </div>
            </div>
          </div>
        ) : phase1Avg.count === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <p className="text-amber-800 font-medium">
                Aucune évaluation jury pour le moment
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Détail des jurys */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-700 mb-3">
                Évaluations individuelles ({phase1Avg.count} jury{phase1Avg.count > 1 ? 's' : ''})
              </h3>
              {juryScores.filter(s => s.phase === 1).map((score) => (
                <div key={score.id} className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {score.juryMember.fullName} ({score.juryMember.roleType})
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                      score.decision === 'FAVORABLE' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {score.decision}
                    </span>
                  </div>
                  <div className={`grid ${isAgences ? 'grid-cols-3' : isReseauxSociaux ? 'grid-cols-3' : 'grid-cols-2'} gap-3 text-sm`}>
                    {isAgences && (
                      <div>
                        <span className="text-gray-600">Présentation Visuelle:</span>
                        <span className="font-semibold ml-2">{score.presentationVisuelle}/5</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Communication Verbale:</span>
                      <span className="font-semibold ml-2">{score.verbalCommunication}/5</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Qualité Vocale:</span>
                      <span className="font-semibold ml-2">{score.voiceQuality}/5</span>
                    </div>
                    {/* Affichage appétence digitale pour information seulement */}
                    {isReseauxSociaux && score.appetenceDigitale !== null && (
                      <div>
                        <span className="text-gray-600">Appétence Digitale:</span>
                        <span className="font-semibold ml-2 text-purple-600">{score.appetenceDigitale}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Moyennes calculées */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-3">Moyennes Calculées Automatiquement</h3>
              <div className={`grid ${isAgences ? 'grid-cols-3' : isReseauxSociaux ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                {isAgences && (
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-sm text-gray-600">Présentation Visuelle</p>
                    <p className={`text-2xl font-bold ${
                      (phase1Avg.presentationVisuelle || 0) >= 3 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {phase1Avg.presentationVisuelle?.toFixed(2)}/5
                    </p>
                    <p className="text-xs text-gray-500">Seuil: ≥ 3/5</p>
                  </div>
                )}
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-sm text-gray-600">Communication Verbale</p>
                  <p className={`text-2xl font-bold ${
                    (phase1Avg.verbalCommunication || 0) >= 3 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {phase1Avg.verbalCommunication?.toFixed(2)}/5
                  </p>
                  <p className="text-xs text-gray-500">Seuil: ≥ 3/5</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-sm text-gray-600">Qualité de la Voix</p>
                  <p className={`text-2xl font-bold ${
                    (phase1Avg.voiceQuality || 0) >= 3 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {phase1Avg.voiceQuality?.toFixed(2)}/5
                  </p>
                  <p className="text-xs text-gray-500">Seuil: ≥ 3/5</p>
                </div>
                
                {/* ✅ Affichage appétence digitale moyenne pour réseaux sociaux - CORRIGÉ */}
                {isReseauxSociaux && (
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <p className="text-sm text-purple-600">Appétence Digitale (moyenne jurys)</p>
                    <p className={`text-2xl font-bold ${
                      (calculateAppetenceDigitaleAverage() || 0) >= 3 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(() => {
                        const avg = calculateAppetenceDigitaleAverage()
                        console.log('🎨 Affichage moyenne appétence:', avg)
                        return avg !== null ? avg.toFixed(2) : 'N/A'
                      })()}/5
                    </p>
                    <p className="text-xs text-gray-500">Seuil: ≥ 3/5</p>
                    {/* ✅ Debug info */}
                    <p className="text-xs text-purple-400 mt-2">
                      ({juryScores.filter(s => s.phase === 1 && s.appetenceDigitale !== null).length} jury(s) avec appétence)
                    </p>
                  </div>
                )}
              </div>

              <div className={`mt-4 p-3 rounded-lg ${
                validatePhase1() ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Décision Phase Face à Face:</span>
                  <span className={`text-lg font-bold flex items-center gap-2 ${
                    validatePhase1() ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {validatePhase1() ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        ADMIS
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        ÉLIMINÉ
                      </>
                    )}
                  </span>
                </div>
                {isReseauxSociaux && (
                  <p className="text-sm text-gray-700 mt-2">
                    Validation inclut: Communication Verbale ≥ 3, Qualité de la Voix ≥ 3, Appétence Digitale ≥ 3
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🔓 INDICATEUR DÉBLOCAGE SIMULATION */}
      {needsSimulation && candidate.availability === 'OUI' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {loadingUnlock ? (
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : unlockStatus?.unlocked ? (
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Unlock className="w-6 h-6 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-6 h-6 text-orange-600" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {loadingUnlock ? 'Vérification...' : 
                   unlockStatus?.unlocked ? '🔓 Simulation Débloquée' : '🔒 Simulation Verrouillée'}
                </h2>
                <p className="text-sm text-gray-600">
                  Conditions pour accéder à la phase Simulation :
                </p>
              </div>
            </div>
            {!loadingUnlock && unlockStatus && (
              <div className={`px-4 py-2 rounded-lg font-bold ${
                unlockStatus.unlocked 
                  ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                  : 'bg-orange-100 text-orange-700 border-2 border-orange-300'
              }`}>
                {unlockStatus.unlocked ? 'DÉBLOQUÉE' : 'VERROUILLÉE'}
              </div>
            )}
          </div>

          {!loadingUnlock && unlockStatus && (
            <div className="space-y-4">
              {/* Barre de progression */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Progression des jurys</span>
                  <span className="font-semibold">
                    {unlockStatus.phase1Decisions.length} jury{unlockStatus.phase1Decisions.length > 1 ? 's' : ''} noté{unlockStatus.phase1Decisions.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      unlockStatus.conditions.allJurysEvaluatedPhase1 ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                    style={{ width: unlockStatus.conditions.allJurysEvaluatedPhase1 ? '100%' : '50%' }}
                  />
                </div>
              </div>

              {/* Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Condition 1 : Tous les jurys ont noté */}
                <div className={`p-3 rounded-lg border ${
                  unlockStatus.conditions.allJurysEvaluatedPhase1 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {unlockStatus.conditions.allJurysEvaluatedPhase1 ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <XCircle className="w-4 h-4 text-orange-600" />
                    }
                    <span className="font-semibold">Tous les jurys ont noté</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {unlockStatus.conditions.allJurysEvaluatedPhase1 ? 
                      '✅ Validé' : 
                      unlockStatus.missingJurys.length > 0 ? 
                      `${unlockStatus.missingJurys.length} jury(s) manquant(s)` : 
                      'En attente de notations'
                    }
                  </p>
                </div>

                {/* Condition 2 : Moyennes ≥ 3/5 */}
                <div className={`p-3 rounded-lg border ${
                  unlockStatus.conditions.allAveragesAboveThreshold 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {unlockStatus.conditions.allAveragesAboveThreshold ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <XCircle className="w-4 h-4 text-orange-600" />
                    }
                    <span className="font-semibold">Moyennes ≥ 3/5</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {unlockStatus.conditions.allAveragesAboveThreshold ? 
                      '✅ Toutes les moyennes validées' : 
                      'Une ou plusieurs moyennes < 3/5'
                    }
                  </p>
                </div>

                {/* Condition 3 : Métier compatible */}
                <div className={`p-3 rounded-lg border bg-green-50 border-green-200`}>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-semibold">Métier compatible</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {candidate.metier === 'AGENCES' ? 'Agences' : 'Télévente'}
                  </p>
                </div>
              </div>

              {/* Détails des moyennes Phase Face à Face */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-3">
                  📊 Moyennes Phase Face à Face (critère décisif)
                </h3>
                <div className={`grid ${candidate.metier === 'AGENCES' ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                  {candidate.metier === 'AGENCES' && unlockStatus.phase1Averages.presentationVisuelle !== null && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Présentation Visuelle</p>
                      <p className={`text-2xl font-bold ${
                        unlockStatus.phase1Averages.presentationVisuelle >= 3 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {unlockStatus.phase1Averages.presentationVisuelle.toFixed(2)}/5
                      </p>
                      <p className="text-xs text-gray-500">Seuil: ≥ 3/5</p>
                    </div>
                  )}
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Communication Verbale</p>
                    <p className={`text-2xl font-bold ${
                      unlockStatus.phase1Averages.verbalCommunication >= 3 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {unlockStatus.phase1Averages.verbalCommunication.toFixed(2)}/5
                    </p>
                    <p className="text-xs text-gray-500">Seuil: ≥ 3/5</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Qualité Vocale</p>
                    <p className={`text-2xl font-bold ${
                      unlockStatus.phase1Averages.voiceQuality >= 3 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {unlockStatus.phase1Averages.voiceQuality.toFixed(2)}/5
                    </p>
                    <p className="text-xs text-gray-500">Seuil: ≥ 3/5</p>
                  </div>
                </div>
              </div>

              {/* Décisions individuelles des jurys (INFORMATIF UNIQUEMENT) */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Décisions individuelles (informatif uniquement)
                </h3>
                <p className="text-xs text-blue-700 mb-3">
                  ℹ️ Ces décisions n'affectent PAS le déblocage de la simulation. Seules les moyennes comptent.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {unlockStatus.phase1Decisions.map((decision: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-white rounded p-2 text-sm">
                      <span className="text-gray-700">{decision.juryMemberName}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        decision.decision === 'FAVORABLE' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {decision.decision}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditions manquantes */}
              {!unlockStatus.unlocked && unlockStatus.missingConditions.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold text-red-900">Conditions manquantes pour débloquer</h3>
                  </div>
                  <ul className="space-y-1">
                    {unlockStatus.missingConditions.map((condition: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-red-700">
                        <span className="mt-1">•</span>
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Message de succès */}
              {unlockStatus.unlocked && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <h3 className="font-bold text-green-900">Simulation débloquée avec succès ! 🎉</h3>
                      <p className="text-sm text-green-700 mt-1">
                        Les jurys peuvent maintenant évaluer ce candidat en Phase Simulation.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PHASE SIMULATION (toujours afficher si applicable, même si échouée) */}
      {needsSimulation && (candidate.availability === 'NON' || candidate.availability === 'OUI') && (
        <div className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎭</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Phase Simulation</h2>
            {candidate.availability === 'NON' && (
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                Notes: 0 (automatique)
              </span>
            )}
          </div>

          {candidate.availability === 'NON' ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Candidat non disponible - Simulation automatique
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-300">
                    <p className="text-sm text-gray-600">Sens Négociation</p>
                    <p className="text-2xl font-bold text-red-600">0/5</p>
                    <p className="text-xs text-gray-500">Seuil non atteint</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-300">
                    <p className="text-sm text-gray-600">Capacité Persuasion</p>
                    <p className="text-2xl font-bold text-red-600">0/5</p>
                    <p className="text-xs text-gray-500">Seuil non atteint</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-300">
                    <p className="text-sm text-gray-600">Sens Combativité</p>
                    <p className="text-2xl font-bold text-red-600">0/5</p>
                    <p className="text-xs text-gray-500">Seuil non atteint</p>
                  </div>
                </div>
              </div>
            </div>
          ) : phase2Avg.count === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <p className="text-amber-800 font-medium">
                  En attente des évaluations de simulation par les jurys
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Détail des jurys Phase Simulation */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Évaluations individuelles ({phase2Avg.count} jury{phase2Avg.count > 1 ? 's' : ''})
                </h3>
                {juryScores.filter(s => s.phase === 2).map((score) => (
                  <div key={score.id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {score.juryMember.fullName} ({score.juryMember.roleType})
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                        score.decision === 'FAVORABLE' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {score.decision}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Sens de Négociation:</span>
                        <span className="font-semibold ml-2">{score.simulationSensNegociation}/5</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Capacité de Persuasion:</span>
                        <span className="font-semibold ml-2">{score.simulationCapacitePersuasion}/5</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Sens de Combativité:</span>
                        <span className="font-semibold ml-2">{score.simulationSensCombativite}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Moyennes Phase Simulation */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <h3 className="font-bold text-green-900 mb-3">Moyennes Calculées Automatiquement</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-sm text-gray-600">Sens Négociation</p>
                    <p className={`text-2xl font-bold ${
                      (phase2Avg.sensNegociation || 0) >= 3 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {phase2Avg.sensNegociation?.toFixed(2)}/5
                    </p>
                    <p className="text-xs text-gray-500">Seuil: ≥ 3/5</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-sm text-gray-600">Capacité Persuasion</p>
                    <p className={`text-2xl font-bold ${
                      (phase2Avg.capacitePersuasion || 0) >= 3 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {phase2Avg.capacitePersuasion?.toFixed(2)}/5
                    </p>
                    <p className="text-xs text-gray-500">Seuil: ≥ 3/5</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-sm text-gray-600">Sens Combativité</p>
                    <p className={`text-2xl font-bold ${
                      (phase2Avg.sensCombativite || 0) >= 3 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {phase2Avg.sensCombativite?.toFixed(2)}/5
                    </p>
                    <p className="text-xs text-gray-500">Seuil: ≥ 3/5</p>
                  </div>
                </div>

                <div className={`mt-4 p-3 rounded-lg ${
                  validatePhase2() ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Décision Phase Simulation:</span>
                    <span className={`text-lg font-bold flex items-center gap-2 ${
                      validatePhase2() ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {validatePhase2() ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          VALIDÉE
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          NON VALIDÉE
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATUT PRÉSENCE/ABSENCE */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Statut du Candidat</h3>
        
        {candidate.availability === 'NON' && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700">
              ⚠️ Candidat non disponible - Statut automatiquement ABSENT
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="PRESENT"
                  checked={technicalScores.statut === 'PRESENT' && candidate.availability !== 'NON'}
                  onChange={(e) => {
                    if (candidate.availability === 'NON') return
                    setTechnicalScores(prev => ({ 
                      ...prev, 
                      statut: e.target.value 
                    }))
                  }}
                  className="w-4 h-4"
                  disabled={candidate.availability === 'NON'}
                />
                <span className={`font-medium ${candidate.availability === 'NON' ? 'text-gray-400' : ''}`}>
                  Présent
                </span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="ABSENT"
                  checked={technicalScores.statut === 'ABSENT' || candidate.availability === 'NON'}
                  onChange={(e) => {
                    if (candidate.availability === 'NON') return
                    setTechnicalScores(prev => ({ 
                      ...prev, 
                      statut: e.target.value 
                    }))
                  }}
                  className="w-4 h-4"
                  disabled={candidate.availability === 'NON'}
                />
                <span className={`font-medium ${candidate.availability === 'NON' ? 'text-gray-400' : ''}`}>
                  Absent
                </span>
              </label>
            </div>
          </div>

          {(technicalScores.statut === 'ABSENT' || candidate.availability === 'NON') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire (obligatoire si absent) *
              </label>
              <textarea
                value={candidate.availability === 'NON' 
                  ? 'Candidat non disponible - évaluation automatique' 
                  : technicalScores.statut_commentaire}
                onChange={(e) => {
                  if (candidate.availability === 'NON') return
                  setTechnicalScores(prev => ({ 
                    ...prev, 
                    statut_commentaire: e.target.value 
                  }))
                }}
                rows={3}
                required
                className={`w-full p-3 border border-gray-300 rounded-lg ${
                  candidate.availability === 'NON' ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder={
                  candidate.availability === 'NON' 
                    ? 'Candidat non disponible - évaluation automatique' 
                    : 'Raison de l\'absence...'
                }
                readOnly={candidate.availability === 'NON'}
              />
            </div>
          )}
        </div>
      </div>

      {/* TESTS TECHNIQUES (affichage conditionnel) */}
      {technicalScores.statut === 'PRESENT' && 
       candidate.availability === 'OUI' &&
       validatePhase1() === true &&
       (!needsSimulation || validatePhase2() === true) ? (
        <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6">Tests Techniques (WFM)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Typing */}
            {config.criteria.typing?.required && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rapidité de Saisie (MPM)
                  </label>
                  <input
                    type="number"
                    value={technicalScores.typing_speed}
                    onChange={(e) => {
                      setTechnicalScores(prev => ({ 
                        ...prev, 
                        typing_speed: e.target.value 
                      }))
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder={`Min: ${config.criteria.typing.minSpeed}`}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Seuil: ≥ {config.criteria.typing.minSpeed} MPM
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Précision (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={technicalScores.typing_accuracy}
                    onChange={(e) => {
                      setTechnicalScores(prev => ({ 
                        ...prev, 
                        typing_accuracy: e.target.value 
                      }))
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder={`Min: ${config.criteria.typing.minAccuracy}%`}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Seuil: ≥ {config.criteria.typing.minAccuracy}%
                  </p>
                </div>
              </>
            )}

            {/* Excel */}
            {config.criteria.excel?.required && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Excel (/5)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={technicalScores.excel_test}
                  onChange={(e) => {
                    setTechnicalScores(prev => ({ 
                      ...prev, 
                      excel_test: e.target.value 
                    }))
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder={`Min: ${config.criteria.excel.minScore}/5`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Seuil: ≥ {config.criteria.excel.minScore}/5
                </p>
              </div>
            )}

            {/* Dictation */}
            {config.criteria.dictation?.required && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dictée (/20)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  value={technicalScores.dictation}
                  onChange={(e) => {
                    setTechnicalScores(prev => ({ 
                      ...prev, 
                      dictation: e.target.value 
                    }))
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder={`Min: ${config.criteria.dictation.minScore}/20`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Seuil: ≥ {config.criteria.dictation.minScore}/20
                </p>
              </div>
            )}

            {/* Psycho */}
            {config.criteria.psycho?.required && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raisonnement Logique (/5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={technicalScores.psycho_raisonnement}
                    onChange={(e) => {
                      setTechnicalScores(prev => ({ 
                        ...prev, 
                        psycho_raisonnement: e.target.value 
                      }))
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Seuil: ≥ {config.criteria.psycho.minRaisonnementLogique}/5
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attention/Concentration (/5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={technicalScores.psycho_attention}
                    onChange={(e) => {
                      setTechnicalScores(prev => ({ 
                        ...prev, 
                        psycho_attention: e.target.value 
                      }))
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Seuil: ≥ {config.criteria.psycho.minAttentionConcentration}/5
                  </p>
                </div>
              </>
            )}

            {/* Analysis */}
            {config.criteria.analysis?.required && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacité d'Analyse (/5)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={technicalScores.analysis_exercise}
                  onChange={(e) => {
                    setTechnicalScores(prev => ({ 
                      ...prev, 
                      analysis_exercise: e.target.value 
                    }))
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Seuil: ≥ {config.criteria.analysis.minScore}/5
                </p>
              </div>
            )}
          </div>

          {/* Validation tests techniques */}
          {validateTechnicalTests().length > 0 && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-bold text-red-900 mb-2">❌ Tests techniques échoués:</h4>
              <ul className="list-disc list-inside text-red-700 space-y-1">
                {validateTechnicalTests().map((failure, idx) => (
                  <li key={idx}>{failure}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : technicalScores.statut === 'PRESENT' && 
        candidate.availability === 'OUI' ? (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <h3 className="font-bold text-amber-900">Tests techniques non accessibles</h3>
              <p className="text-amber-700">
                Ce candidat n'a pas validé les phases précédentes et ne peut donc pas passer les tests techniques.
                Les notes des tests techniques ne seront pas enregistrées.
              </p>
              <p className="text-amber-700 mt-2">
                <strong>Décision finale :</strong> {finalDecision.decision === 'NON_RECRUTE' ? 'NON RECRUTÉ' : 'EN ATTENTE'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* DÉCISION FINALE */}
      <div className={`border-4 rounded-xl p-6 ${
        finalDecision.decision === 'RECRUTE' ? 'bg-green-50 border-green-300' :
        finalDecision.decision === 'NON_RECRUTE' ? 'bg-red-50 border-red-300' :
        'bg-gray-50 border-gray-300'
      }`}>
        <h2 className="text-2xl font-bold mb-4">Décision Finale Automatique</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-700 mb-2">
              <strong>Statut:</strong>
            </p>
            <p className="text-sm text-gray-600">
              {finalDecision.reason}
            </p>
          </div>
          
          <div className={`text-4xl font-bold flex items-center gap-3 ${
            finalDecision.decision === 'RECRUTE' ? 'text-green-600' :
            finalDecision.decision === 'NON_RECRUTE' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {finalDecision.decision === 'RECRUTE' && (
              <>
                <CheckCircle className="w-12 h-12" />
                RECRUTÉ
              </>
            )}
            {finalDecision.decision === 'NON_RECRUTE' && (
              <>
                <XCircle className="w-12 h-12" />
                NON RECRUTÉ
              </>
            )}
            {!finalDecision.decision && (
              <>
                <AlertTriangle className="w-12 h-12" />
                EN ATTENTE
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bouton Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Enregistrement en cours...
          </>
        ) : candidate.availability === 'NON' ? (
          <>
            <CheckCircle className="w-6 h-6" />
            Enregistrer l'Évaluation (Toutes les notes à 0)
          </>
        ) : (
          <>
            <CheckCircle className="w-6 h-6" />
            Enregistrer l'Évaluation Complète
          </>
        )}
      </button>
    </form>
  )
}