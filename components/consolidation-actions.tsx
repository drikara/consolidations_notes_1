// components/consolidation-actions.tsx
'use client'

import { useState } from 'react'
// ⭐ CORRECTION: Import correct
import { ConsolidationResultData } from "@/lib/consolidation"

interface ConsolidationActionsProps {
  candidateId: number
  consolidationResult?: ConsolidationResultData
}

export function ConsolidationActions({ candidateId, consolidationResult }: ConsolidationActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleFinalDecision = async (decision: 'ADMIS' | 'NON_ADMIS') => {
    setIsLoading(true)
    try {
      // Implémentez votre logique pour sauvegarder la décision finale
      console.log(`Décision ${decision} pour le candidat ${candidateId}`)
      
      // Exemple d'appel API
      // await fetch(`/api/candidates/${candidateId}/decision`, {
      //   method: 'POST',
      //   body: JSON.stringify({ decision })
      // })
      
      alert(`Décision ${decision} enregistrée avec succès!`)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'enregistrement de la décision')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {consolidationResult && (
        <div className={`p-3 rounded-lg ${
          consolidationResult.isAdmitted 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <p className="font-medium">
            Résultat de la consolidation: {consolidationResult.isAdmitted ? '✅ ADMIS' : '❌ NON ADMIS'}
          </p>
        </div>
      )}
      
      <div className="flex gap-4">
        <button
          onClick={() => handleFinalDecision('ADMIS')}
          disabled={isLoading}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Enregistrement...' : '✅ Valider Admission'}
        </button>
        
        <button
          onClick={() => handleFinalDecision('NON_ADMIS')}
          disabled={isLoading}
          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Enregistrement...' : '❌ Refuser'}
        </button>
      </div>
      
      <p className="text-sm text-gray-600">
        La consolidation est calculée automatiquement basée sur les scores des tests techniques et des évaluations face à face.
      </p>
    </div>
  )
}