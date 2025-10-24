"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

type ConsolidationPanelProps = {
  candidateId: number
  metier: string
}

export function ConsolidationPanel({ candidateId, metier }: ConsolidationPanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [consolidation, setConsolidation] = useState<any>(null)
  const [error, setError] = useState("")

  const fetchConsolidation = async () => {
    try {
      const response = await fetch(`/api/consolidation/${candidateId}`)
      if (response.ok) {
        const data = await response.json()
        setConsolidation(data.consolidation)
      }
    } catch (err) {
      console.error("[v0] Error fetching consolidation:", err)
    }
  }

  useEffect(() => {
    fetchConsolidation()
  }, [candidateId])

  const handleApplyConsolidation = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/consolidation/${candidateId}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la consolidation")
      }

      const data = await response.json()
      alert(`Décision finale appliquée : ${data.finalDecision}`)
      router.refresh()
      fetchConsolidation()
    } catch (err) {
      setError("Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  if (!consolidation) {
    return (
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Consolidation Automatique</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement de la consolidation...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="text-foreground">Consolidation Automatique - {metier}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Result Summary */}
        <div
          className={`p-4 rounded-lg ${
            consolidation.isAdmitted ? "bg-green-50 border-2 border-green-200" : "bg-red-50 border-2 border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Décision Automatique</p>
              <p className={`text-2xl font-bold mt-1 ${consolidation.isAdmitted ? "text-green-700" : "text-red-700"}`}>
                {consolidation.isAdmitted ? "RECRUTÉ" : "NON RECRUTÉ"}
              </p>
            </div>
            <div className={`p-3 rounded-full ${consolidation.isAdmitted ? "bg-green-100" : "bg-red-100"}`}>
              {consolidation.isAdmitted ? (
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Face to Face Average */}
        {consolidation.faceToFaceAverage !== null && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Moyenne Face à Face</p>
            <p className="text-xl font-bold text-foreground mt-1">{consolidation.faceToFaceAverage.toFixed(2)}/5</p>
          </div>
        )}

        {/* Criteria Details */}
        <div className="space-y-2">
          <h4 className="font-medium text-foreground">Détails des Critères</h4>
          <div className="space-y-2">
            {consolidation.details.map((detail: any, index: number) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  detail.passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex-1">
                  <p className={`font-medium ${detail.passed ? "text-green-700" : "text-red-700"}`}>
                    {detail.criterion}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Requis : {detail.required} • Obtenu : {detail.actual !== null ? detail.actual : "N/A"}
                  </p>
                </div>
                <div>
                  {detail.passed ? (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-green-700">Critères Validés</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{consolidation.passedCriteria.length}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-red-700">Critères Non Validés</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{consolidation.failedCriteria.length}</p>
          </div>
        </div>

        {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

        <Button
          onClick={handleApplyConsolidation}
          className="w-full bg-primary hover:bg-accent text-primary-foreground"
          disabled={loading}
        >
          {loading ? "Application..." : "Appliquer la Décision Automatique"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Cette décision est calculée automatiquement selon les critères du métier {metier}
        </p>
      </CardContent>
    </Card>
  )
}
