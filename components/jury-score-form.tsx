// components/jury-score-form.tsx
'use client'

import { useState } from 'react'
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
    comments?: string | null
  }>
}

export function JuryScoreForm({ candidate, juryMember, existingScores }: JuryScoreFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState({
    phase1: existingScores.find(s => s.phase === 1)?.score?.toString() || '',
    phase2: existingScores.find(s => s.phase === 2)?.score?.toString() || '',
    comments1: existingScores.find(s => s.phase === 1)?.comments || '',
    comments2: existingScores.find(s => s.phase === 2)?.comments || '',
  })

  const handleSubmit = async (e: React.FormEvent, phase: number) => {
    e.preventDefault()
    
    // VÉRIFICATION DE LA SESSION AVANT TOUTE NOTATION
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

    // VALIDATION DU SCORE
    const scoreValue = phase === 1 ? scores.phase1 : scores.phase2
    const scoreNumber = parseFloat(scoreValue)
    
    if (isNaN(scoreNumber) || scoreNumber < 0 || scoreNumber > 5) {
      alert('Le score doit être un nombre entre 0 et 5')
      setLoading(false)
      return
    }

    const scoreData = {
      candidate_id: candidate.id,
      phase,
      score: scoreNumber,
      comments: phase === 1 ? scores.comments1 : scores.comments2,
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

  return (
    <div className="space-y-8">
      {/* Phase 1 - Entretien Comportemental */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Phase 1 - Entretien Comportemental</h2>
        <form onSubmit={(e) => handleSubmit(e, 1)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Note sur 5 points
            </label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={scores.phase1}
              onChange={(e) => setScores(prev => ({ ...prev, phase1: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              Utilisez des demi-points si nécessaire (ex: 3.5)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Commentaires (optionnel)
            </label>
            <textarea
              value={scores.comments1}
              onChange={(e) => setScores(prev => ({ ...prev, comments1: e.target.value }))}
              rows={3}
              className="w-full p-2 border rounded"
              placeholder="Observations sur la présentation, motivation, attitude..."
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Critères d'évaluation Phase 1</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Présentation et communication (20%)</li>
              <li>• Motivation et attitude (30%)</li>
              <li>• Réponses aux questions RH (50%)</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || scores.phase1 === ''}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder Phase 1'}
          </button>
        </form>
      </div>

      {/* Phase 2 - Évaluation Technique */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Phase 2 - Évaluation Technique</h2>
        <form onSubmit={(e) => handleSubmit(e, 2)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Note sur 5 points
            </label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={scores.phase2}
              onChange={(e) => setScores(prev => ({ ...prev, phase2: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              Utilisez des demi-points si nécessaire (ex: 3.5)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Commentaires (optionnel)
            </label>
            <textarea
              value={scores.comments2}
              onChange={(e) => setScores(prev => ({ ...prev, comments2: e.target.value }))}
              rows={3}
              className="w-full p-2 border rounded"
              placeholder="Observations sur les connaissances techniques, résolution de cas..."
            />
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Critères d'évaluation Phase 2</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Connaissances techniques du métier (40%)</li>
              <li>• Résolution de cas pratiques (40%)</li>
              <li>• Compréhension des processus (20%)</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || scores.phase2 === ''}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder Phase 2'}
          </button>
        </form>
      </div>

      {/* Informations générales */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Instructions importantes</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Chaque phase doit être évaluée séparément</li>
          <li>• La note est sur 5 points avec possibilité de demi-points</li>
          <li>• Les commentaires aident à justifier la décision</li>
          <li>• Vous pouvez modifier vos évaluations à tout moment</li>
          <li>• Seul le WFM a accès aux tests techniques</li>
          <li>• Évaluation possible uniquement pendant les sessions actives</li>
        </ul>
      </div>
    </div>
  )
}