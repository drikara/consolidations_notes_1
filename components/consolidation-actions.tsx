// components/consolidation-actions.tsx
'use client'

import { useState } from 'react'

interface ConsolidationActionsProps {
  candidateId: number
}

export function ConsolidationActions({ candidateId }: ConsolidationActionsProps) {
  const [loading, setLoading] = useState(false)

  const handleConsolidation = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/candidates/${candidateId}/consolidation`, {
        method: 'POST'
      })
      
      if (response.ok) {
        alert('Consolidation appliquée avec succès!')
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Error during consolidation:', error)
      alert('Erreur lors de la consolidation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <button 
        onClick={handleConsolidation}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Application...' : 'Appliquer la Consolidation Automatique'}
      </button>
      
      <p className="text-sm text-muted-foreground">
        Cette action calculera automatiquement la décision finale basée sur les critères du métier.
      </p>
    </div>
  )
}