// components/consolidation-button.tsx
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
      className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Traitement...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Appliquer la Consolidation Automatique
        </>
      )}
    </button>
  )
}