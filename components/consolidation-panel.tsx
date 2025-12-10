// components/consolidation-panel.tsx
"use client"

import { useState } from "react"

interface ConsolidationButtonProps {
  candidateId: number
}

export function ConsolidationButton({ candidateId }: ConsolidationButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleConsolidation = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/candidates/${candidateId}/consolidation`, {
        method: 'POST'
      })
      if (response.ok) {
        // Rafraîchir la page
        window.location.reload()
      } else {
        console.error("Erreur lors de la consolidation")
      }
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleConsolidation}
      disabled={loading}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Traitement..." : "Appliquer la Consolidation Automatique"}
    </button>
  )
}