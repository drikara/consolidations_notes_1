"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ConsolidationButton } from "@/components/consolidation-button"
import { Metier } from "@prisma/client"
import { calculateAutoDecisions, shouldShowTest } from "../lib/metier-utils"

type WFMScoreFormProps = {
  candidate: any
  score: any
  faceToFaceScores: any[]
}

export function WFMScoreForm({ candidate, score, faceToFaceScores }: WFMScoreFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [autoCalculated, setAutoCalculated] = useState(false)

  const [formData, setFormData] = useState({
    presentation_visuelle: score?.presentation_visuelle?.toString() || "",
    voice_quality: score?.voice_quality?.toString() || "",
    verbal_communication: score?.verbal_communication?.toString() || "",
    phase1_ff_decision: score?.phase1_ff_decision || "",
    psychotechnical_test: score?.psychotechnical_test?.toString() || "",
    phase1_decision: score?.phase1_decision || "",
    typing_speed: score?.typing_speed?.toString() || "",
    typing_accuracy: score?.typing_accuracy?.toString() || "",
    excel_test: score?.excel_test?.toString() || "",
    dictation: score?.dictation?.toString() || "",
    sales_simulation: score?.sales_simulation?.toString() || "",
    analysis_exercise: score?.analysis_exercise?.toString() || "",
    phase2_date: score?.phase2_date || "",
    phase2_ff_decision: score?.phase2_ff_decision || "",
    final_decision: score?.final_decision || "",
    comments: score?.comments || "",
  })

  // Calcul automatique des décisions
  useEffect(() => {
    const hasPhase1Scores = formData.presentation_visuelle || formData.verbal_communication || formData.voice_quality
    const hasPhase2Scores = formData.typing_speed || formData.excel_test || formData.dictation || 
                           formData.sales_simulation || formData.analysis_exercise

    if (hasPhase1Scores || hasPhase2Scores) {
      calculateAutoDecisionsHandler()
    }
  }, [
    formData.presentation_visuelle,
    formData.verbal_communication, 
    formData.voice_quality,
    formData.typing_speed,
    formData.typing_accuracy,
    formData.excel_test,
    formData.dictation,
    formData.sales_simulation,
    formData.analysis_exercise
  ])

  const calculateAutoDecisionsHandler = () => {
    const scores = {
      presentation_visuelle: parseFloat(formData.presentation_visuelle) || 0,
      verbal_communication: parseFloat(formData.verbal_communication) || 0,
      voice_quality: parseFloat(formData.voice_quality) || 0,
      psychotechnical_test: parseFloat(formData.psychotechnical_test) || 0,
      typing_speed: parseInt(formData.typing_speed) || 0,
      typing_accuracy: parseFloat(formData.typing_accuracy) || 0,
      excel_test: parseFloat(formData.excel_test) || 0,
      dictation: parseFloat(formData.dictation) || 0,
      sales_simulation: parseFloat(formData.sales_simulation) || 0,
      analysis_exercise: parseFloat(formData.analysis_exercise) || 0,
    }

    const phase1FF = faceToFaceScores.filter((s) => s.phase === 1)
    const faceToFacePhase1Avg = phase1FF.length > 0 
      ? phase1FF.reduce((sum, s) => sum + Number(s.score), 0) / phase1FF.length 
      : 0

    const decisions = calculateAutoDecisions(
      candidate.metier as Metier,
      scores,
      faceToFacePhase1Avg
    )

    // FORCER les décisions défavorables si les critères ne sont pas respectés
    let updatedDecisions = { ...decisions }

    // Vérifier si la phase 1 est défavorable - conversion des types
    const phase1FfDecisionStr = decisions.phase1FfDecision?.toString() || ""
    const phase1DecisionStr = decisions.phase1Decision?.toString() || ""
    const phase2FfDecisionStr = decisions.phase2FfDecision?.toString() || ""

    if (phase1FfDecisionStr === "DÉFAVORABLE" || phase1DecisionStr === "ÉLIMINÉ") {
      updatedDecisions = {
        ...updatedDecisions,
        phase1FfDecision: "DÉFAVORABLE" as any,
        phase1Decision: "ÉLIMINÉ" as any,
        phase2FfDecision: "DÉFAVORABLE" as any, // Phase 2 automatiquement défavorable
        finalDecision: "NON_RECRUTE" as any // Final automatiquement non recruté
      }
    }

    // Si phase 1 est favorable mais phase 2 défavorable
    if (phase2FfDecisionStr === "DÉFAVORABLE" && phase1FfDecisionStr === "FAVORABLE") {
      updatedDecisions = {
        ...updatedDecisions,
        finalDecision: "NON_RECRUTE" as any // Final automatiquement non recruté
      }
    }

    setFormData(prev => ({
      ...prev,
      phase1_ff_decision: updatedDecisions.phase1FfDecision?.toString() || "",
      phase1_decision: updatedDecisions.phase1Decision?.toString() || "",
      phase2_ff_decision: updatedDecisions.phase2FfDecision?.toString() || "",
      final_decision: updatedDecisions.finalDecision?.toString() || ""
    }))

    setAutoCalculated(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`/api/scores/${candidate.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement")
      }

      router.refresh()
      alert("Notes enregistrées avec succès")
    } catch (err) {
      setError("Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Recalculer automatiquement les décisions après chaque changement
    setTimeout(() => {
      calculateAutoDecisionsHandler()
    }, 100)
  }

  // Calculate average Face to Face scores
  const phase1FF = faceToFaceScores.filter((s) => s.phase === 1)
  const phase2FF = faceToFaceScores.filter((s) => s.phase === 2)
  const avgPhase1 =
    phase1FF.length > 0 ? (phase1FF.reduce((sum, s) => sum + Number(s.score), 0) / phase1FF.length).toFixed(2) : "N/A"
  const avgPhase2 =
    phase2FF.length > 0 ? (phase2FF.reduce((sum, s) => sum + Number(s.score), 0) / phase2FF.length).toFixed(2) : "N/A"

  // Déterminer quels tests afficher selon le métier
  const showTypingTest = shouldShowTest(candidate.metier as Metier, 'typing')
  const showExcelTest = shouldShowTest(candidate.metier as Metier, 'excel')
  const showDictationTest = shouldShowTest(candidate.metier as Metier, 'dictation')
  const showSalesSimulationTest = shouldShowTest(candidate.metier as Metier, 'salesSimulation')
  const showPsychotechnicalTest = shouldShowTest(candidate.metier as Metier, 'psychotechnical')
  const showAnalysisExerciseTest = shouldShowTest(candidate.metier as Metier, 'analysisExercise')

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Évaluation du Candidat
            </h1>
            <p className="text-orange-700">
              {candidate.fullName} - {candidate.metier}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Face to Face Scores Summary */}
        <Card className="border-2 border-orange-200 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-200">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Notes Face à Face (Saisies par les Jurys)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border-2 border-blue-200">
                <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-700 font-bold text-sm">1</span>
                  </div>
                  Phase 1
                </h4>
                {phase1FF.length === 0 ? (
                  <div className="text-center py-4">
                    <svg className="w-8 h-8 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-blue-600 font-medium">Aucune note saisie</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {phase1FF.map((s) => (
                      <div key={s.id} className="flex justify-between items-start p-4 bg-white rounded-xl border border-blue-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">{s.jury_name}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{s.role_type}</span>
                          </div>
                          
                          {/* Afficher les scores détaillés */}
                          {(s.presentation_visuelle || s.verbal_communication || s.voice_quality) && (
                            <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
                              <div className="text-center p-2 bg-blue-50 rounded">
                                <div className="font-medium text-blue-700">Présentation</div>
                                <div className="text-blue-900 font-bold">
                                  {s.presentation_visuelle ? `${s.presentation_visuelle}/5` : 'N/A'}
                                </div>
                              </div>
                              <div className="text-center p-2 bg-blue-50 rounded">
                                <div className="font-medium text-blue-700">Communication</div>
                                <div className="text-blue-900 font-bold">
                                  {s.verbal_communication ? `${s.verbal_communication}/5` : 'N/A'}
                                </div>
                              </div>
                              <div className="text-center p-2 bg-blue-50 rounded">
                                <div className="font-medium text-blue-700">Voix</div>
                                <div className="text-blue-900 font-bold">
                                  {s.voice_quality ? `${s.voice_quality}/5` : 'N/A'}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {s.comments && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                              {s.comments}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold text-lg">{s.score}/5</span>
                          <p className="text-xs text-blue-600 mt-1">Moyenne</p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-blue-200 flex justify-between font-bold">
                      <span className="text-blue-800">Moyenne Phase 1</span>
                      <span className="text-blue-600">{avgPhase1}/5</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border-2 border-purple-200">
                <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-700 font-bold text-sm">2</span>
                  </div>
                  Phase 2
                </h4>
                {phase2FF.length === 0 ? (
                  <div className="text-center py-4">
                    <svg className="w-8 h-8 text-purple-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-purple-600 font-medium">Aucune note saisie</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {phase2FF.map((s) => (
                      <div key={s.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-purple-200">
                        <div>
                          <span className="font-medium text-gray-900">{s.jury_name}</span>
                          <p className="text-xs text-purple-600">{s.role_type}</p>
                        </div>
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg font-bold">{s.score}/5</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-purple-200 flex justify-between font-bold">
                      <span className="text-purple-800">Moyenne Phase 2</span>
                      <span className="text-purple-600">{avgPhase2}/5</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase 1 - Initial Interview */}
        <Card className="border-2 border-orange-200 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Phase 1 - Entretien Initial
            </CardTitle>
            {autoCalculated && (
              <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Décisions calculées automatiquement
              </p>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Présentation Visuelle */}
              <div className="space-y-3">
                <Label htmlFor="presentation_visuelle" className="text-gray-700 font-semibold">
                  Présentation Visuelle (/5)
                </Label>
                <Input
                  id="presentation_visuelle"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={formData.presentation_visuelle}
                  onChange={(e) => handleChange("presentation_visuelle", e.target.value)}
                  className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                  placeholder="0-5"
                />
              </div>

              {/* Communication Verbale */}
              <div className="space-y-3">
                <Label htmlFor="verbal_communication" className="text-gray-700 font-semibold">
                  Communication Verbale (/5)
                </Label>
                <Input
                  id="verbal_communication"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={formData.verbal_communication}
                  onChange={(e) => handleChange("verbal_communication", e.target.value)}
                  className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                  placeholder="0-5"
                />
              </div>

              {/* Qualité de la Voix */}
              <div className="space-y-3">
                <Label htmlFor="voice_quality" className="text-gray-700 font-semibold">
                  Qualité de la Voix (/5)
                </Label>
                <Input
                  id="voice_quality"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={formData.voice_quality}
                  onChange={(e) => handleChange("voice_quality", e.target.value)}
                  className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                  placeholder="0-5"
                />
              </div>

              {/* Test Psychotechnique - Conditionnel */}
              {showPsychotechnicalTest && (
                <div className="space-y-3">
                  <Label htmlFor="psychotechnical_test" className="text-gray-700 font-semibold">
                    Test Psychotechnique (/10)
                  </Label>
                  <Input
                    id="psychotechnical_test"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.psychotechnical_test}
                    onChange={(e) => handleChange("psychotechnical_test", e.target.value)}
                    className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                    placeholder="0-10"
                  />
                </div>
              )}

              {/* Décisions Phase 1 - Auto-calculées */}
              <div className="space-y-3">
                <Label htmlFor="phase1_ff_decision" className="text-gray-700 font-semibold">
                  Décision FF Phase 1 {autoCalculated && "✓"}
                </Label>
                <Select
                  value={formData.phase1_ff_decision}
                  onValueChange={(value) => handleChange("phase1_ff_decision", value)}
                >
                  <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-orange-50">
                    <SelectValue placeholder="Auto-calculé" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FAVORABLE" className="rounded-lg">FAVORABLE</SelectItem>
                    <SelectItem value="DÉFAVORABLE" className="rounded-lg">DÉFAVORABLE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="phase1_decision" className="text-gray-700 font-semibold">
                  Décision Phase 1 {autoCalculated && "✓"}
                </Label>
                <Select
                  value={formData.phase1_decision}
                  onValueChange={(value) => handleChange("phase1_decision", value)}
                >
                  <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-orange-50">
                    <SelectValue placeholder="Auto-calculé" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIS" className="rounded-lg">ADMIS</SelectItem>
                    <SelectItem value="ÉLIMINÉ" className="rounded-lg">ÉLIMINÉ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase 2 - Technical Tests */}
        {(showTypingTest || showExcelTest || showDictationTest || showSalesSimulationTest || showAnalysisExerciseTest) && (
          <Card className="border-2 border-orange-200 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Phase 2 - Épreuves Techniques
              </CardTitle>
              <p className="text-sm text-purple-600">
                Tests requis pour {candidate.metier}
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Saisie - Conditionnel */}
                {showTypingTest && (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="typing_speed" className="text-gray-700 font-semibold">
                        Rapidité de Saisie (MPM)
                      </Label>
                      <Input
                        id="typing_speed"
                        type="number"
                        min="0"
                        value={formData.typing_speed}
                        onChange={(e) => handleChange("typing_speed", e.target.value)}
                        className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                        placeholder="≥ 17 MPM"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="typing_accuracy" className="text-gray-700 font-semibold">
                        Précision de Saisie (%)
                      </Label>
                      <Input
                        id="typing_accuracy"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.typing_accuracy}
                        onChange={(e) => handleChange("typing_accuracy", e.target.value)}
                        className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                        placeholder="≥ 85%"
                      />
                    </div>
                  </>
                )}

                {/* Excel - Conditionnel */}
                {showExcelTest && (
                  <div className="space-y-3">
                    <Label htmlFor="excel_test" className="text-gray-700 font-semibold">
                      Test Excel (/5)
                    </Label>
                    <Input
                      id="excel_test"
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      value={formData.excel_test}
                      onChange={(e) => handleChange("excel_test", e.target.value)}
                      className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                      placeholder="≥ 3/5"
                    />
                  </div>
                )}

                {/* Dictée - Conditionnel */}
                {showDictationTest && (
                  <div className="space-y-3">
                    <Label htmlFor="dictation" className="text-gray-700 font-semibold">
                      Dictée (/20)
                    </Label>
                    <Input
                      id="dictation"
                      type="number"
                      step="0.01"
                      min="0"
                      max="20"
                      value={formData.dictation}
                      onChange={(e) => handleChange("dictation", e.target.value)}
                      className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                      placeholder="≥ 16/20"
                    />
                  </div>
                )}

                {/* Simulation Vente - Conditionnel */}
                {showSalesSimulationTest && (
                  <div className="space-y-3">
                    <Label htmlFor="sales_simulation" className="text-gray-700 font-semibold">
                      Simulation Vente (/5)
                    </Label>
                    <Input
                      id="sales_simulation"
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      value={formData.sales_simulation}
                      onChange={(e) => handleChange("sales_simulation", e.target.value)}
                      className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                      placeholder="≥ 3/5"
                    />
                  </div>
                )}

                {/* Exercice Analyse - Conditionnel */}
                {showAnalysisExerciseTest && (
                  <div className="space-y-3">
                    <Label htmlFor="analysis_exercise" className="text-gray-700 font-semibold">
                      Exercice d'Analyse (/10)
                    </Label>
                    <Input
                      id="analysis_exercise"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formData.analysis_exercise}
                      onChange={(e) => handleChange("analysis_exercise", e.target.value)}
                      className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                      placeholder="≥ 6/10"
                    />
                  </div>
                )}

                {/* Champs communs Phase 2 */}
                <div className="space-y-3">
                  <Label htmlFor="phase2_date" className="text-gray-700 font-semibold">
                    Date Présence Phase 2
                  </Label>
                  <Input
                    id="phase2_date"
                    type="date"
                    value={formData.phase2_date}
                    onChange={(e) => handleChange("phase2_date", e.target.value)}
                    className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phase2_ff_decision" className="text-gray-700 font-semibold">
                    Décision FF Phase 2 {autoCalculated && "✓"}
                  </Label>
                  <Select
                    value={formData.phase2_ff_decision}
                    onValueChange={(value) => handleChange("phase2_ff_decision", value)}
                  >
                    <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-orange-50">
                      <SelectValue placeholder="Auto-calculé" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FAVORABLE" className="rounded-lg">FAVORABLE</SelectItem>
                      <SelectItem value="DÉFAVORABLE" className="rounded-lg">DÉFAVORABLE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Final Decision */}
        <Card className="border-2 border-orange-200 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b-2 border-emerald-200">
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Décision Finale
            </CardTitle>
            {autoCalculated && (
              <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Décision finale calculée automatiquement
              </p>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="final_decision" className="text-gray-700 font-semibold">
                  Décision Finale {autoCalculated && "✓"}
                </Label>
                <Select value={formData.final_decision} onValueChange={(value) => handleChange("final_decision", value)}>
                  <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-orange-50">
                    <SelectValue placeholder="Auto-calculé" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECRUTE" className="rounded-lg">RECRUTE</SelectItem>
                    <SelectItem value="NON_RECRUTE" className="rounded-lg">NON RECRUTE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="comments" className="text-gray-700 font-semibold">
                Commentaires
              </Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => handleChange("comments", e.target.value)}
                rows={4}
                className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors resize-none"
                placeholder="Commentaires supplémentaires..."
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-4 border-2 border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()} 
            className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 rounded-xl px-6 py-3 font-semibold transition-all duration-200"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg hover:shadow-xl rounded-xl px-6 py-3 font-semibold transition-all duration-200 disabled:opacity-50" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enregistrement...
              </div>
            ) : (
              "Enregistrer les Notes"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}