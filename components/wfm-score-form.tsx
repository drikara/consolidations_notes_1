'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getMetierConfig } from '@/lib/metier-config'
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

  // ✅ Statut par défaut = ABSENT si déjà marqué absent, sinon PRESENT
  const [technicalScores, setTechnicalScores] = useState({
    typing_speed: existingScores?.typingSpeed?.toString() || '',
    typing_accuracy: existingScores?.typingAccuracy?.toString() || '',
    excel_test: existingScores?.excelTest?.toString() || '',
    dictation: existingScores?.dictation?.toString() || '',
    psycho_raisonnement: existingScores?.psychoRaisonnementLogique?.toString() || '',
    psycho_attention: existingScores?.psychoAttentionConcentration?.toString() || '',
    analysis_exercise: existingScores?.analysisExercise?.toString() || '',
    statut: existingScores?.statut || 'PRESENT',
    statut_commentaire: existingScores?.statutCommentaire || '',
    comments: existingScores?.comments || '',
  })

  const config = getMetierConfig(candidate.metier as any)
  const isAgences = candidate.metier === 'AGENCES'
  const isReseauxSociaux = candidate.metier === 'RESEAUX_SOCIAUX'
  const needsSimulation = candidate.metier === 'AGENCES' || candidate.metier === 'TELEVENTE'

  // ✅ Un candidat absent ne passe aucune évaluation
  const isAbsent = technicalScores.statut === 'ABSENT'

  // --- CORRECTION : Polling intelligent avec setTimeout récursif ---
  useEffect(() => {
    if (isAbsent) return

    let isMounted = true
    let timeoutId: NodeJS.Timeout

    const fetchJuryScores = async () => {
      try {
        const response = await fetch(`/api/candidates/${candidate.id}/jury-scores`)
        if (response.ok && isMounted) {
          const scores = await response.json()
          setJuryScores(scores)
        }
      } catch (error) {
        console.error('Erreur chargement scores jurys:', error)
      }
    }

    const fetchUnlockStatus = async () => {
      if (!needsSimulation) return
      if (!isMounted) return

      setLoadingUnlock(true)
      try {
        const response = await fetch(`/api/candidates/${candidate.id}/simulation-unlock`)
        if (response.ok && isMounted) {
          const status = await response.json()
          setUnlockStatus(status)
        }
      } catch (error) {
        console.error('Erreur chargement statut déblocage:', error)
      } finally {
        if (isMounted) setLoadingUnlock(false)
      }
    }

    const poll = async () => {
      if (!isMounted) return

      // Exécution séquentielle (ou parallèle avec Promise.all)
      await fetchJuryScores()
      await fetchUnlockStatus()

      // Planifier la prochaine vérification après 5 secondes
      timeoutId = setTimeout(poll, 5000)
    }

    // Lancer la première vérification immédiatement
    poll()

    // Nettoyage
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [candidate.id, candidate.metier, isAbsent, needsSimulation])

  // ✅ Calcul appétence digitale (inchangé)
  const calculateAppetenceDigitaleAverage = () => {
    if (isAbsent) return null
    const phase1Scores = juryScores.filter(s => s.phase === 1)
    if (phase1Scores.length === 0) return null
    const scoresWithAppetence = phase1Scores.filter(s => s.appetenceDigitale !== null && s.appetenceDigitale !== undefined)
    if (scoresWithAppetence.length === 0) return null
    const total = scoresWithAppetence.reduce((sum, s) => {
      const value = typeof s.appetenceDigitale === 'number'
        ? s.appetenceDigitale
        : parseFloat(String(s.appetenceDigitale || '0'))
      return sum + value
    }, 0)
    return total / scoresWithAppetence.length
  }

  const calculatePhase1Averages = () => {
    if (isAbsent) return { presentationVisuelle: null, verbalCommunication: null, voiceQuality: null, count: 0, allFavorable: false }

    const phase1Scores = juryScores.filter(s => s.phase === 1)
    if (phase1Scores.length === 0) return { presentationVisuelle: null, verbalCommunication: null, voiceQuality: null, count: 0, allFavorable: false }

    if (isAgences) {
      const avgPresentation = phase1Scores.reduce((sum, s) => sum + (typeof s.presentationVisuelle === 'number' ? s.presentationVisuelle : parseFloat(String(s.presentationVisuelle || 0))), 0) / phase1Scores.length
      const avgVerbal = phase1Scores.reduce((sum, s) => sum + (typeof s.verbalCommunication === 'number' ? s.verbalCommunication : parseFloat(String(s.verbalCommunication || 0))), 0) / phase1Scores.length
      const avgVoice = phase1Scores.reduce((sum, s) => sum + (typeof s.voiceQuality === 'number' ? s.voiceQuality : parseFloat(String(s.voiceQuality || 0))), 0) / phase1Scores.length
      return { presentationVisuelle: avgPresentation, verbalCommunication: avgVerbal, voiceQuality: avgVoice, count: phase1Scores.length, allFavorable: phase1Scores.every(s => s.decision === 'FAVORABLE') }
    } else if (isReseauxSociaux) {
      const avgVerbal = phase1Scores.reduce((sum, s) => sum + (typeof s.verbalCommunication === 'number' ? s.verbalCommunication : parseFloat(String(s.verbalCommunication || 0))), 0) / phase1Scores.length
      const avgVoice = phase1Scores.reduce((sum, s) => sum + (typeof s.voiceQuality === 'number' ? s.voiceQuality : parseFloat(String(s.voiceQuality || 0))), 0) / phase1Scores.length
      return { verbalCommunication: avgVerbal, voiceQuality: avgVoice, presentationVisuelle: null, count: phase1Scores.length, allFavorable: phase1Scores.every(s => s.decision === 'FAVORABLE') }
    } else {
      const avgVerbal = phase1Scores.reduce((sum, s) => sum + (typeof s.verbalCommunication === 'number' ? s.verbalCommunication : parseFloat(String(s.verbalCommunication || 0))), 0) / phase1Scores.length
      const avgVoice = phase1Scores.reduce((sum, s) => sum + (typeof s.voiceQuality === 'number' ? s.voiceQuality : parseFloat(String(s.voiceQuality || 0))), 0) / phase1Scores.length
      return { verbalCommunication: avgVerbal, voiceQuality: avgVoice, presentationVisuelle: null, count: phase1Scores.length, allFavorable: phase1Scores.every(s => s.decision === 'FAVORABLE') }
    }
  }

  const calculatePhase2Averages = () => {
    if (isAbsent) return { sensNegociation: null, capacitePersuasion: null, sensCombativite: null, count: 0, allFavorable: false }
    const phase2Scores = juryScores.filter(s => s.phase === 2)
    if (phase2Scores.length === 0) return { sensNegociation: null, capacitePersuasion: null, sensCombativite: null, count: 0, allFavorable: false }
    const avgNegociation = phase2Scores.reduce((sum, s) => sum + (typeof s.simulationSensNegociation === 'number' ? s.simulationSensNegociation : parseFloat(String(s.simulationSensNegociation || 0))), 0) / phase2Scores.length
    const avgPersuasion = phase2Scores.reduce((sum, s) => sum + (typeof s.simulationCapacitePersuasion === 'number' ? s.simulationCapacitePersuasion : parseFloat(String(s.simulationCapacitePersuasion || 0))), 0) / phase2Scores.length
    const avgCombativite = phase2Scores.reduce((sum, s) => sum + (typeof s.simulationSensCombativite === 'number' ? s.simulationSensCombativite : parseFloat(String(s.simulationSensCombativite || 0))), 0) / phase2Scores.length
    return { sensNegociation: avgNegociation, capacitePersuasion: avgPersuasion, sensCombativite: avgCombativite, count: phase2Scores.length, allFavorable: phase2Scores.every(s => s.decision === 'FAVORABLE') }
  }

  const phase1Avg = calculatePhase1Averages()
  const phase2Avg = calculatePhase2Averages()

  const validatePhase1 = () => {
    if (isAbsent) return false
    if (phase1Avg.count === 0) return null
    if (isAgences) return (phase1Avg.presentationVisuelle || 0) >= 3 && (phase1Avg.verbalCommunication || 0) >= 3 && (phase1Avg.voiceQuality || 0) >= 3
    if (isReseauxSociaux) {
      const appetenceAvg = calculateAppetenceDigitaleAverage()
      return (phase1Avg.voiceQuality || 0) >= 3 && (phase1Avg.verbalCommunication || 0) >= 3 && (appetenceAvg || 0) >= 3
    }
    return (phase1Avg.verbalCommunication || 0) >= 3 && (phase1Avg.voiceQuality || 0) >= 3
  }

  const validatePhase2 = () => {
    if (isAbsent) return false
    if (!needsSimulation || phase2Avg.count === 0) return null
    return (phase2Avg.sensNegociation || 0) >= 3 && (phase2Avg.capacitePersuasion || 0) >= 3 && (phase2Avg.sensCombativite || 0) >= 3
  }

  const validateTechnicalTests = () => {
    const failures: string[] = []
    if (isAbsent) return failures

    if (config.criteria.typing?.required) {
      const speed = parseInt(technicalScores.typing_speed)
      const accuracy = parseFloat(technicalScores.typing_accuracy)
      if (isNaN(speed) || speed < config.criteria.typing.minSpeed) failures.push(`Vitesse saisie: ${speed || 0} < ${config.criteria.typing.minSpeed}`)
      if (isNaN(accuracy) || accuracy < config.criteria.typing.minAccuracy) failures.push(`Précision: ${accuracy || 0}% < ${config.criteria.typing.minAccuracy}%`)
    }
    if (config.criteria.excel?.required) {
      const excel = parseFloat(technicalScores.excel_test)
      if (isNaN(excel) || excel < config.criteria.excel.minScore) failures.push(`Excel: ${excel || 0} < ${config.criteria.excel.minScore}`)
    }
    if (config.criteria.dictation?.required) {
      const dictation = parseFloat(technicalScores.dictation)
      if (isNaN(dictation) || dictation < config.criteria.dictation.minScore) failures.push(`Dictée: ${dictation || 0} < ${config.criteria.dictation.minScore}`)
    }
    if (config.criteria.psycho?.required) {
      const raisonnement = parseFloat(technicalScores.psycho_raisonnement)
      const attention = parseFloat(technicalScores.psycho_attention)
      if (isNaN(raisonnement) || raisonnement < config.criteria.psycho.minRaisonnementLogique) failures.push('Raisonnement logique insuffisant')
      if (isNaN(attention) || attention < config.criteria.psycho.minAttentionConcentration) failures.push('Attention/concentration insuffisante')
    }
    if (config.criteria.analysis?.required) {
      const analysis = parseFloat(technicalScores.analysis_exercise)
      if (isNaN(analysis) || analysis < config.criteria.analysis.minScore) failures.push(`Analyse: ${analysis || 0} < ${config.criteria.analysis.minScore}`)
    }
    return failures
  }

  // ✅ DÉCISION FINALE : ABSENT si statut ABSENT (pas NON_RECRUTE)
  const calculateFinalDecision = () => {
    if (isAbsent) {
      return {
        decision: 'ABSENT' as const,
        reason: 'Candidat absent — toutes les notes sont N/A'
      }
    }

    const phase1Valid = validatePhase1()
    if (phase1Valid === false) return { decision: 'NON_RECRUTE' as const, reason: 'Face-à-face non validé' }
    if (phase1Valid === null) return { decision: null, reason: 'En attente des évaluations jurys (Phase 1)' }

    if (needsSimulation) {
      const phase2Valid = validatePhase2()
      if (phase2Valid === false) return { decision: 'NON_RECRUTE' as const, reason: 'Simulation non validée' }
      if (phase2Valid === null) return { decision: null, reason: 'En attente des évaluations jurys (Phase 2)' }
    }

    const technicalFailures = validateTechnicalTests()
    if (technicalFailures.length > 0) return { decision: 'NON_RECRUTE' as const, reason: technicalFailures.join(', ') }

    return { decision: 'RECRUTE' as const, reason: 'Tous les critères validés' }
  }

  const finalDecision = calculateFinalDecision()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const appetenceDigitaleAverage = isReseauxSociaux ? calculateAppetenceDigitaleAverage() : null

      // ✅ Si ABSENT → toutes les notes à null, finalDecision = 'NON_RECRUTE' (enum Prisma)
      //    On stocke l'info via statut = 'ABSENT'
      if (isAbsent) {
        const absentData: any = {
          candidateId: candidate.id,
          statut: 'ABSENT',
          statut_commentaire: technicalScores.statut_commentaire || 'Candidat absent',
          comments: technicalScores.comments || null,

          // ✅ Toutes les notes à null
          voice_quality: null,
          verbal_communication: null,
          presentation_visuelle: null,
          appetence_digitale: null,
          simulation_sens_negociation: null,
          simulation_capacite_persuasion: null,
          simulation_sens_combativite: null,
          typing_speed: null,
          typing_accuracy: null,
          excel_test: null,
          dictation: null,
          psycho_raisonnement_logique: null,
          psycho_attention_concentration: null,
          analysis_exercise: null,

          // ✅ CORRECTION : final_decision = null pour ABSENT
          phase1_ff_decision: null,
          decision_test: null,
          final_decision: null,
        }

        console.log('📤 Envoi données ABSENT:', absentData)

        const response = await fetch(`/api/scores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(absentData),
        })

        if (response.ok) {
          alert('Candidat absent — enregistrement effectué (toutes les notes sont N/A)')
          router.refresh()
          router.push('/wfm/scores')
        } else {
          const error = await response.json()
          alert(`Erreur: ${error.error}`)
        }
        return
      }

      // ── Candidat présent : logique existante ──────────────────────────────
      const scoreData: any = {
        candidateId: candidate.id,
        voice_quality: phase1Avg.voiceQuality || 0,
        verbal_communication: phase1Avg.verbalCommunication || 0,
        presentation_visuelle: phase1Avg.presentationVisuelle || null,
        appetence_digitale: isReseauxSociaux ? appetenceDigitaleAverage : null,
        ...(needsSimulation && {
          simulation_sens_negociation: phase2Avg.sensNegociation || 0,
          simulation_capacite_persuasion: phase2Avg.capacitePersuasion || 0,
          simulation_sens_combativite: phase2Avg.sensCombativite || 0,
        }),
        statut: 'PRESENT',
        statut_commentaire: technicalScores.statut_commentaire || null,
        comments: technicalScores.comments || null,
      }

      const canTakeTechnicalTests =
        validatePhase1() === true &&
        (!needsSimulation || validatePhase2() === true)

      if (canTakeTechnicalTests) {
        if (config.criteria.typing?.required) {
          scoreData.typing_speed = parseInt(technicalScores.typing_speed) || null
          scoreData.typing_accuracy = parseFloat(technicalScores.typing_accuracy) || null
        }
        if (config.criteria.excel?.required) scoreData.excel_test = parseFloat(technicalScores.excel_test) || null
        if (config.criteria.dictation?.required) scoreData.dictation = parseFloat(technicalScores.dictation) || null
        if (config.criteria.psycho?.required) {
          scoreData.psycho_raisonnement_logique = parseFloat(technicalScores.psycho_raisonnement) || null
          scoreData.psycho_attention_concentration = parseFloat(technicalScores.psycho_attention) || null
        }
        if (config.criteria.analysis?.required) scoreData.analysis_exercise = parseFloat(technicalScores.analysis_exercise) || null
      } else {
        scoreData.typing_speed = null
        scoreData.typing_accuracy = null
        scoreData.excel_test = null
        scoreData.dictation = null
        scoreData.psycho_raisonnement_logique = null
        scoreData.psycho_attention_concentration = null
        scoreData.analysis_exercise = null
      }

      const response = await fetch(`/api/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData),
      })

      if (response.ok) {
        let message = 'Scores enregistrés avec succès!'
        if (finalDecision.decision === 'NON_RECRUTE') message = 'Candidat non recruté — évaluation enregistrée'
        else if (!canTakeTechnicalTests) message = 'Phase(s) non validée(s) — candidat éliminé avant les tests techniques'
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

      {/* ─── BLOC STATUT PRÉSENCE/ABSENCE ─── */}
      {/* Placé EN PREMIER pour que la sélection ABSENT masque tout le reste */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Statut de présence du candidat</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut *</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="PRESENT"
                  checked={technicalScores.statut === 'PRESENT'}
                  onChange={() => setTechnicalScores(prev => ({ ...prev, statut: 'PRESENT', statut_commentaire: '' }))}
                  className="w-4 h-4 accent-green-600"
                />
                <span className="font-medium text-green-700">Présent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="ABSENT"
                  checked={technicalScores.statut === 'ABSENT'}
                  onChange={() => setTechnicalScores(prev => ({ ...prev, statut: 'ABSENT' }))}
                  className="w-4 h-4 accent-red-600"
                />
                <span className="font-medium text-red-700">Absent</span>
              </label>
            </div>
          </div>

          {isAbsent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif d'absence <span className="text-red-500">*</span>
              </label>
              <textarea
                value={technicalScores.statut_commentaire}
                onChange={(e) => setTechnicalScores(prev => ({ ...prev, statut_commentaire: e.target.value }))}
                rows={3}
                required
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Raison de l'absence..."
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── BLOC ABSENT : résumé visuel et décision ─── */}
      {isAbsent && (
        <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-gray-500" />
            <div>
              <h3 className="font-bold text-gray-700">Candidat Absent</h3>
              <p className="text-gray-500 text-sm">
                Toutes les notes sont <strong>N/A</strong>. La décision finale sera <strong>NON RECRUTÉ</strong> (absent).
              </p>
            </div>
          </div>

          {/* Tableau récapitulatif N/A */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-600 mb-3 text-sm uppercase tracking-wide">Récapitulatif des notes</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {[
                'Face-à-Face',
                ...(needsSimulation ? ['Simulation'] : []),
                'Tests Techniques',
              ].map(label => (
                <div key={label} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-bold text-gray-400">N/A</span>
                </div>
              ))}
            </div>
          </div>

          {/* Commentaires globaux */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaires généraux (optionnel)
            </label>
            <textarea
              value={technicalScores.comments}
              onChange={(e) => setTechnicalScores(prev => ({ ...prev, comments: e.target.value }))}
              rows={2}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Notes complémentaires..."
            />
          </div>
        </div>
      )}

      {/* ─── TOUT LE RESTE : affiché uniquement si PRÉSENT ─── */}
      {!isAbsent && (
        <>
          {/* PHASE FACE-À-FACE */}
          <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Phase Face à Face</h2>
            </div>

            {phase1Avg.count === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <p className="text-amber-800 font-medium">Aucune évaluation jury pour le moment</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Détail jurys */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Évaluations individuelles ({phase1Avg.count} jury{phase1Avg.count > 1 ? 's' : ''})
                  </h3>
                  {juryScores.filter(s => s.phase === 1).map((score) => (
                    <div key={score.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{score.juryMember.fullName} ({score.juryMember.roleType})</span>
                        <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${score.decision === 'FAVORABLE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{score.decision}</span>
                      </div>
                      <div className={`grid ${isAgences ? 'grid-cols-3' : isReseauxSociaux ? 'grid-cols-3' : 'grid-cols-2'} gap-3 text-sm`}>
                        {isAgences && <div><span className="text-gray-600">Présentation Visuelle:</span><span className="font-semibold ml-2">{score.presentationVisuelle}/5</span></div>}
                        <div><span className="text-gray-600">Communication Verbale:</span><span className="font-semibold ml-2">{score.verbalCommunication}/5</span></div>
                        <div><span className="text-gray-600">Qualité Vocale:</span><span className="font-semibold ml-2">{score.voiceQuality}/5</span></div>
                        {isReseauxSociaux && score.appetenceDigitale !== null && (
                          <div><span className="text-gray-600">Appétence Digitale:</span><span className="font-semibold ml-2 text-purple-600">{score.appetenceDigitale}/5</span></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Moyennes */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-3">Moyennes Obtenues</h3>
                  <div className={`grid ${isAgences ? 'grid-cols-3' : isReseauxSociaux ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                    {isAgences && (
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <p className="text-sm text-gray-600">Présentation Visuelle</p>
                        <p className={`text-2xl font-bold ${(phase1Avg.presentationVisuelle || 0) >= 3 ? 'text-green-600' : 'text-red-600'}`}>{phase1Avg.presentationVisuelle?.toFixed(2)}/5</p>
                        <p className="text-xs text-gray-500">Seuil: ≥ 3/5</p>
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-sm text-gray-600">Communication Verbale</p>
                      <p className={`text-2xl font-bold ${(phase1Avg.verbalCommunication || 0) >= 3 ? 'text-green-600' : 'text-red-600'}`}>{phase1Avg.verbalCommunication?.toFixed(2)}/5</p>
                      <p className="text-xs text-gray-500">Seuil: ≥ 3/5</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-sm text-gray-600">Qualité de la Voix</p>
                      <p className={`text-2xl font-bold ${(phase1Avg.voiceQuality || 0) >= 3 ? 'text-green-600' : 'text-red-600'}`}>{phase1Avg.voiceQuality?.toFixed(2)}/5</p>
                      <p className="text-xs text-gray-500">Seuil: ≥ 3/5</p>
                    </div>
                    {isReseauxSociaux && (
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <p className="text-sm text-purple-600">Appétence Digitale (moy. jurys)</p>
                        <p className={`text-2xl font-bold ${(calculateAppetenceDigitaleAverage() || 0) >= 3 ? 'text-green-600' : 'text-red-600'}`}>
                          {calculateAppetenceDigitaleAverage()?.toFixed(2) ?? 'N/A'}/5
                        </p>
                        <p className="text-xs text-gray-500">Seuil: ≥ 3/5</p>
                      </div>
                    )}
                  </div>
                  <div className={`mt-4 p-3 rounded-lg ${validatePhase1() ? 'bg-green-100' : 'bg-red-100'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Décision Phase Face à Face:</span>
                      <span className={`text-lg font-bold flex items-center gap-2 ${validatePhase1() ? 'text-green-700' : 'text-red-700'}`}>
                        {validatePhase1() ? <><CheckCircle className="w-5 h-5" />ADMIS</> : <><XCircle className="w-5 h-5" />ÉLIMINÉ</>}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INDICATEUR DÉBLOCAGE SIMULATION */}
          {/* {needsSimulation && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                {loadingUnlock ? (
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : unlockStatus?.unlocked ? (
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Unlock className="w-6 h-6 text-green-600" /></div>
                ) : (
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><Lock className="w-6 h-6 text-orange-600" /></div>
                )}
                {/* <h2 className="text-xl font-bold text-gray-900">
                  // {loadingUnlock ? 'Vérification...' : unlockStatus?.unlocked ? '🔓 Bienveenenue à l' : '🔒 Simulation Verrouillée'}
                </h2>
               </div>
              {/* Contenu du bloc unlock inchangé — gardé pour brièveté */}
              {/* {!loadingUnlock && unlockStatus && (
                <div>
                  {unlockStatus.unlocked ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="font-bold text-green-900">Simulation  ! Les jurys peuvent évaluer la Phase 2.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-orange-700 font-medium">En attente de validation des conditions de déblocage.</p>
                      {unlockStatus.missingConditions?.length > 0 && (
                        <ul className="mt-2 space-y-1 text-orange-700 text-sm list-disc list-inside">
                          {unlockStatus.missingConditions.map((c: string, i: number) => <li key={i}>{c}</li>)}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}   */}

          {/* PHASE SIMULATION */}
          {needsSimulation && (
            <div className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><span className="text-2xl">🎭</span></div>
                <h2 className="text-xl font-bold text-gray-900">Phase Simulation</h2>
              </div>

              {phase2Avg.count === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <p className="text-amber-800 font-medium">En attente des évaluations de simulation par les jurys</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {juryScores.filter(s => s.phase === 2).map((score) => (
                      <div key={score.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{score.juryMember.fullName}</span>
                          <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${score.decision === 'FAVORABLE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{score.decision}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div><span className="text-gray-600">Négociation:</span><span className="font-semibold ml-2">{score.simulationSensNegociation}/5</span></div>
                          <div><span className="text-gray-600">Persuasion:</span><span className="font-semibold ml-2">{score.simulationCapacitePersuasion}/5</span></div>
                          <div><span className="text-gray-600">Combativité:</span><span className="font-semibold ml-2">{score.simulationSensCombativite}/5</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Sens Négociation', val: phase2Avg.sensNegociation },
                        { label: 'Capacité Persuasion', val: phase2Avg.capacitePersuasion },
                        { label: 'Sens Combativité', val: phase2Avg.sensCombativite },
                      ].map(({ label, val }) => (
                        <div key={label} className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="text-sm text-gray-600">{label}</p>
                          <p className={`text-2xl font-bold ${(val || 0) >= 3 ? 'text-green-600' : 'text-red-600'}`}>{val?.toFixed(2)}/5</p>
                          <p className="text-xs text-gray-500">Seuil: ≥ 3/5</p>
                        </div>
                      ))}
                    </div>
                    <div className={`mt-4 p-3 rounded-lg ${validatePhase2() ? 'bg-green-100' : 'bg-red-100'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Décision Phase Simulation:</span>
                        <span className={`text-lg font-bold flex items-center gap-2 ${validatePhase2() ? 'text-green-700' : 'text-red-700'}`}>
                          {validatePhase2() ? <><CheckCircle className="w-5 h-5" />VALIDÉE</> : <><XCircle className="w-5 h-5" />NON VALIDÉE</>}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TESTS TECHNIQUES */}
          {validatePhase1() === true && (!needsSimulation || validatePhase2() === true) ? (
            <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6">Tests Techniques (WFM)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {config.criteria.typing?.required && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rapidité de Saisie (MPM)</label>
                      <input type="number" value={technicalScores.typing_speed} onChange={(e) => setTechnicalScores(prev => ({ ...prev, typing_speed: e.target.value }))} className="w-full p-3 border border-gray-300 rounded-lg" placeholder={`Min: ${config.criteria.typing.minSpeed}`} required />
                      <p className="text-xs text-gray-500 mt-1">Seuil: ≥ {config.criteria.typing.minSpeed} MPM</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Précision (%)</label>
                      <input type="number" step="0.01" value={technicalScores.typing_accuracy} onChange={(e) => setTechnicalScores(prev => ({ ...prev, typing_accuracy: e.target.value }))} className="w-full p-3 border border-gray-300 rounded-lg" placeholder={`Min: ${config.criteria.typing.minAccuracy}%`} required />
                      <p className="text-xs text-gray-500 mt-1">Seuil: ≥ {config.criteria.typing.minAccuracy}%</p>
                    </div>
                  </>
                )}
                {config.criteria.excel?.required && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Excel (/5)</label>
                    <input type="number" step="0.1" min="0" max="5" value={technicalScores.excel_test} onChange={(e) => setTechnicalScores(prev => ({ ...prev, excel_test: e.target.value }))} className="w-full p-3 border border-gray-300 rounded-lg" required />
                    <p className="text-xs text-gray-500 mt-1">Seuil: ≥ {config.criteria.excel.minScore}/5</p>
                  </div>
                )}
                {config.criteria.dictation?.required && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dictée (/20)</label>
                    <input type="number" step="0.5" min="0" max="20" value={technicalScores.dictation} onChange={(e) => setTechnicalScores(prev => ({ ...prev, dictation: e.target.value }))} className="w-full p-3 border border-gray-300 rounded-lg" required />
                    <p className="text-xs text-gray-500 mt-1">Seuil: ≥ {config.criteria.dictation.minScore}/20</p>
                  </div>
                )}
                {config.criteria.psycho?.required && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Raisonnement Logique (/5)</label>
                      <input type="number" step="0.1" min="0" max="5" value={technicalScores.psycho_raisonnement} onChange={(e) => setTechnicalScores(prev => ({ ...prev, psycho_raisonnement: e.target.value }))} className="w-full p-3 border border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Attention/Concentration (/5)</label>
                      <input type="number" step="0.1" min="0" max="5" value={technicalScores.psycho_attention} onChange={(e) => setTechnicalScores(prev => ({ ...prev, psycho_attention: e.target.value }))} className="w-full p-3 border border-gray-300 rounded-lg" required />
                    </div>
                  </>
                )}
                {config.criteria.analysis?.required && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacité d'Analyse (/5)</label>
                    <input type="number" step="0.1" min="0" max="5" value={technicalScores.analysis_exercise} onChange={(e) => setTechnicalScores(prev => ({ ...prev, analysis_exercise: e.target.value }))} className="w-full p-3 border border-gray-300 rounded-lg" required />
                  </div>
                )}
              </div>
              {validateTechnicalTests().length > 0 && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-bold text-red-900 mb-2">❌ Tests techniques échoués:</h4>
                  <ul className="list-disc list-inside text-red-700 space-y-1">
                    {validateTechnicalTests().map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : validatePhase1() !== null && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <div>
                  <h3 className="font-bold text-amber-900">Tests techniques non accessibles</h3>
                  <p className="text-amber-700">Ce candidat n'a pas validé les phases précédentes.</p>
                </div>
              </div>
            </div>
          )}

          {/* Commentaires généraux */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Commentaires Généraux</label>
            <textarea
              value={technicalScores.comments}
              onChange={(e) => setTechnicalScores(prev => ({ ...prev, comments: e.target.value }))}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Observations complémentaires..."
            />
          </div>
        </>
      )}

      {/* ─── DÉCISION FINALE ─── */}
      <div className={`border-4 rounded-xl p-6 ${
        finalDecision.decision === 'RECRUTE' ? 'bg-green-50 border-green-300' :
        finalDecision.decision === 'NON_RECRUTE' ? 'bg-red-50 border-red-300' :
        finalDecision.decision === 'ABSENT' ? 'bg-gray-100 border-gray-400' :
        'bg-gray-50 border-gray-300'
      }`}>
        <h2 className="text-2xl font-bold mb-4">Décision Finale </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-700 mb-2"><strong>Statut:</strong></p>
            <p className="text-sm text-gray-600">{finalDecision.reason}</p>
          </div>
          <div className={`text-4xl font-bold flex items-center gap-3 ${
            finalDecision.decision === 'RECRUTE' ? 'text-green-600' :
            finalDecision.decision === 'NON_RECRUTE' ? 'text-red-600' :
            finalDecision.decision === 'ABSENT' ? 'text-gray-500' :
            'text-gray-600'
          }`}>
            {finalDecision.decision === 'RECRUTE' && <><CheckCircle className="w-12 h-12" />RECRUTÉ</>}
            {finalDecision.decision === 'NON_RECRUTE' && <><XCircle className="w-12 h-12" />NON RECRUTÉ</>}
            {finalDecision.decision === 'ABSENT' && <><AlertCircle className="w-12 h-12" />ABSENT</>}
            {!finalDecision.decision && <><AlertTriangle className="w-12 h-12" />EN ATTENTE</>}
          </div>
        </div>
      </div>

      {/* ─── BOUTON SUBMIT ─── */}
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
        ) : isAbsent ? (
          <>
            <CheckCircle className="w-6 h-6" />
            Enregistrer — Candidat Absent (notes N/A)
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