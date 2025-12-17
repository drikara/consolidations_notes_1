// components/jury-score-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface JuryScoreFormProps {
  candidate: {
    id: number
    fullName: string
    metier: string
  }
  juryMember: {
    id: number
    fullName: string
    roleType: string
  }
  phase1Complete: boolean
  canDoPhase2: boolean
}

//  Composant de notation par boutons (0 à 5)
function ScoreButtons({ 
  value, 
  onChange, 
  label, 
  description 
}: { 
  value: number | null
  onChange: (score: number) => void
  label: string
  description: string
}) {
  const scores = [0, 1, 2, 3, 4, 5]
  
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label} *
      </label>
      
      {/* Boutons de notation */}
      <div className="flex gap-2">
        {scores.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-lg transition-all duration-200 ${
              value === score
                ? score >= 3
                  ? 'bg-green-600 text-white shadow-lg scale-105'
                  : 'bg-red-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-102'
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      
      {/* Description du critère */}
      <div className={`p-3 rounded-lg ${
        value !== null && value >= 3 ? 'bg-green-50' : 'bg-blue-50'
      }`}>
        <p className={`text-xs font-medium ${
          value !== null && value >= 3 ? 'text-green-700' : 'text-blue-700'
        }`}>
          {description}
        </p>
      </div>
      
      {/* Score sélectionné */}
      {value !== null && (
        <div className={`text-center p-2 rounded-lg ${
          value >= 3 ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <span className={`font-bold ${
            value >= 3 ? 'text-green-700' : 'text-red-700'
          }`}>
            Score: {value}/5 {value >= 3 ? '✅' : '❌'}
          </span>
        </div>
      )}
    </div>
  )
}

export function JuryScoreForm({ 
  candidate, 
  juryMember, 
  phase1Complete,
  canDoPhase2 
}: JuryScoreFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activePhase, setActivePhase] = useState<1 | 2>(1)
  
  // PHASE  Face-à-Face 
  const [phase1Scores, setPhase1Scores] = useState({
    presentation_visuelle: null as number | null,
    verbal_communication: null as number | null,
    voice_quality: null as number | null,
    comments: '',
  })
  
  // PHASE  Simulation
  const [phase2Scores, setPhase2Scores] = useState({
    sens_negociation: null as number | null,
    capacite_persuasion: null as number | null,
    sens_combativite: null as number | null,
    comments: '',
  })

  // Chargement des scores existants
  useEffect(() => {
    const loadExistingScores = async () => {
      try {
        const response = await fetch(`/api/jury/scores?candidateId=${candidate.id}`)
        if (response.ok) {
          const scores = await response.json()
          
          const phase1Score = scores.find((s: any) => s.phase === 1)
          if (phase1Score) {
            setPhase1Scores({
              presentation_visuelle: phase1Score.presentationVisuelle || null,
              verbal_communication: phase1Score.verbalCommunication || null,
              voice_quality: phase1Score.voiceQuality || null,
              comments: phase1Score.comments || '',
            })
          }
          
          const phase2Score = scores.find((s: any) => s.phase === 2)
          if (phase2Score) {
            setPhase2Scores({
              sens_negociation: phase2Score.simulationSensNegociation || null,
              capacite_persuasion: phase2Score.simulationCapacitePersuasion || null,
              sens_combativite: phase2Score.simulationSensCombativite || null,
              comments: phase2Score.comments || '',
            })
          }
        }
      } catch (error) {
        console.error('Erreur chargement scores:', error)
      }
    }

    loadExistingScores()
  }, [candidate.id])

  const isAgences = candidate.metier === 'AGENCES'
  const needsSimulation = candidate.metier === 'AGENCES' || candidate.metier === 'TELEVENTE'

  // Validation PHASE Face à Face
  const validatePhase1 = () => {
    if (phase1Scores.verbal_communication === null || phase1Scores.voice_quality === null) {
      return false
    }
    
    if (isAgences) {
      if (phase1Scores.presentation_visuelle === null) return false
      return phase1Scores.presentation_visuelle >= 3 && 
             phase1Scores.verbal_communication >= 3 && 
             phase1Scores.voice_quality >= 3
    }
    
    return phase1Scores.verbal_communication >= 3 && phase1Scores.voice_quality >= 3
  }

  // Validation PHASE Simulation
  const validatePhase2 = () => {
    if (phase2Scores.sens_negociation === null || 
        phase2Scores.capacite_persuasion === null || 
        phase2Scores.sens_combativite === null) {
      return false
    }
    
    return phase2Scores.sens_negociation >= 3 && 
           phase2Scores.capacite_persuasion >= 3 && 
           phase2Scores.sens_combativite >= 3
  }

  // Vérifier si tous les champs Phase 1 sont remplis
  const isPhase1Complete = () => {
    if (isAgences) {
      return phase1Scores.presentation_visuelle !== null &&
             phase1Scores.verbal_communication !== null &&
             phase1Scores.voice_quality !== null
    }
    return phase1Scores.verbal_communication !== null &&
           phase1Scores.voice_quality !== null
  }

  // Vérifier si tous les champs Phase Simulation sont remplis
  const isPhase2Complete = () => {
    return phase2Scores.sens_negociation !== null &&
           phase2Scores.capacite_persuasion !== null &&
           phase2Scores.sens_combativite !== null
  }

  const handleSubmitPhase1 = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isPhase1Complete()) {
      alert('Veuillez noter tous les critères')
      return
    }
    
    // Vérification session active
    try {
      const sessionCheck = await fetch(`/api/jury/check-session/${candidate.id}`)
      const sessionData = await sessionCheck.json()
      
      if (!sessionData.canEvaluate) {
        alert(`La session est ${sessionData.sessionStatus}. Vous ne pouvez plus évaluer.`)
        return
      }
    } catch (error) {
      console.error('Erreur vérification session:', error)
      alert('Erreur de vérification de la session.')
      return
    }
    
    setLoading(true)

    const decision = validatePhase1() ? 'FAVORABLE' : 'DEFAVORABLE'

    const scoreData = {
      candidate_id: candidate.id,
      phase: 1,
      verbal_communication: phase1Scores.verbal_communication!,
      voice_quality: phase1Scores.voice_quality!,
      ...(isAgences && { 
        presentation_visuelle: phase1Scores.presentation_visuelle!
      }),
      decision: decision,
      comments: phase1Scores.comments || null
    }

    console.log('📤 Envoi Phase 1:', scoreData)

    try {
      const response = await fetch('/api/jury/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Phase 1 sauvegardée:', result)
        
        alert(`Phase 1 sauvegardée avec succès!\nDécision: ${decision}`)
        router.refresh()
        
        if (needsSimulation && decision === 'FAVORABLE') {
          const goToPhase2 = confirm('Phase 1 validée ! Voulez-vous passer à la Phase 2 (Simulation) ?')
          if (goToPhase2) {
            setActivePhase(2)
          }
        }
      } else {
        const error = await response.json()
        console.error('❌ Erreur:', error)
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPhase2 = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // VÉRIFICATION AJOUTÉE : Bloquer l'accès si canDoPhase2 = false
    if (!canDoPhase2) {
      alert('⚠️ La simulation n\'est pas encore débloquée. Tous les jurys doivent avoir évalué la Phase 1 avec des notes favorables.')
      return
    }
    
    if (!isPhase2Complete()) {
      alert('Veuillez noter tous les critères')
      return
    }
    
    setLoading(true)

    const decision = validatePhase2() ? 'FAVORABLE' : 'DEFAVORABLE'

    const scoreData = {
      candidate_id: candidate.id,
      phase: 2,
      simulation_sens_negociation: phase2Scores.sens_negociation!,
      simulation_capacite_persuasion: phase2Scores.capacite_persuasion!,
      simulation_sens_combativite: phase2Scores.sens_combativite!,
      decision: decision,
      comments: phase2Scores.comments || null
    }

    console.log('📤 Envoi Phase 2:', scoreData)

    try {
      const response = await fetch('/api/jury/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Phase 2 sauvegardée:', result)
        alert(`Phase 2 sauvegardée avec succès!\nDécision: ${decision}`)
        router.refresh()
        router.push('/jury/evaluations')
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{candidate.fullName}</h1>
            <p className="text-blue-600 font-medium">{candidate.metier}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Jury: {juryMember.fullName}</p>
            <p className="text-sm text-gray-500">{juryMember.roleType}</p>
          </div>
        </div>
      </div>

      {/* Navigation Phase 1 / Phase 2 */}
      {needsSimulation && (
        <div className="flex gap-4 bg-white p-2 rounded-xl border border-gray-200">
          <button
            onClick={() => setActivePhase(1)}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activePhase === 1
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Phase Face à Face
            {phase1Complete && <span className="ml-2">✅</span>}
          </button>
          
          <button
            onClick={() => {
              // VÉRIFICATION AJOUTÉE : Empêcher l'accès si canDoPhase2 = false
              if (!canDoPhase2) {
                alert('⚠️ La simulation sera débloquée une fois que tous les jurys auront évalué la Phase 1 avec des résultats favorables.')
                return
              }
              setActivePhase(2)
            }}
            disabled={!canDoPhase2}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activePhase === 2
                ? 'bg-green-600 text-white shadow-lg'
                : canDoPhase2
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            Phase Simulation 
            {!canDoPhase2 && (
              <div className="text-xs mt-1">
                🔒 Débloquée après validation Phase Face à Face par tous les jurys
              </div>
            )}
          </button>
        </div>
      )}

      {/* PHASE 1 : FACE-À-FACE */}
      {activePhase === 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-700 font-bold text-sm">1</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Phase 1 - Face à Face</h2>
          </div>
          
          <form onSubmit={handleSubmitPhase1} className="space-y-6">
            {isAgences && (
              <ScoreButtons
                value={phase1Scores.presentation_visuelle}
                onChange={(score) => setPhase1Scores(prev => ({ 
                  ...prev, 
                  presentation_visuelle: score 
                }))}
                label="Présentation Visuelle (/5)"
                description=""
              />
            )}

            <ScoreButtons
              value={phase1Scores.verbal_communication}
              onChange={(score) => setPhase1Scores(prev => ({ 
                ...prev, 
                verbal_communication: score 
              }))}
              label="Communication Verbale (/5)"
              description=""
            />

            <ScoreButtons
              value={phase1Scores.voice_quality}
              onChange={(score) => setPhase1Scores(prev => ({ 
                ...prev, 
                voice_quality: score 
              }))}
              label="Qualité de la Voix (/5)"
              description=""
            />

            {/* Indicateur FAVORABLE/DEFAVORABLE */}
            {isPhase1Complete() && (
              <div className={`p-4 rounded-xl border-2 ${
                validatePhase1() 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Décision automatique:</span>
                  <span className={`text-xl font-bold ${
                    validatePhase1() ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {validatePhase1() ? '✅ FAVORABLE' : '❌ DÉFAVORABLE'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Critère: Toutes les notes ≥ 3/5
                </p>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Commentaires (optionnel)
              </label>
              <textarea
                value={phase1Scores.comments}
                onChange={(e) => setPhase1Scores(prev => ({ 
                  ...prev, 
                  comments: e.target.value 
                }))}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Observations détaillées..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isPhase1Complete()}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sauvegarder Face à Face
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* PHASE 2 : SIMULATION */}
      {activePhase === 2 && canDoPhase2 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-700 font-bold text-sm">2</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900"> Simulation de Vente </h2>
          </div>
          
          <form onSubmit={handleSubmitPhase2} className="space-y-6">
            <ScoreButtons
              value={phase2Scores.sens_negociation}
              onChange={(score) => setPhase2Scores(prev => ({ 
                ...prev, 
                sens_negociation: score 
              }))}
              label="Sens de la Négociation (/5)"
              description=""
            />

            <ScoreButtons
              value={phase2Scores.capacite_persuasion}
              onChange={(score) => setPhase2Scores(prev => ({ 
                ...prev, 
                capacite_persuasion: score 
              }))}
              label="Capacité de Persuasion (/5)"
              description=""
            />

            <ScoreButtons
              value={phase2Scores.sens_combativite}
              onChange={(score) => setPhase2Scores(prev => ({ 
                ...prev, 
                sens_combativite: score 
              }))}
              label="Sens de la Combativité (/5)"
              description=""
            />

            {/* Indicateur FAVORABLE/DEFAVORABLE */}
            {isPhase2Complete() && (
              <div className={`p-4 rounded-xl border-2 ${
                validatePhase2() 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Décision automatique:</span>
                  <span className={`text-xl font-bold ${
                    validatePhase2() ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {validatePhase2() ? '✅ FAVORABLE' : '❌ DÉFAVORABLE'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Critère: Toutes les notes ≥ 3/5
                </p>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Commentaires (optionnel)
              </label>
              <textarea
                value={phase2Scores.comments}
                onChange={(e) => setPhase2Scores(prev => ({ 
                  ...prev, 
                  comments: e.target.value 
                }))}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Observations sur la simulation..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isPhase2Complete()}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sauvegarder Phase Simulation
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}