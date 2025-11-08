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
  existingScores: Array<{
    phase: number
    score: number
    presentation_visuelle?: number | null
    verbal_communication?: number | null
    voice_quality?: number | null
    comments?: string | null
  }>
}

export function JuryScoreForm({ candidate, juryMember, existingScores }: JuryScoreFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [phase1Scores, setPhase1Scores] = useState({
    presentation_visuelle: '',
    verbal_communication: '',
    voice_quality: '',
    comments1: '',
  })
  const [phase2Scores, setPhase2Scores] = useState({
    phase2: '',
    comments2: '',
  })

  useEffect(() => {
    const loadExistingScores = async () => {
      try {
        const response = await fetch(`/api/jury/scores?candidateId=${candidate.id}`)
        if (response.ok) {
          const scores = await response.json()
          const phase1Score = scores.find((s: any) => s.phase === 1)
          const phase2Score = scores.find((s: any) => s.phase === 2)
          
          if (phase1Score) {
            setPhase1Scores({
              presentation_visuelle: phase1Score.presentation_visuelle?.toString() || '',
              verbal_communication: phase1Score.verbal_communication?.toString() || '',
              voice_quality: phase1Score.voice_quality?.toString() || '',
              comments1: phase1Score.comments || '',
            })
          }
          
          if (phase2Score) {
            setPhase2Scores({
              phase2: phase2Score.score?.toString() || '',
              comments2: phase2Score.comments || '',
            })
          }
        }
      } catch (error) {
        console.error('Erreur chargement scores:', error)
      }
    }

    loadExistingScores()
  }, [candidate.id])

  const calculatePhase1Average = () => {
    const presentation = parseFloat(phase1Scores.presentation_visuelle) || 0
    const verbal = parseFloat(phase1Scores.verbal_communication) || 0
    const voice = parseFloat(phase1Scores.voice_quality) || 0
    
    if (presentation === 0 && verbal === 0 && voice === 0) return 0
    
    return (presentation + verbal + voice) / 3
  }

  const handleSubmit = async (e: React.FormEvent, phase: number) => {
    e.preventDefault()
    
    try {
      const sessionCheck = await fetch(`/api/jury/check-session/${candidate.id}`)
      const sessionData = await sessionCheck.json()
      
      if (!sessionData.canEvaluate) {
        alert(`La session de recrutement est ${sessionData.sessionStatus?.toLowerCase()}. Vous ne pouvez plus noter ce candidat.`)
        return
      }
    } catch (error) {
      console.error('Erreur vérification session:', error)
      alert('Erreur de vérification de la session. Veuillez réessayer.')
      return
    }
    
    setLoading(true)

    let scoreNumber: number
    let comments: string

    if (phase === 1) {
      const presentation = parseFloat(phase1Scores.presentation_visuelle)
      const verbal = parseFloat(phase1Scores.verbal_communication)
      const voice = parseFloat(phase1Scores.voice_quality)
      
      if (isNaN(presentation) || presentation < 0 || presentation > 5 ||
          isNaN(verbal) || verbal < 0 || verbal > 5 ||
          isNaN(voice) || voice < 0 || voice > 5) {
        alert('Tous les scores doivent être des nombres entre 0 et 5')
        setLoading(false)
        return
      }
      
      scoreNumber = calculatePhase1Average()
      comments = phase1Scores.comments1
    } else {
      scoreNumber = parseFloat(phase2Scores.phase2)
      if (isNaN(scoreNumber) || scoreNumber < 0 || scoreNumber > 5) {
        alert('Le score doit être un nombre entre 0 et 5')
        setLoading(false)
        return
      }
      comments = phase2Scores.comments2
    }

    const scoreData = {
      candidate_id: candidate.id,
      phase,
      score: scoreNumber,
      comments,
      ...(phase === 1 && {
        presentation_visuelle: parseFloat(phase1Scores.presentation_visuelle),
        verbal_communication: parseFloat(phase1Scores.verbal_communication),
        voice_quality: parseFloat(phase1Scores.voice_quality)
      })
    }

    try {
      const response = await fetch('/api/jury/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData),
      })

      if (response.ok) {
        router.refresh()
        alert(`Phase ${phase} sauvegardée avec succès!`)
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving score:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const phase1Average = calculatePhase1Average()

  return (
    <div className="space-y-8">
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

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-700 font-bold text-sm">1</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Phase 1 - Entretien Initial</h2>
        </div>
        
        <form onSubmit={(e) => handleSubmit(e, 1)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Présentation Visuelle (/5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={phase1Scores.presentation_visuelle}
                onChange={(e) => setPhase1Scores(prev => ({ 
                  ...prev, 
                  presentation_visuelle: e.target.value 
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
                placeholder="0-5"
              />
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700 font-medium">Tenue, posture, contact visuel</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Communication Verbale (/5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={phase1Scores.verbal_communication}
                onChange={(e) => setPhase1Scores(prev => ({ 
                  ...prev, 
                  verbal_communication: e.target.value 
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
                placeholder="0-5"
              />
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700 font-medium">Clarté, structure, expression</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Qualité de la Voix (/5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={phase1Scores.voice_quality}
                onChange={(e) => setPhase1Scores(prev => ({ 
                  ...prev, 
                  voice_quality: e.target.value 
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
                placeholder="0-5"
              />
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700 font-medium">Ton, débit, articulation</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-4 rounded-xl border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold text-blue-900">Moyenne calculée Phase 1</span>
                <p className="text-sm text-blue-700">Moyenne des 3 critères</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-700">
                  {phase1Average.toFixed(2)}
                </span>
                <span className="text-blue-600 font-medium">/5</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Commentaires (optionnel)
            </label>
            <textarea
              value={phase1Scores.comments1}
              onChange={(e) => setPhase1Scores(prev => ({ 
                ...prev, 
                comments1: e.target.value 
              }))}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Observations détaillées sur la présentation, communication, qualité vocale..."
            />
          </div>

          <button
            type="submit"
            disabled={loading || !phase1Scores.presentation_visuelle || !phase1Scores.verbal_communication || !phase1Scores.voice_quality}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
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
                Sauvegarder l'Évaluation Phase 1
              </>
            )}
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-green-700 font-bold text-sm">2</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Phase 2 - Évaluation Technique</h2>
        </div>

        <form onSubmit={(e) => handleSubmit(e, 2)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Note Globale sur 5 points
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={phase2Scores.phase2}
                onChange={(e) => setPhase2Scores(prev => ({ ...prev, phase2: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                required
                placeholder="0-5"
              />
              <p className="text-sm text-gray-600">
                Utilisez des demi-points si nécessaire (ex: 3.5)
              </p>
            </div>

            <div className="flex items-center justify-center">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-700 font-medium text-sm">Note actuelle: {phase2Scores.phase2 || '0'}/5</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Commentaires (optionnel)
            </label>
            <textarea
              value={phase2Scores.comments2}
              onChange={(e) => setPhase2Scores(prev => ({ ...prev, comments2: e.target.value }))}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
              placeholder="Observations sur les connaissances techniques, résolution de cas, compétences métier..."
            />
          </div>

          <button
            type="submit"
            disabled={loading || phase2Scores.phase2 === ''}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
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
                Sauvegarder l'Évaluation Phase 2
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}