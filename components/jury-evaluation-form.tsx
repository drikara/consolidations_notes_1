"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Metier, FFDecision } from "@prisma/client"
import { shouldShowTest, getMetierConfig } from "../lib/metier-utils"

//  Interface mise à jour pour correspondre à l'utilisation
interface JuryEvaluationFormProps {
  candidate: {
    id: number
    name: string
    metier?: string
  }
  existingScore?: {
    presentationVisuelle?: number
    verbalCommunication?: number
    voiceQuality?: number
    score: number
    comments?: string
  }
}

export function JuryEvaluationForm({ candidate, existingScore }: JuryEvaluationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [decision, setDecision] = useState<FFDecision | null>(null)

  const [formData, setFormData] = useState({
    voiceQuality: existingScore?.voiceQuality?.toString() || "",
    verbalCommunication: existingScore?.verbalCommunication?.toString() || "",
    presentationVisuelle: existingScore?.presentationVisuelle?.toString() || "",
    comments: existingScore?.comments || "",
  })

  // Vérifier que le candidat a un ID
  useEffect(() => {
    if (!candidate.id) {
      console.error("❌ ERREUR CRITIQUE: candidate.id est undefined!")
      setError("ID candidat manquant - Impossible de sauvegarder")
    }
  }, [candidate.id])

  // Validation en temps réel
  useEffect(() => {
    const voiceQuality = parseFloat(formData.voiceQuality) || 0
    const verbalCommunication = parseFloat(formData.verbalCommunication) || 0
    const presentationVisuelle = parseFloat(formData.presentationVisuelle) || 0

    if (candidate.metier === 'AGENCES') {
      // Pour AGENCES: 3 critères
      if (voiceQuality >= 3 && verbalCommunication >= 3 && presentationVisuelle >= 3) {
        setDecision('FAVORABLE')
      } else {
        setDecision('DEFAVORABLE')
      }
    } else {
      // Pour autres métiers: 2 critères
      if (voiceQuality >= 3 && verbalCommunication >= 3) {
        setDecision('FAVORABLE')
      } else {
        setDecision('DEFAVORABLE')
      }
    }
  }, [formData.voiceQuality, formData.verbalCommunication, formData.presentationVisuelle, candidate.metier])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // VÉRIFICATION CRITIQUE
      if (!candidate.id) {
        throw new Error("ID candidat manquant - Veuillez rafraîchir la page")
      }

      // Convertir les données au FORMAT EXACT attendu par l'API
      const formDataToSend = {
        candidate_id: candidate.id, //  SNAKE_CASE obligatoire!
        presentation_visuelle: parseFloat(formData.presentationVisuelle) || 0,
        verbal_communication: parseFloat(formData.verbalCommunication) || 0,
        voice_quality: parseFloat(formData.voiceQuality) || 0,
        comments: formData.comments || ""
      }

      console.log(" Données envoyées à l'API:", formDataToSend)

      // ENVOYER À LA BONNE ROUTE - SANS L'ID DANS L'URL!
      const response = await fetch(`/api/jury/scores`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify(formDataToSend),
      })

      console.log(" Réponse HTTP:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(" Réponse API en erreur:", errorText)
        
        let errorMessage = "Erreur lors de l'enregistrement"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log(" Réponse API succès:", result)

      // Redirection avec confirmation
      alert("Évaluation enregistrée avec succès")
      router.push("/jury/evaluations")
      router.refresh()
      
    } catch (err) {
      console.error("❌ Erreur complète:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const config = candidate.metier ? getMetierConfig(candidate.metier as Metier) : null
  const showPresentationVisuelle = candidate.metier === 'AGENCES'

  // Afficher un loader pendant l'enregistrement
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Enregistrement en cours...</p>
          <p className="text-sm text-gray-500">Veuillez patienter</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-2 border-blue-200 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          Évaluation Face à Face
        </CardTitle>
        <p className="text-sm text-blue-600">
          Candidat: {candidate.name} - {candidate.metier || '0'}
        </p>
        <p className="text-xs text-gray-500">
          ID Candidat: {candidate.id || 'Non défini'}
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Afficher les erreurs critiques */}
          {!candidate.id && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-700 font-medium">
                 ID candidat manquant. Veuillez rafraîchir la page.
              </p>
            </div>
          )}

          {/* Qualité de la Voix */}
          <div className="space-y-3">
            <Label htmlFor="voiceQuality" className="text-gray-700 font-semibold">
              Qualité de la Voix (1-5) *
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleChange("voiceQuality", num.toString())}
                  className={`py-3 rounded-lg border-2 font-bold transition-all ${
                    parseFloat(formData.voiceQuality) === num
                      ? num >= 3
                        ? "bg-green-100 text-green-700 border-green-400"
                        : "bg-red-100 text-red-700 border-red-400"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm">
              <span className={parseFloat(formData.voiceQuality) >= 3 ? "text-green-600 font-semibold" : "text-gray-600"}>
                ≥ 3/5 requis
              </span>
              <span className="text-blue-600">
                Saisie: {formData.voiceQuality || "0"}/5
              </span>
            </div>
          </div>

          {/* Communication Verbale */}
          <div className="space-y-3">
            <Label htmlFor="verbalCommunication" className="text-gray-700 font-semibold">
              Communication Verbale (1-5) *
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleChange("verbalCommunication", num.toString())}
                  className={`py-3 rounded-lg border-2 font-bold transition-all ${
                    parseFloat(formData.verbalCommunication) === num
                      ? num >= 3
                        ? "bg-green-100 text-green-700 border-green-400"
                        : "bg-red-100 text-red-700 border-red-400"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm">
              <span className={parseFloat(formData.verbalCommunication) >= 3 ? "text-green-600 font-semibold" : "text-gray-600"}>
                ≥ 3/5 requis
              </span>
              <span className="text-blue-600">
                Saisie: {formData.verbalCommunication || "0"}/5
              </span>
            </div>
          </div>

          {/* Présentation Visuelle (AGENCES seulement) */}
          {showPresentationVisuelle && (
            <div className="space-y-3">
              <Label htmlFor="presentationVisuelle" className="text-gray-700 font-semibold">
                Présentation Visuelle (1-5) * - AGENCES uniquement
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleChange("presentationVisuelle", num.toString())}
                    className={`py-3 rounded-lg border-2 font-bold transition-all ${
                      parseFloat(formData.presentationVisuelle) === num
                        ? num >= 3
                          ? "bg-green-100 text-green-700 border-green-400"
                          : "bg-red-100 text-red-700 border-red-400"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-sm">
                <span className={parseFloat(formData.presentationVisuelle) >= 3 ? "text-green-600 font-semibold" : "text-gray-600"}>
                  ≥ 3/5 requis
                </span>
                <span className="text-blue-600">
                  Saisie: {formData.presentationVisuelle || "0"}/5
                </span>
              </div>
            </div>
          )}

          {/* Décision en temps réel */}
          <div className={`p-4 rounded-xl border-2 ${
            decision === 'FAVORABLE' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-800">Décision Face à Face</h4>
                <p className="text-sm text-gray-600">
                  Basée sur vos notes
                </p>
              </div>
              <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
                decision === 'FAVORABLE' 
                  ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                  : 'bg-red-100 text-red-700 border-2 border-red-300'
              }`}>
                {decision === 'FAVORABLE' ? '✅ FAVORABLE' : '❌ DÉFAVORABLE'}
              </div>
            </div>
            
            {/* Détails des critères */}
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  parseFloat(formData.voiceQuality) >= 3 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span>Qualité voix: {formData.voiceQuality || "0"}/5 {parseFloat(formData.voiceQuality) >= 3 ? '✅' : '❌'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  parseFloat(formData.verbalCommunication) >= 3 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span>Communication: {formData.verbalCommunication || "0"}/5 {parseFloat(formData.verbalCommunication) >= 3 ? '✅' : '❌'}</span>
              </div>
              {showPresentationVisuelle && (
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    parseFloat(formData.presentationVisuelle) >= 3 ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span>Présentation: {formData.presentationVisuelle || "0"}/5 {parseFloat(formData.presentationVisuelle) >= 3 ? '✅' : '❌'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Commentaires */}
          <div className="space-y-3">
            <Label htmlFor="comments" className="text-gray-700 font-semibold">
              Commentaires (optionnel)
            </Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => handleChange("comments", e.target.value)}
              rows={3}
              className="border-2 border-blue-200 focus:border-blue-400 focus:ring-blue-200 rounded-xl p-3 bg-white transition-colors resize-none"
              placeholder="Observations, points forts, points d'amélioration..."
            />
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-700 font-medium flex items-center gap-2">
                <span>❌</span>
                {error}
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl px-6 py-3 font-semibold cursor-pointer"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg rounded-xl px-6 py-3 font-semibold disabled:opacity-50"
              disabled={loading || !decision || !candidate.id}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </div>
              ) : (
                `Valider - ${decision === 'FAVORABLE' ? 'Favorable' : 'Défavorable'}`
              )}
            </Button>
          </div>

          {/* Debug info (visible seulement en dev)
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-50 border border-gray-300 rounded-lg text-xs">
              <p className="font-bold mb-2">🧪 DEBUG INFO:</p>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify({
                  candidateId: candidate.id,
                  formData,
                  decision,
                  showPresentationVisuelle
                }, null, 2)}
              </pre>
            </div>
          )} */}
        </form>
      </CardContent>
    </Card>
  )
}